const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRecent() {
  await mongoose.connect(process.env.db_Connect_String);
  console.log('Connected to DB');

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
  const Parent = mongoose.model('Parent', new mongoose.Schema({}, { strict: false }), 'parents');

  const recentStudents = await Student.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).lean();

  console.log('--- RECENT 10 STUDENTS ---');
  for (const s of recentStudents) {
    console.log('ID:', s._id, 'stdId:', s.stdId, 'personalInfo.stdId:', s.personalInfo?.stdId);
    console.log('Name:', s.personalInfo?.name || s.personalInfo?.fullName);
    console.log('Email:', s.personalInfo?.email || s.contactInfo?.email || s.email);
    console.log('Parent ref:', s.parent);
    console.log('ContactInfo:', s.contactInfo);
    console.log('EmergencyContact:', s.emergencyContact);
    console.log('EarlierAcademic:', s.earlierAcademic);
    console.log('CreatedAt:', s.createdAt);
    console.log('--------------------------------------------------');
  }

  const recentParents = await Parent.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).lean();
  console.log('--- RECENT 10 PARENTS ---');
  for (const p of recentParents) {
    console.log('ID:', p._id, 'parentId:', p.parentId, 'name:', p.name, 'email:', p.email, 'phone:', p.phone);
    console.log('Children:', p.children);
    console.log('CreatedAt:', p.createdAt);
    console.log('--------------------------------------------------');
  }

  await mongoose.disconnect();
}
checkRecent().catch(console.error);

