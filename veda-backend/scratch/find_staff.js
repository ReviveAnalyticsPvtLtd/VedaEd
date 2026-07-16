const mongoose = require("mongoose");
require("dotenv").config();

const Staff = require("../src/modules/staff/staffModels");

async function checkStaff() {
  try {
    const dbUri = process.env.db_Connect_String;
    await mongoose.connect(dbUri);

    console.log("Checking Staff collection...");
    const staffList = await Staff.find();
    
    console.log(`Found ${staffList.length} staff records:`);
    staffList.forEach(s => {
      console.log({
        id: s._id,
        name: s.personalInfo?.name,
        email: s.personalInfo?.email,
        role: s.personalInfo?.role
      });
    });

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

checkStaff();
