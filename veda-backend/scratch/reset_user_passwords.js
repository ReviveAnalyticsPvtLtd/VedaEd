const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../src/models/User");

async function resetPasswords() {
  try {
    const dbUri = process.env.db_Connect_String;
    if (!dbUri) {
      throw new Error("db_Connect_String is not defined in .env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(dbUri);
    console.log("Database connected successfully!");

    const newHash = await bcrypt.hash("password123", 10);
    const emailsToReset = ["jemas68617@5nek.com", "teacher@veda.com"];

    for (const email of emailsToReset) {
      const user = await User.findOne({ email });
      if (user) {
        user.password = newHash;
        await user.save();
        console.log(`SUCCESS: Password for ${email} reset to 'password123'`);
      } else {
        console.log(`WARNING: User ${email} not found.`);
      }
    }
  } catch (error) {
    console.error("Error resetting passwords:", error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

resetPasswords();
