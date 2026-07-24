const mongoose = require("mongoose");
const Class = require("../src/modules/class/classSchema");
const Section = require("../src/modules/section/sectionSchema");
const Student = require("../src/modules/student/studentModels");
const { GradeFee } = require("../src/modules/fees/feeModels");
require("dotenv").config({ path: "./.env" });

async function run() {
  await mongoose.connect(process.env.db_Connect_String);
  console.log("Connected to DB");

  // 1. Get all classes
  const classes = await Class.find({});
  console.log("=== CLASSES ===");
  console.log(classes.map(c => ({ id: c._id, name: c.name })));

  // 2. Get all GradeFees
  const gradeFees = await GradeFee.find({});
  console.log("=== GRADE FEES ===");
  console.log(gradeFees.map(gf => ({ id: gf._id, grade: gf.grade, year: gf.year, fees: Array.from(gf.fees || []) })));

  // 3. Search for abhishek, amar, yash, etc. in Students
  const searchNames = ["abhishek", "amar", "yash", "alice"];
  console.log("=== STUDENTS MATCHING NAMES ===");
  for (const name of searchNames) {
    const students = await Student.find({
      "personalInfo.name": { $regex: name, $options: "i" }
    }).populate("personalInfo.class", "name");
    console.log(`Matching "${name}":`, students.map(s => ({
      id: s._id,
      name: s.personalInfo.name,
      classId: s.personalInfo.class?._id,
      className: s.personalInfo.class?.name,
      category: s.personalInfo.category,
      feesStatus: s.personalInfo.fees
    })));
  }

  await mongoose.disconnect();
}

run();
