const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
require("../src/app");
const Class = require("../src/modules/class/classSchema");
const {
  CANONICAL_GRADES,
  normalizeClassName,
  getGradeSortOrder,
  sortClasses,
  normalizeExistingClassesInDb,
  syncClassesAndSections,
} = require("../src/modules/class/services/classAutomationService");
const { getClasses } = require("../src/modules/class/classController");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

async function runVerification() {
  console.log("==================================================");
  console.log("  VERIFYING CLASS NAMING CONSISTENCY & ORDERING   ");
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

  // 1. Normalization unit tests
  console.log("\n--- Testing Class Name Normalization ---");
  assert(normalizeClassName("Class 1 ") === "Grade 1", `"Class 1 " normalizes to "Grade 1" (got "${normalizeClassName("Class 1 ")}")`);
  assert(normalizeClassName("class 2") === "Grade 2", `"class 2" normalizes to "Grade 2" (got "${normalizeClassName("class 2")}")`);
  assert(normalizeClassName("Class 10") === "Grade 10", `"Class 10" normalizes to "Grade 10" (got "${normalizeClassName("Class 10")}")`);
  assert(normalizeClassName("10th Grade") === "Grade 10", `"10th Grade" normalizes to "Grade 10" (got "${normalizeClassName("10th Grade")}")`);
  assert(normalizeClassName("Nursery") === "Nursery", `"Nursery" normalizes to "Nursery"`);
  assert(normalizeClassName("lkg") === "LKG", `"lkg" normalizes to "LKG"`);
  assert(normalizeClassName("UKG") === "UKG", `"UKG" normalizes to "UKG"`);
  assert(normalizeClassName("Grade 5") === "Grade 5", `"Grade 5" normalizes to "Grade 5"`);

  // 2. Sorting tests
  console.log("\n--- Testing Academic Sorting ---");
  const mixedClasses = [
    { name: "Grade 5" },
    { name: "Grade 12" },
    { name: "Class 1" },
    { name: "Nursery" },
    { name: "Grade 10" },
    { name: "UKG" },
    { name: "LKG" },
    { name: "Grade 2" },
  ];
  const sorted = sortClasses(mixedClasses);
  const sortedNames = sorted.map(c => normalizeClassName(c.name));
  const expectedOrder = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 5", "Grade 10", "Grade 12"];
  assert(
    JSON.stringify(sortedNames) === JSON.stringify(expectedOrder),
    `Sorting orders correctly: ${sortedNames.join(" -> ")}`
  );

  // 3. Database Migration & End-to-End API Test
  console.log("\n--- Testing DB In-Place Normalization & API Response ---");
  try {
    await main();
    console.log("Connected to database");

    // Run in-place normalization migration
    const migrationResult = await normalizeExistingClassesInDb();
    console.log("Migration result:", migrationResult);
    assert(migrationResult.success === true, "normalizeExistingClassesInDb succeeded");

    // Ensure all 15 grades from Nursery to Grade 12 exist and are synced
    await syncClassesAndSections({
      gradeFrom: "Nursery",
      gradeTo: "Grade 12",
      institutionType: "k12_school",
    });

    // Test GET /api/classes API controller
    const reqClasses = {};
    const resClasses = createMockRes();
    await getClasses(reqClasses, resClasses);

    assert(resClasses.statusCode === 200, "getClasses returned 200");
    assert(resClasses.body?.success === true, "getClasses success is true");
    assert(Array.isArray(resClasses.body?.data), "getClasses returned data array");

    const apiClasses = resClasses.body?.data || [];
    const apiClassNames = apiClasses.map(c => c.name);

    console.log("\nFetched classes from API:");
    apiClasses.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name} (Sections: [${(c.sections || []).map(s => s.name).join(", ")}])`);
    });

    // Verify all names follow Grade X / Nursery / LKG / UKG standard
    const invalidNames = apiClassNames.filter(name => {
      if (["Nursery", "LKG", "UKG", "KG"].includes(name)) return false;
      return !/^Grade\s+[0-9]+$/.test(name);
    });
    assert(invalidNames.length === 0, `All class names are valid canonical names (invalid: ${invalidNames.join(", ")})`);

    // Verify no "Class 1", "Class 2", "Class 10" remain
    const legacyNames = apiClassNames.filter(name => /^Class\s+/i.test(name));
    assert(legacyNames.length === 0, `No legacy 'Class X' names remain (found: ${legacyNames.join(", ")})`);

    // Verify academic order
    const expectedFullK12 = [
      "Nursery",
      "LKG",
      "UKG",
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
      "Grade 11",
      "Grade 12",
    ];

    let isStrictOrder = true;
    for (let i = 0; i < expectedFullK12.length; i++) {
      if (apiClassNames[i] !== expectedFullK12[i]) {
        isStrictOrder = false;
        console.error(`Mismatch at index ${i}: expected "${expectedFullK12[i]}", got "${apiClassNames[i]}"`);
      }
    }
    assert(isStrictOrder, "All 15 classes appear in exact academic order (Nursery -> Grade 12)");

    // Verify Grade 1 and Grade 2 are present
    assert(apiClassNames.includes("Grade 1"), "Grade 1 is present in the list");
    assert(apiClassNames.includes("Grade 2"), "Grade 2 is present in the list");
    assert(apiClassNames.includes("Grade 10"), "Grade 10 is present in the list");

    // Verify sections are populated
    const allHaveSections = apiClasses.every(c => Array.isArray(c.sections) && c.sections.length > 0);
    assert(allHaveSections, "All classes have populated sections");

  } catch (err) {
    console.error("Verification error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database");
  }

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
