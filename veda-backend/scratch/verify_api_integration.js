const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
require("../src/app");
const SetupWizard = require("../src/modules/setupWizard/setupWizardModel");
const User = require("../src/models/User");
const { updateSetupProfile, getSetupProfile } = require("../src/modules/setupProfile/setupProfileController");
const { getClasses } = require("../src/modules/class/classController");
const { getSections } = require("../src/modules/section/sectionController");

// Helper mock response
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

async function runApiVerification() {
  console.log("==================================================");
  console.log("  VERIFYING SETUP PROFILE & API INTEGRATION       ");
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

  try {
    await main();
    console.log("Connected to MongoDB");

    // Find or create test superadmin user
    let user = await User.findOne({});
    if (!user) {
      console.error("No user found in DB");
      process.exit(1);
    }

    // Ensure SetupWizard doc exists for this user
    await SetupWizard.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          schoolName: "Veda International Academy",
          institutionType: "k12_school",
          gradeFrom: "Nursery",
          gradeTo: "Grade 12",
          curriculumBoard: "CBSE",
          curriculumCountry: "India",
          languagePreference: "english",
        },
      },
      { upsert: true, new: true }
    );

    // 1. Test updateSetupProfile controller
    const reqUpdate = {
      user: { userId: user._id },
      body: {
        schoolName: "Veda International Academy",
        gradeFrom: "Grade 1",
        gradeTo: "Grade 10",
        institutionType: "k12_school",
      },
    };
    const resUpdate = createMockRes();
    await updateSetupProfile(reqUpdate, resUpdate);

    assert(resUpdate.statusCode === 200, `updateSetupProfile returned 200 (got ${resUpdate.statusCode})`);
    assert(resUpdate.body?.success === true, "updateSetupProfile success is true");
    assert(resUpdate.body?.data?.gradeFrom === "Grade 1", "Updated gradeFrom is 'Grade 1'");
    assert(resUpdate.body?.data?.gradeTo === "Grade 10", "Updated gradeTo is 'Grade 10'");

    // 2. Test getSetupProfile controller
    const reqGet = { user: { userId: user._id } };
    const resGet = createMockRes();
    await getSetupProfile(reqGet, resGet);

    assert(resGet.statusCode === 200, `getSetupProfile returned 200 (got ${resGet.statusCode})`);
    assert(resGet.body?.data?.schoolName === "Veda International Academy", "getSetupProfile returns correct schoolName");

    // 3. Test getClasses controller
    const reqClasses = {};
    const resClasses = createMockRes();
    await getClasses(reqClasses, resClasses);

    if (resClasses.statusCode !== 200) {
      console.log("getClasses error body:", resClasses.body);
    }

    assert(resClasses.statusCode === 200, `getClasses returned 200 (got ${resClasses.statusCode})`);
    assert(resClasses.body?.success === true, "getClasses success is true");
    assert(Array.isArray(resClasses.body?.data) && resClasses.body?.data.length >= 10, `getClasses returns populated classes array (count: ${resClasses.body?.data?.length})`);

    const hasPopulatedSections = resClasses.body?.data?.every(c => Array.isArray(c.sections) && c.sections.length > 0);
    assert(hasPopulatedSections, "All classes have populated sections array");

    // 4. Test getSections controller
    const reqSections = { query: {} };
    const resSections = createMockRes();
    await getSections(reqSections, resSections);

    assert(resSections.statusCode === 200, `getSections returned 200 (got ${resSections.statusCode})`);
    assert(resSections.body?.success === true, "getSections success is true");
    assert(Array.isArray(resSections.body?.data) && resSections.body?.data.length > 0, `getSections returns sections (count: ${resSections.body?.data?.length})`);

  } catch (err) {
    console.error("API verification error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }

  console.log("\n==================================================");
  console.log(`  API RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runApiVerification();
