const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function dumpDoc() {
  await mongoose.connect(process.env.db_Connect_String);
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
  const doc = await Student.findById('6ae97f9fc821f3599c440992').lean();
  console.log('DUMP Aarav Sharma:', JSON.stringify(doc, null, 2));
  await mongoose.disconnect();
}
dumpDoc().catch(console.error);

