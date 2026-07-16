const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../src/models/User");

async function checkUser() {
  try {
    const dbUri = process.env.db_Connect_String;
    await mongoose.connect(dbUri);

    console.log("Checking User admin@veda.com...");
    const user = await User.findOne({ email: 'admin@veda.com' });
    console.log(user);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

checkUser();
