const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
const Student = require("../src/modules/student/studentModels");
const Class = require("../src/modules/class/classSchema");
const Section = require("../src/modules/section/sectionSchema");
const School = require("../src/models/School");
const {
  resolveClassSectionCapacity,
  resolveClassAndSection,
  getAssignedRollNumbers,
  findSmallestAvailableRollNumber,
  allocateNextRollNumber,
  validateManualRollNumber,
} = require("../src/modules/student/services/rollNumberService");
const { createStudent, updateStudent, getNextRollNumber } = require("../src/modules/student/studentControllers");

async function runTests() {
  console.log("=================================================================");
  console.log("      RUNNING ROLL NUMBER ALLOCATION & VALIDATION SUITE          ");
  console.log("=================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await main();
    console.log("Connected to database successfully");

    // 1. Setup a clean Test School, Classes, Sections
    let testSchool = await School.findOne({ name: "RollNumber Test School" });
    if (!testSchool) {
      testSchool = await School.create({
        name: "RollNumber Test School",
        ownerUserId: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId(),
      });
    }
    const schoolId = testSchool._id.toString();

    // Clean up test data for this school
    await Student.deleteMany({ schoolId });
    await Class.deleteMany({ schoolId });
    await Section.deleteMany({ schoolId });

    // Create Sections: A (cap 40), B (cap 40)
    const secA = await Section.create({ name: "A", capacity: 40, schoolId });
    const secB = await Section.create({ name: "B", capacity: 40, schoolId });
    const secSmall = await Section.create({ name: "Small", capacity: 3, schoolId });

    // Create Classes: Grade 8, Grade 9
    const grade8 = await Class.create({
      name: "Grade 8",
      sections: [secA._id, secB._id, secSmall._id],
      capacity: "40",
      schoolId,
    });
    const grade9 = await Class.create({
      name: "Grade 9",
      sections: [secA._id, secB._id],
      capacity: "40",
      schoolId,
    });

    // ── TEST 1: Grade 8 + Section A, Capacity = 40, No students → New student gets Roll 1 ──
    console.log("\n--- TEST 1: Empty Class/Section Auto-allocation ---");
    const next1 = await allocateNextRollNumber(schoolId, grade8._id, secA._id);
    assert(next1.rollNo === "1", `First student receives Roll 1 (got ${next1.rollNo})`);
    assert(next1.capacity === 40, `Capacity is 40 (got ${next1.capacity})`);

    // Create student with Roll 1
    const stu1 = await Student.create({
      schoolId,
      personalInfo: {
        name: "Student One",
        class: grade8._id,
        section: secA._id,
        rollNo: "1",
        stdId: "TEST001",
        username: "test_stu1",
        password: "password123",
      },
    });
    assert(Boolean(stu1), "Student 1 created successfully");

    // ── TEST 2: Existing: 1, 2, 3, 5 → New student gets Roll 4 ──
    console.log("\n--- TEST 2: Gap filling (1, 2, 3, 5 -> 4) ---");
    await Student.create([
      {
        schoolId,
        personalInfo: {
          name: "Student Two",
          class: grade8._id,
          section: secA._id,
          rollNo: "2",
          stdId: "TEST002",
          username: "test_stu2",
          password: "password123",
        },
      },
      {
        schoolId,
        personalInfo: {
          name: "Student Three",
          class: grade8._id,
          section: secA._id,
          rollNo: "3",
          stdId: "TEST003",
          username: "test_stu3",
          password: "password123",
        },
      },
      {
        schoolId,
        personalInfo: {
          name: "Student Five",
          class: grade8._id,
          section: secA._id,
          rollNo: "5",
          stdId: "TEST005",
          username: "test_stu5",
          password: "password123",
        },
      },
    ]);

    const nextGap = await allocateNextRollNumber(schoolId, grade8._id, secA._id);
    assert(nextGap.rollNo === "4", `Gap allocation correctly found Roll 4 (got ${nextGap.rollNo})`);

    // ── TEST 3: Grade 8 + Section A, Roll 11 already exists → Another student cannot receive Roll 11 ──
    console.log("\n--- TEST 3: Duplicate Roll Number rejection in same Class + Section ---");
    await Student.create({
      schoolId,
      personalInfo: {
        name: "Student Eleven",
        class: grade8._id,
        section: secA._id,
        rollNo: "11",
        stdId: "TEST011",
        username: "test_stu11",
        password: "password123",
      },
    });

    let duplicateRejected = false;
    try {
      await validateManualRollNumber(schoolId, grade8._id, secA._id, "11");
    } catch (e) {
      duplicateRejected = true;
      assert(e.statusCode === 409, `Duplicate roll 11 rejected with 409 status (message: "${e.message}")`);
    }
    assert(duplicateRejected, "Duplicate roll number 11 in Grade 8 Section A correctly rejected");

    // Also verify database-level compound index prevents duplicate insert directly
    let dbIndexRejected = false;
    try {
      await Student.create({
        schoolId,
        personalInfo: {
          name: "Duplicate Student",
          class: grade8._id,
          section: secA._id,
          rollNo: "11",
          stdId: "TEST_DUP",
          username: "test_dup",
          password: "password123",
        },
      });
    } catch (dbErr) {
      dbIndexRejected = dbErr.code === 11000;
      assert(dbIndexRejected, "Database compound index rejected duplicate key error 11000");
    }

    // ── TEST 4: Grade 8 + Section B, Roll 11 exists in Section A → Roll 11 should still be allowed in Section B ──
    console.log("\n--- TEST 4: Same Roll Number in different section allowed ---");
    const valSecB = await validateManualRollNumber(schoolId, grade8._id, secB._id, "11");
    assert(valSecB.valid === true && valSecB.rollNo === "11", "Roll 11 is allowed in Grade 8 Section B");

    // ── TEST 5: Grade 9 + Section A, Roll 11 exists in Grade 8 + Section A → Roll 11 should be allowed ──
    console.log("\n--- TEST 5: Same Roll Number in different class allowed ---");
    const valGrade9 = await validateManualRollNumber(schoolId, grade9._id, secA._id, "11");
    assert(valGrade9.valid === true && valGrade9.rollNo === "11", "Roll 11 is allowed in Grade 9 Section A");

    // ── TEST 6: Capacity = 3, Roll Numbers 1..3 occupied → New student must NOT get Roll 4 ──
    console.log("\n--- TEST 6: Maximum capacity limit enforcement ---");
    await Student.create([
      {
        schoolId,
        personalInfo: {
          name: "Small 1",
          class: grade8._id,
          section: secSmall._id,
          rollNo: "1",
          stdId: "SM001",
          username: "sm_1",
          password: "password123",
        },
      },
      {
        schoolId,
        personalInfo: {
          name: "Small 2",
          class: grade8._id,
          section: secSmall._id,
          rollNo: "2",
          stdId: "SM002",
          username: "sm_2",
          password: "password123",
        },
      },
      {
        schoolId,
        personalInfo: {
          name: "Small 3",
          class: grade8._id,
          section: secSmall._id,
          rollNo: "3",
          stdId: "SM003",
          username: "sm_3",
          password: "password123",
        },
      },
    ]);

    let capRejected = false;
    try {
      await allocateNextRollNumber(schoolId, grade8._id, secSmall._id);
    } catch (capErr) {
      capRejected = true;
      assert(capErr.statusCode === 400, `Capacity error status is 400 (message: "${capErr.message}")`);
      assert(
        capErr.message.includes("maximum capacity of 3 students"),
        `Capacity error has required wording (got: "${capErr.message}")`
      );
    }
    assert(capRejected, "Allocation beyond capacity of 3 was rejected");

    // ── TEST 7: Delete Roll 2 from Small Section → Next student receives Roll 2 ──
    console.log("\n--- TEST 7: Deletion reuse of freed roll number ---");
    await Student.findOneAndDelete({ schoolId, "personalInfo.stdId": "SM002" });
    const freedNext = await allocateNextRollNumber(schoolId, grade8._id, secSmall._id);
    assert(freedNext.rollNo === "2", `Freed roll number 2 correctly allocated to next student (got ${freedNext.rollNo})`);

    // ── TEST 8: Two students created concurrently for same Class + Section → Distinct Roll Numbers ──
    console.log("\n--- TEST 8: Concurrent student creation handling ---");
    const mockReqUser = { user: { schoolId, userId: "admin1", role: "admin" } };

    const makeReq = (name, rollNo = undefined) => ({
      ...mockReqUser,
      body: {
        personalInfo: {
          name,
          class: "Grade 8",
          section: "B",
          rollNo,
          password: "password123",
          fees: "Paid",
        },
      },
    });

    const createMockRes = () => {
      const resObj = {
        statusCode: 200,
        data: null,
        status(c) {
          this.statusCode = c;
          return this;
        },
        json(d) {
          this.data = d;
          return this;
        },
      };
      return resObj;
    };

    const resA = createMockRes();
    const resB = createMockRes();

    // Fire two creations simultaneously
    await Promise.all([
      createStudent(makeReq("Concurrent Student Alpha"), resA),
      createStudent(makeReq("Concurrent Student Beta"), resB),
    ]);

    assert(resA.statusCode === 201, `Concurrent A created (status: ${resA.statusCode})`);
    assert(resB.statusCode === 201, `Concurrent B created (status: ${resB.statusCode})`);
    const rollA = resA.data?.student?.personalInfo?.rollNo;
    const rollB = resB.data?.student?.personalInfo?.rollNo;
    assert(
      rollA && rollB && rollA !== rollB,
      `Concurrent creations received distinct roll numbers: A=${rollA}, B=${rollB}`
    );

    // ── TEST 9: Student moves from Class/Section A to another Class/Section ──
    console.log("\n--- TEST 9: Student Edit / Class Change ---");
    // Move Student 1 from Grade 8 A to Grade 9 A (where Roll 1 is free)
    const editReq1 = {
      ...mockReqUser,
      params: { id: String(stu1._id) },
      body: {
        personalInfo: {
          class: "Grade 9",
          section: "A",
        },
      },
    };
    const editRes1 = createMockRes();
    await updateStudent(editReq1, editRes1);
    assert(editRes1.statusCode === 200, `Student moved to Grade 9 Section A (status: ${editRes1.statusCode})`);
    assert(
      (editRes1.data?.student?.personalInfo?.class === "Grade 9" ||
       editRes1.data?.student?.personalInfo?.class?.name === "Grade 9") &&
      editRes1.data?.student?.personalInfo?.rollNo === "1",
      `Student retained Roll 1 in Grade 9 A where it was available`
    );

    // ── TEST 10: Try manual Roll Number greater than capacity → Reject ──
    console.log("\n--- TEST 10: Manual Roll Number > Capacity rejection ---");
    let overCapRejected = false;
    try {
      await validateManualRollNumber(schoolId, grade8._id, secA._id, "45");
    } catch (overErr) {
      overCapRejected = true;
      assert(
        overErr.message.includes("cannot exceed the maximum capacity"),
        `Over-capacity message descriptive (got "${overErr.message}")`
      );
    }
    assert(overCapRejected, "Manual roll number 45 > 40 rejected");

    // ── TEST 11: Try duplicate Roll Number in same Class + Section via Controller → Reject ──
    console.log("\n--- TEST 11: Duplicate Roll Number via Controller ---");
    const dupReq = makeReq("Duplicate Attempt Student", "1"); // Roll 1 is taken in Grade 8 B by Alpha
    const dupRes = createMockRes();
    await createStudent(dupReq, dupRes);
    assert(dupRes.statusCode === 409, `Duplicate manual roll rejected with status 409 (got ${dupRes.statusCode})`);
    assert(
      dupRes.data?.message?.includes("already assigned"),
      `Duplicate message clear (got: "${dupRes.data?.message}")`
    );

    // ── Clean up test school ──
    await Student.deleteMany({ schoolId });
    await Class.deleteMany({ schoolId });
    await Section.deleteMany({ schoolId });
    await School.deleteOne({ _id: testSchool._id });

  } catch (err) {
    console.error("Test Suite error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n=================================================================");
  console.log(`  SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) process.exit(1);
}

runTests();
