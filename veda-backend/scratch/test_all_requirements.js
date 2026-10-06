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
  sanitizeExistingRollNumbersInDb,
} = require("../src/modules/student/services/rollNumberService");
const { createStudent, updateStudent, getNextRollNumber } = require("../src/modules/student/studentControllers");

async function runComprehensiveTests() {
  console.log("=================================================================");
  console.log("   COMPREHENSIVE VERIFICATION SUITE: 12 REQUIRED SCENARIOS       ");
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

  await main();

  // Setup isolated test school
  const testSchoolId = new mongoose.Types.ObjectId();
  const testSchool = await School.create({
    _id: testSchoolId,
    name: "Verification Academy",
    code: "VERIFY_" + Date.now(),
    schema_name: "verify_" + Date.now(),
    workspaceId: new mongoose.Types.ObjectId(),
    ownerUserId: new mongoose.Types.ObjectId(),
  });

  // Helper to create class and section with custom capacity
  async function createClassAndSection(className, sectionName, capacity) {
    const sec = await Section.create({
      name: sectionName,
      capacity: capacity,
      schoolId: testSchoolId,
    });
    const cls = await Class.create({
      name: className,
      capacity: String(capacity),
      sections: [sec._id],
      schoolId: testSchoolId,
    });
    return { cls, sec };
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Capacity = 40 -> First student gets Roll 1
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Capacity = 40, First Student ---");
    const { cls: cls40, sec: sec40A } = await createClassAndSection("Grade 8", "A", 40);
    const alloc1 = await allocateNextRollNumber(testSchoolId, cls40._id, sec40A._id);
    assert(alloc1.rollNo === "1", `First student receives Roll 1 (got: ${alloc1.rollNo})`);
    assert(alloc1.capacity === 40, `Capacity is 40 (got: ${alloc1.capacity})`);

    const stu1 = await Student.create({
      schoolId: testSchoolId,
      personalInfo: {
        name: "Student 1",
        class: cls40._id,
        section: sec40A._id,
        rollNo: alloc1.rollNo,
        stdId: "T_STD_001",
        username: "t_user_001",
        password: "password123",
        fees: "Paid",
      },
    });

    // -------------------------------------------------------------
    // TEST 2: Capacity = 40 -> Second student gets Roll 2
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Capacity = 40, Second Student ---");
    const alloc2 = await allocateNextRollNumber(testSchoolId, cls40._id, sec40A._id);
    assert(alloc2.rollNo === "2", `Second student receives Roll 2 (got: ${alloc2.rollNo})`);

    const stu2 = await Student.create({
      schoolId: testSchoolId,
      personalInfo: {
        name: "Student 2",
        class: cls40._id,
        section: sec40A._id,
        rollNo: alloc2.rollNo,
        stdId: "T_STD_002",
        username: "t_user_002",
        password: "password123",
        fees: "Paid",
      },
    });

    // -------------------------------------------------------------
    // TEST 3 & 4: Capacity = 40 -> 40th student gets Roll 40, 41st is rejected
    // -------------------------------------------------------------
    console.log("\n--- TEST 3 & 4: Capacity = 40, 40th Student and 41st Reject ---");
    const bulkStudents = [];
    for (let i = 3; i <= 39; i++) {
      bulkStudents.push({
        schoolId: testSchoolId,
        personalInfo: {
          name: `Student ${i}`,
          class: cls40._id,
          section: sec40A._id,
          rollNo: String(i),
          stdId: `T_STD_${String(i).padStart(3, "0")}`,
          username: `t_user_${String(i).padStart(3, "0")}`,
          password: "password123",
          fees: "Paid",
        },
      });
    }
    await Student.insertMany(bulkStudents);

    // 40th student allocation
    const alloc40 = await allocateNextRollNumber(testSchoolId, cls40._id, sec40A._id);
    assert(alloc40.rollNo === "40", `40th student receives Roll 40 (got: ${alloc40.rollNo})`);

    const stu40 = await Student.create({
      schoolId: testSchoolId,
      personalInfo: {
        name: "Student 40",
        class: cls40._id,
        section: sec40A._id,
        rollNo: alloc40.rollNo,
        stdId: "T_STD_040",
        username: "t_user_040",
        password: "password123",
        fees: "Paid",
      },
    });

    // 41st student allocation attempt - MUST REJECT
    let rejected41 = false;
    try {
      await allocateNextRollNumber(testSchoolId, cls40._id, sec40A._id);
    } catch (err) {
      rejected41 = true;
      assert(err.isCapacityFull === true, `41st student allocation rejected with capacity full`);
      assert(
        err.message.includes("maximum capacity of 40 students"),
        `Rejection message clearly states capacity limit (got: "${err.message}")`
      );
    }
    assert(rejected41, "41st student was successfully prevented from receiving a roll number");

    // -------------------------------------------------------------
    // TEST 5: Capacity = 20 -> Maximum Roll is 20
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Dynamic Capacity = 20, Maximum Roll is 20 ---");
    const { cls: cls20, sec: sec20 } = await createClassAndSection("Grade 5", "A", 20);
    const used20 = new Set();
    for (let i = 1; i <= 19; i++) {
      used20.add(i);
    }
    const alloc20th = findSmallestAvailableRollNumber(used20, 20);
    assert(alloc20th === 20, `When capacity is 20, 20th student receives Roll 20 (got: ${alloc20th})`);

    used20.add(20);
    const alloc21st = findSmallestAvailableRollNumber(used20, 20);
    assert(alloc21st === null, "When capacity is 20, 21st student cannot be assigned any number (returns null)");

    // -------------------------------------------------------------
    // TEST 6: Capacity = 60 -> Maximum Roll is 60
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Dynamic Capacity = 60, Maximum Roll is 60 ---");
    const { cls: cls60, sec: sec60 } = await createClassAndSection("Grade 11", "A", 60);
    const used60 = new Set();
    for (let i = 1; i <= 59; i++) {
      used60.add(i);
    }
    const alloc60th = findSmallestAvailableRollNumber(used60, 60);
    assert(alloc60th === 60, `When capacity is 60, 60th student receives Roll 60 (got: ${alloc60th})`);

    used60.add(60);
    const alloc61st = findSmallestAvailableRollNumber(used60, 60);
    assert(alloc61st === null, "When capacity is 60, 61st student cannot be assigned any number (returns null)");

    // -------------------------------------------------------------
    // TEST 7: Grade 8 + Section A + Roll 1 exists -> Another student cannot receive Roll 1
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Duplicate Roll 1 in same Class + Section ---");
    let duplicateRejected = false;
    try {
      await validateManualRollNumber(testSchoolId, cls40._id, sec40A._id, "1");
    } catch (err) {
      duplicateRejected = true;
      assert(err.isDuplicate === true, "Manual assignment of duplicate Roll 1 rejected");
    }
    assert(duplicateRejected, "Duplicate Roll 1 in Grade 8 Section A was blocked");

    // -------------------------------------------------------------
    // TEST 8: Grade 8 + Section B + Roll 1 exists in Section A -> Roll 1 available in Section B
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Roll 1 in Section B allowed when Section A has Roll 1 ---");
    const sec40B = await Section.create({
      name: "B",
      capacity: 40,
      schoolId: testSchoolId,
    });
    cls40.sections.push(sec40B._id);
    await cls40.save();

    const alloc8B = await allocateNextRollNumber(testSchoolId, cls40._id, sec40B._id);
    assert(alloc8B.rollNo === "1", `Section B receives Roll 1 independently (got: ${alloc8B.rollNo})`);

    // -------------------------------------------------------------
    // TEST 9: Delete student with Roll 5 -> Next student receives Roll 5
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Delete student with Roll 5 and reuse ---");
    const { cls: clsGaps, sec: secGaps } = await createClassAndSection("Grade 7", "A", 40);
    const gapStudents = [];
    for (let i = 1; i <= 6; i++) {
      gapStudents.push(
        await Student.create({
          schoolId: testSchoolId,
          personalInfo: {
            name: `Gap Student ${i}`,
            class: clsGaps._id,
            section: secGaps._id,
            rollNo: String(i),
            stdId: `T_GAP_${i}`,
            username: `t_gap_${i}`,
            password: "password123",
            fees: "Paid",
          },
        })
      );
    }
    // Delete student with Roll 5
    await Student.findByIdAndDelete(gapStudents[4]._id);

    // Next allocated roll number should be 5
    const allocGap = await allocateNextRollNumber(testSchoolId, clsGaps._id, secGaps._id);
    assert(allocGap.rollNo === "5", `After deleting Roll 5, next student receives Roll 5 (got: ${allocGap.rollNo})`);

    // -------------------------------------------------------------
    // TEST 10: Move student from one Class/Section to another
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Move student from Class/Section A to B ---");
    const studentToMove = gapStudents[0]; // currently Grade 7 A Roll 1
    const { cls: clsDest, sec: secDest } = await createClassAndSection("Grade 9", "B", 40);
    await Student.create({
      schoolId: testSchoolId,
      personalInfo: {
        name: "Dest Student 1",
        class: clsDest._id,
        section: secDest._id,
        rollNo: "1",
        stdId: "T_DEST_1",
        username: "t_dest_1",
        password: "password123",
        fees: "Paid",
      },
    });

    const reqMove = {
      params: { id: studentToMove._id.toString() },
      body: {
        personalInfo: {
          class: clsDest._id.toString(),
          section: secDest._id.toString(),
        },
      },
      user: { schoolId: testSchoolId.toString() },
    };
    let movedResult = null;
    const resMove = {
      status: (code) => ({
        json: (data) => {
          movedResult = { code, data };
          return data;
        },
      }),
    };
    await updateStudent(reqMove, resMove);
    assert(movedResult.code === 200, `Student moved successfully (status: ${movedResult.code})`);
    assert(
      movedResult.data.student.personalInfo.rollNo === "2",
      `Student auto-allocated Roll 2 in destination because Roll 1 was taken (got: ${movedResult.data.student.personalInfo.rollNo})`
    );

    // -------------------------------------------------------------
    // TEST 11: Concurrent student creation -> No duplicates
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Concurrent student creation ---");
    const { cls: clsConc, sec: secConc } = await createClassAndSection("Grade 6", "A", 40);
    const reqA = {
      body: {
        personalInfo: {
          name: "Concurrent A",
          class: clsConc.name,
          section: secConc.name,
          password: "password123",
          fees: "Paid",
        },
      },
      user: { schoolId: testSchoolId.toString() },
    };
    const reqB = {
      body: {
        personalInfo: {
          name: "Concurrent B",
          class: clsConc.name,
          section: secConc.name,
          password: "password123",
          fees: "Paid",
        },
      },
      user: { schoolId: testSchoolId.toString() },
    };

    let resAData = null;
    let resBData = null;
    const mockResA = {
      status: (code) => ({
        json: (data) => {
          resAData = { code, data };
          return data;
        },
      }),
    };
    const mockResB = {
      status: (code) => ({
        json: (data) => {
          resBData = { code, data };
          return data;
        },
      }),
    };

    await Promise.all([
      createStudent(reqA, mockResA),
      createStudent(reqB, mockResB),
    ]);

    console.log("resAData:", JSON.stringify(resAData));
    console.log("resBData:", JSON.stringify(resBData));
    const rollA = resAData?.data?.student?.personalInfo?.rollNo;
    const rollB = resBData?.data?.student?.personalInfo?.rollNo;
    assert(rollA && rollB, `Both concurrent creations succeeded (Roll A: ${rollA}, Roll B: ${rollB})`);
    assert(rollA !== rollB, `Concurrent creations received unique roll numbers (A: ${rollA} !== B: ${rollB})`);

    // -------------------------------------------------------------
    // TEST 12: Existing students with Roll Numbers > Capacity safely handled
    // -------------------------------------------------------------
    console.log("\n--- TEST 12: Existing out-of-capacity student sanitization ---");
    const { cls: clsBad, sec: secBad } = await createClassAndSection("Grade 3", "A", 40);
    const badStu = await Student.create({
      schoolId: testSchoolId,
      personalInfo: {
        name: "Legacy Bad Roll Student",
        class: clsBad._id,
        section: secBad._id,
        rollNo: "3434",
        stdId: "T_BAD_001",
        username: "t_bad_001",
        password: "password123",
        fees: "Paid",
      },
    });

    const sanitizeResult = await sanitizeExistingRollNumbersInDb(testSchoolId);
    const updatedBadStu = await Student.findById(badStu._id);
    assert(
      updatedBadStu.personalInfo.rollNo === "1",
      `Out-of-capacity roll '3434' safely normalized to lowest available valid roll '1' (got: ${updatedBadStu.personalInfo.rollNo})`
    );

    console.log("\n=================================================================");
    console.log(`   FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

  } finally {
    // Clean up test data
    await Student.deleteMany({ schoolId: testSchoolId });
    await Class.deleteMany({ schoolId: testSchoolId });
    await Section.deleteMany({ schoolId: testSchoolId });
    await School.findByIdAndDelete(testSchoolId);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runComprehensiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
