const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
const Class = require("../src/modules/class/classSchema");
const Section = require("../src/modules/section/sectionSchema");
const {
  CANONICAL_GRADES,
  resolveGradeList,
  resolveSectionNames,
  matchesGrade,
  syncClassesAndSections,
} = require("../src/modules/class/services/classAutomationService");
const { getClasses, getClassByIdAndSection } = require("../src/modules/class/classController");

async function runVerification() {
  console.log("=================================================================");
  console.log("  VERIFYING SECTION & PER-SECTION CAPACITY AUTOMATION SERVICE   ");
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

  // 1. Unit Tests for Section Name Resolution
  console.log("\n--- 1. Testing Section Resolution Logic ---");
  const sec3 = resolveSectionNames({ sections: 3 });
  assert(sec3.length === 3 && sec3.join(",") === "A,B,C", `sections: 3 resolves to ['A', 'B', 'C'] (got ${sec3.join(",")})`);

  const sec4 = resolveSectionNames({ sections: 4 });
  assert(sec4.length === 4 && sec4.join(",") === "A,B,C,D", `sections: 4 resolves to ['A', 'B', 'C', 'D'] (got ${sec4.join(",")})`);

  const secAuto = resolveSectionNames({ sectionMode: "auto", expectedStudents: 120, maxStudentsPerSection: 40 });
  assert(secAuto.length === 3 && secAuto.join(",") === "A,B,C", `Auto 120 / 40 resolves to ['A', 'B', 'C'] (got ${secAuto.join(",")})`);

  const secDefault = resolveSectionNames();
  assert(secDefault.length === 1 && secDefault[0] === "A", `Empty config defaults to ['A'] (got ${secDefault.join(",")})`);

  try {
    await main();
    console.log("\nConnected to database successfully");

    // 2. Initial Setup Profile Sync with sections: 3, capacity: 40
    console.log("\n--- 2. Testing Initial Onboarding Sync (Nursery to Grade 12, sections: 3, capacity: 40) ---");
    const sync1 = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
      sections: 3,
      capacity: 40,
    });

    assert(sync1.success === true, `Initial sync succeeded: ${sync1.message}`);
    assert(sync1.capacity === 40, `Sync reported capacity is 40 (got ${sync1.capacity})`);
    assert(sync1.sectionNames.length === 3, `Sync configured 3 section names (got ${sync1.sectionNames.length})`);
    assert(sync1.totalClasses >= 15, `Total classes synced >= 15 (got ${sync1.totalClasses})`);

    // Verify Classes and Sections in Database
    const dbClasses = await Class.find({}).populate("sections");
    assert(dbClasses.length >= 15, `Database has at least 15 classes (got ${dbClasses.length})`);

    const grade1 = dbClasses.find((c) => matchesGrade(c.name, "Grade 1"));
    assert(Boolean(grade1), "Grade 1 exists in DB");
    assert(grade1.capacity === "40", `Grade 1 class capacity is '40' (got ${grade1.capacity})`);
    assert(grade1.sections.length >= 3, `Grade 1 has at least 3 sections (got ${grade1.sections.length})`);

    const grade1SecNames = grade1.sections.map((s) => s.name).sort();
    assert(
      grade1SecNames.includes("A") && grade1SecNames.includes("B") && grade1SecNames.includes("C"),
      `Grade 1 contains sections A, B, C (got ${grade1SecNames.join(", ")})`
    );

    // Verify Per-Section Capacity in Database
    const secA = await Section.findOne({ name: "A" });
    const secB = await Section.findOne({ name: "B" });
    const secC = await Section.findOne({ name: "C" });
    assert(Boolean(secA) && secA.capacity === 40, `Section A capacity is 40 (got ${secA?.capacity})`);
    assert(Boolean(secB) && secB.capacity === 40, `Section B capacity is 40 (got ${secB?.capacity})`);
    assert(Boolean(secC) && secC.capacity === 40, `Section C capacity is 40 (got ${secC?.capacity})`);

    // 3. Idempotency Test (Re-running sync with identical config)
    console.log("\n--- 3. Testing Idempotency (Consecutive Sync) ---");
    const countClassesBefore = await Class.countDocuments();
    const countSectionsBefore = await Section.countDocuments();

    const sync2 = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
      sections: 3,
      capacity: 40,
    });

    const countClassesAfter = await Class.countDocuments();
    const countSectionsAfter = await Section.countDocuments();

    assert(sync2.success === true, "Second sync succeeded");
    assert(sync2.classesCreated.length === 0, `No new classes created (got ${sync2.classesCreated.length})`);
    assert(countClassesBefore === countClassesAfter, `Class count remains unchanged (${countClassesAfter})`);
    assert(countSectionsBefore === countSectionsAfter, `Section count remains unchanged (${countSectionsAfter})`);

    // 4. Capacity Update Safety (Changing capacity from 40 to 50)
    console.log("\n--- 4. Testing Capacity Update (40 -> 50) ---");
    const syncCapacityUpdate = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
      sections: 3,
      capacity: 50,
    });

    assert(syncCapacityUpdate.success === true, "Capacity update sync succeeded");
    assert(syncCapacityUpdate.capacity === 50, `Sync capacity is 50 (got ${syncCapacityUpdate.capacity})`);

    const updatedGrade1 = await Class.findOne({ name: "Grade 1" }).populate("sections");
    assert(updatedGrade1.capacity === "50", `Grade 1 class capacity updated to '50' (got ${updatedGrade1.capacity})`);

    const updatedSecA = await Section.findOne({ name: "A" });
    assert(updatedSecA.capacity === 50, `Section A capacity updated to 50 (got ${updatedSecA.capacity})`);

    // 5. Section Increase Test (3 sections -> 4 sections)
    console.log("\n--- 5. Testing Section Increase (3 -> 4: only Section D added) ---");
    const syncIncrease = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
      sections: 4,
      capacity: 50,
    });

    assert(syncIncrease.success === true, "Section increase sync succeeded");
    const grade1AfterIncrease = await Class.findOne({ name: "Grade 1" }).populate("sections");
    const secNamesAfterIncrease = grade1AfterIncrease.sections.map((s) => s.name);
    assert(secNamesAfterIncrease.includes("D"), `Grade 1 now has Section D (sections: ${secNamesAfterIncrease.join(", ")})`);

    const secD = await Section.findOne({ name: "D" });
    assert(Boolean(secD) && secD.capacity === 50, `Section D created with capacity 50 (got ${secD?.capacity})`);

    // 6. Section Decrease Protection Test (4 sections -> 2 sections)
    console.log("\n--- 6. Testing Section Decrease Protection (4 -> 2: sections C, D preserved) ---");
    const syncDecrease = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
      sections: 2,
      capacity: 50,
    });

    assert(syncDecrease.success === true, "Section decrease sync succeeded");
    const grade1AfterDecrease = await Class.findOne({ name: "Grade 1" }).populate("sections");
    const secNamesAfterDecrease = grade1AfterDecrease.sections.map((s) => s.name);
    assert(
      secNamesAfterDecrease.includes("A") &&
      secNamesAfterDecrease.includes("B") &&
      secNamesAfterDecrease.includes("C") &&
      secNamesAfterDecrease.includes("D"),
      `Existing sections A, B, C, D preserved on decrease (got ${secNamesAfterDecrease.join(", ")})`
    );

    // 7. API Output Format Verification
    console.log("\n--- 7. Testing Controller API Responses ---");
    let apiData = null;
    const mockReq = {};
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        apiData = payload;
        return this;
      },
    };

    await getClasses(mockReq, mockRes);
    assert(mockRes.statusCode === 200, `getClasses returned status 200 (got ${mockRes.statusCode})`);
    assert(apiData.success === true, "getClasses returned success: true");
    assert(Array.isArray(apiData.data) && apiData.data.length > 0, `getClasses returned classes array (length: ${apiData.data?.length})`);

    const apiGrade1 = apiData.data.find((c) => matchesGrade(c.name, "Grade 1"));
    assert(Boolean(apiGrade1), "getClasses contains Grade 1");
    assert(Boolean(apiGrade1.capacity), `Grade 1 has capacity: ${apiGrade1.capacity}`);
    assert(
      apiGrade1.sections.length > 0 && Number.isFinite(apiGrade1.sections[0].capacity),
      `Grade 1 sections have numerical capacity field (got ${apiGrade1.sections[0]?.capacity})`
    );

    // Test getClassByIdAndSection
    let detailData = null;
    const mockDetailReq = {
      params: {
        classId: String(grade1AfterDecrease._id),
        sectionId: String(secA._id),
      },
    };
    const mockDetailRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        detailData = payload;
        return this;
      },
    };

    await getClassByIdAndSection(mockDetailReq, mockDetailRes);
    assert(mockDetailRes.statusCode === 200, `getClassByIdAndSection returned 200 (got ${mockDetailRes.statusCode})`);
    assert(detailData.success === true, "getClassByIdAndSection returned success: true");
    assert(
      detailData.data?.classname?.capacity === "50" || detailData.data?.sectionName?.capacity === 50,
      `Class / Section detail includes capacity 50 (classname: ${detailData.data?.classname?.capacity}, sec: ${detailData.data?.sectionName?.capacity})`
    );

  } catch (err) {
    console.error("Verification error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database");
  }

  console.log("\n=================================================================");
  console.log(`  FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
