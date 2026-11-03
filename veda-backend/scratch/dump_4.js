const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function dump4() {
  await mongoose.connect(process.env.db_Connect_String);
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
  const ids = ['6ae97f9fc821f3599c440992', '6ae97f9fc821f3599c44099d', '6ae97fa1c821f3599c4409a8', '6ae97fa2c821f3599c4409b3'];
  const docs = await Student.find({ _id: { $in: ids } }).lean();
  for (const d of docs) {
    console.log(`=== STUDENT ${d.personalInfo?.name} (${d.personalInfo?.stdId}) ===`);
    console.log(JSON.stringify(d, null, 2));
  }
  await mongoose.disconnect();
}
dump4().catch(console.error);

