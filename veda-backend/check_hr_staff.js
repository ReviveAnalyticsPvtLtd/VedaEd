const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const Staff = require("./src/modules/staff/staffModels");

mongoose
  .connect(process.env.db_Connect_String, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    const staffId = "HR_TCH-2026-058";
    
    const staff = await Staff.findOne({
      $or: [
        { "personalInfo.staffId": staffId },
        { "personalInfo.username": staffId },
        { "personalInfo.email": staffId }
      ]
    });
    
    console.log("Staff found by exact match:", staff ? staff.personalInfo : "Not found");

    const allStaff = await Staff.find({ "personalInfo.name": /Ravi/i });
    console.log("Staff found by name:", allStaff.map(s => s.personalInfo));

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
