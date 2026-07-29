const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../src/models/User");

async function reset() {
  try {
    const dbUri = process.env.db_Connect_String;
    await mongoose.connect(dbUri);

    const user = await User.findOne({ email: 'admin@veda.com' });
    if (user) {
      user.password = 'password123';
      await user.save();
      console.log("Password for admin@veda.com reset to password123 successfully!");
    } else {
      console.log("admin@veda.com user not found!");
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

reset();
