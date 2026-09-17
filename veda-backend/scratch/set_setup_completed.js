const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
const SetupWizard = require("../src/modules/setupWizard/setupWizardModel");
const User = require("../src/models/User");

async function setCompleted() {
  await main();
  console.log("Connected to MongoDB");
  const user = await User.findOne({});
  if (user) {
    await SetupWizard.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          setupStatus: "completed",
          primaryThemeColor: "#2563EB",
        },
      },
      { upsert: true, new: true }
    );
    console.log("Updated setupStatus to completed for user:", user.email || user.username);
  }
  await mongoose.disconnect();
}

setCompleted();
