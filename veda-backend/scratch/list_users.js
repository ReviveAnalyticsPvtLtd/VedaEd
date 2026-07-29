const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../src/models/User");
const Role = require("../src/models/Role");

async function checkUsers() {
  try {
    const dbUri = process.env.db_Connect_String;
    await mongoose.connect(dbUri);

    console.log("Active users:");
    const users = await User.find({}).populate("roleId");
    for (let u of users) {
      console.log(`Email: ${u.email}, Name: ${u.name}, Role: ${u.roleId?.name || "N/A"}, Status: ${u.status}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

checkUsers();
