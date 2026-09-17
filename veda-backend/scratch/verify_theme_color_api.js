const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
const SetupWizard = require("../src/modules/setupWizard/setupWizardModel");
const User = require("../src/models/User");
const { updateSetupProfile, getSetupProfile } = require("../src/modules/setupProfile/setupProfileController");

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

async function runThemeColorVerification() {
  console.log("==================================================");
  console.log("  VERIFYING THEME COLOR PERSISTENCE & API         ");
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

    let user = await User.findOne({});
    if (!user) {
      console.error("No user found in DB");
      process.exit(1);
    }

    // 1. Test updating to Purple preset (#7C3AED)
    const reqPurple = {
      user: { userId: user._id },
      body: { primaryThemeColor: "#7C3AED" },
    };
    const resPurple = createMockRes();
    await updateSetupProfile(reqPurple, resPurple);

    assert(resPurple.statusCode === 200, `updateSetupProfile (Purple) returned 200 (got ${resPurple.statusCode})`);
    assert(resPurple.body?.data?.primaryThemeColor === "#7C3AED", `primaryThemeColor updated to '#7C3AED' (got ${resPurple.body?.data?.primaryThemeColor})`);

    // 2. Test getSetupProfile returns the saved color
    const reqGet = { user: { userId: user._id } };
    const resGet = createMockRes();
    await getSetupProfile(reqGet, resGet);

    assert(resGet.statusCode === 200, `getSetupProfile returned 200 (got ${resGet.statusCode})`);
    assert(resGet.body?.data?.primaryThemeColor === "#7C3AED", `getSetupProfile returns saved '#7C3AED'`);

    // 3. Test updating to Green preset (#16A34A)
    const reqGreen = {
      user: { userId: user._id },
      body: { primaryThemeColor: "#16A34A" },
    };
    const resGreen = createMockRes();
    await updateSetupProfile(reqGreen, resGreen);
    assert(resGreen.body?.data?.primaryThemeColor === "#16A34A", `primaryThemeColor updated to '#16A34A'`);

    // 4. Test updating to Orange preset (#EA580C)
    const reqOrange = {
      user: { userId: user._id },
      body: { primaryThemeColor: "#EA580C" },
    };
    const resOrange = createMockRes();
    await updateSetupProfile(reqOrange, resOrange);
    assert(resOrange.body?.data?.primaryThemeColor === "#EA580C", `primaryThemeColor updated to '#EA580C'`);

    // 5. Test updating to custom hex (#FF0080)
    const reqCustom = {
      user: { userId: user._id },
      body: { primaryThemeColor: "#FF0080" },
    };
    const resCustom = createMockRes();
    await updateSetupProfile(reqCustom, resCustom);
    assert(resCustom.body?.data?.primaryThemeColor === "#FF0080", `primaryThemeColor updated to custom '#FF0080'`);

    // 6. Test invalid hex rejection
    const reqInvalid = {
      user: { userId: user._id },
      body: { primaryThemeColor: "invalid-color-123" },
    };
    const resInvalid = createMockRes();
    await updateSetupProfile(reqInvalid, resInvalid);
    assert(resInvalid.statusCode === 400, `updateSetupProfile rejected invalid hex with 400 (got ${resInvalid.statusCode})`);
    assert(resInvalid.body?.success === false, "Rejected invalid hex response success is false");

    // 7. Reset back to Blue default (#2563EB)
    const reqBlue = {
      user: { userId: user._id },
      body: { primaryThemeColor: "#2563EB" },
    };
    const resBlue = createMockRes();
    await updateSetupProfile(reqBlue, resBlue);
    assert(resBlue.body?.data?.primaryThemeColor === "#2563EB", `primaryThemeColor reset to '#2563EB'`);

  } catch (err) {
    console.error("Theme verification error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runThemeColorVerification();
