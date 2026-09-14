const mongoose = require("mongoose");
require("dotenv").config();
const main = require("../src/config/db");
const Class = require("../src/modules/class/classSchema");
const Section = require("../src/modules/section/sectionSchema");

async function checkClasses() {
  await main();
  const classes = await Class.find({}).populate("sections", "name");
  console.log("Current classes in DB (count: " + classes.length + "):");
  classes.forEach(c => {
    console.log(`ID: ${c._id}, Name: "${c.name}", Sections: [${c.sections.map(s => s.name).join(", ")}]`);
  });
  await mongoose.disconnect();
}

checkClasses();
