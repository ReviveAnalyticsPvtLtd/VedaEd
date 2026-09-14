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

async function runVerification() {
  console.log("==================================================");
  console.log("  VERIFYING CLASS & SECTION AUTOMATION SERVICE   ");
  console.log("==================================================");

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

  // 1. Grade range resolution tests
  console.log("\n--- Testing Grade Range Resolution ---");
  const fullK12 = resolveGradeList({ gradeFrom: "Nursery", gradeTo: "Grade 12" });
  assert(fullK12.length === 15, `Full K-12 returns 15 grades (got ${fullK12.length})`);
  assert(fullK12[0] === "Nursery" && fullK12[14] === "Grade 12", "Range bounds are Nursery and Grade 12");

  const primaryOnly = resolveGradeList({ gradeFrom: "Grade 1", gradeTo: "Grade 5" });
  assert(primaryOnly.length === 5, `Grade 1..5 returns 5 grades (got ${primaryOnly.length})`);
  assert(primaryOnly[0] === "Grade 1" && primaryOnly[4] === "Grade 5", "Grade 1..5 bounds correct");

  const seniorOnly = resolveGradeList({ gradeFrom: "Grade 11", gradeTo: "Grade 12" });
  assert(seniorOnly.length === 2, `Grade 11..12 returns 2 grades (got ${seniorOnly.length})`);

  const nurseryToKg = resolveGradeList({ gradeFrom: "Nursery", gradeTo: "KG" });
  assert(nurseryToKg.length === 2 && nurseryToKg[1] === "KG", `Nursery..KG returns Nursery & KG (got ${nurseryToKg.join(", ")})`);

  const preschoolFallback = resolveGradeList({ institutionType: "preschool" });
  assert(preschoolFallback.length === 3 && preschoolFallback[0] === "Nursery", "Preschool fallback returns Nursery..UKG");

  const higherSecFallback = resolveGradeList({ institutionType: "higher_secondary" });
  assert(higherSecFallback.length === 2 && higherSecFallback[0] === "Grade 11", "Higher secondary fallback returns Grade 11..12");

  // 2. Section resolution tests
  console.log("\n--- Testing Section Resolution ---");
  const defaultSec = resolveSectionNames();
  assert(defaultSec.length === 1 && defaultSec[0] === "A", "Default section is ['A']");

  const autoSec = resolveSectionNames({ sectionMode: "auto", expectedStudents: 120, maxStudentsPerSection: 40 });
  assert(autoSec.length === 3 && autoSec.join(",") === "A,B,C", `Auto sections for 120/40 is A,B,C (got ${autoSec.join(",")})`);

  // 3. Matching aliases tests
  console.log("\n--- Testing Grade Name Matching ---");
  assert(matchesGrade("Grade 10", "Grade 10"), "Exact Grade 10 matches");
  assert(matchesGrade("Class 10", "Grade 10"), "Class 10 matches Grade 10");
  assert(matchesGrade("10th Grade", "Grade 10"), "10th Grade matches Grade 10");
  assert(matchesGrade("Nursery", "Nursery"), "Nursery matches Nursery");
  assert(!matchesGrade("Grade 1", "Grade 10"), "Grade 1 does not match Grade 10");

  // 4. Database Integration & Idempotency Test
  console.log("\n--- Testing Database Integration & Idempotency ---");
  try {
    await main();
    console.log("Connected to database successfully");

    // Run first sync for K-12 range
    const sync1 = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
    });

    assert(sync1.success === true, `First sync succeeded: ${sync1.message}`);
    assert(sync1.totalClasses >= 15, `Total classes >= 15 (got ${sync1.totalClasses})`);

    // Verify all 15 grades exist in DB
    const dbClasses = await Class.find({}).populate("sections", "name");
    assert(dbClasses.length >= 15, `DB contains at least 15 classes (got ${dbClasses.length})`);

    const sampleGrade1 = dbClasses.find(c => matchesGrade(c.name, "Grade 1"));
    assert(Boolean(sampleGrade1), "Grade 1 exists in DB");
    assert(sampleGrade1.sections.length > 0, `Grade 1 has sections (count: ${sampleGrade1.sections.length})`);
    assert(sampleGrade1.sections[0].name === "A", `Grade 1 section name is 'A' (got ${sampleGrade1.sections[0].name})`);

    // Run second sync (Idempotency test)
    const sync2 = await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
    });

    assert(sync2.success === true, "Second sync succeeded");
    assert(sync2.classesCreated.length === 0, `Second sync created 0 new classes (idempotent, got ${sync2.classesCreated.length})`);
    assert(sync2.classesReused.length >= 15, `Second sync reused all existing classes (got ${sync2.classesReused.length})`);

    // Check Section collection count
    const sectionADocs = await Section.find({ name: /^A$/i });
    assert(sectionADocs.length === 1, `Section 'A' document is not duplicated (count: ${sectionADocs.length})`);

  } catch (dbErr) {
    console.error("DB test error:", dbErr);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
