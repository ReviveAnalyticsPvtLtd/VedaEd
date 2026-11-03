const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Class = require('../src/modules/class/classSchema');
const Section = require('../src/modules/section/sectionSchema');

async function checkClasses() {
  await mongoose.connect(process.env.db_Connect_String);
  const classes = await Class.find({ schoolId: '6ae879d5f8a896ece249aca1' }).populate('sections').lean();
  console.log(`Classes in 6ae879d5f8a896ece249aca1:`, classes.map(c => ({
    id: c._id,
    name: c.name,
    sections: c.sections?.map(s => s.name)
  })));
  await mongoose.disconnect();
}
checkClasses().catch(console.error);

