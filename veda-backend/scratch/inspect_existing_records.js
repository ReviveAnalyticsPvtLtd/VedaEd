const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.db_Connect_String || process.env.MONGO_URI);
  console.log('Connected to DB');

  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
  const Parent = mongoose.model('Parent', new mongoose.Schema({}, { strict: false }), 'parents');

  const students = await Student.find({
    $or: [
      { 'personalInfo.email': { $regex: /sharma|patel|verma/i } },
      { 'personalInfo.fullName': { $regex: /Aarav|Ananya|Vivaan|Diya/i } },
      { 'personalInfo.name': { $regex: /Aarav|Ananya|Vivaan|Diya/i } }
    ]
  }).lean();

  console.log('Found students count:', students.length);
  for (const s of students) {
    console.log('--------------------------------------------------');
    console.log('Student ID:', s.stdId || s.studentId || s.admissionNumber);
    console.log('_id:', s._id);
    console.log('Name:', s.personalInfo?.fullName || s.personalInfo?.name || s.name);
    console.log('Email:', s.personalInfo?.email || s.email);
    console.log('Parent ref in student:', s.parent);
    console.log('ContactInfo:', JSON.stringify(s.contactInfo));
    console.log('EmergencyContact:', JSON.stringify(s.emergencyContact));
    console.log('EarlierAcademic:', JSON.stringify(s.earlierAcademic));
    console.log('Raw personalInfo:', JSON.stringify(s.personalInfo));
  }

  const parents = await Parent.find({
    $or: [
      { fatherEmail: { $regex: /sharma|patel|verma/i } },
      { motherEmail: { $regex: /sharma|patel|verma/i } },
      { guardianEmail: { $regex: /sharma|patel|verma/i } },
      { email: { $regex: /sharma|patel|verma/i } },
      { name: { $regex: /Rajesh|Neha|Kunal|Ritu|Mehul/i } }
    ]
  }).lean();

  console.log('\nFound parents count:', parents.length);
  for (const p of parents) {
    console.log('--------------------------------------------------');
    console.log('Parent ID:', p.parentId);
    console.log('Name:', p.name);
    console.log('Email:', p.email);
    console.log('Phone:', p.phone);
    console.log('Children:', p.children);
    console.log('Raw Parent:', JSON.stringify(p));
  }

  await mongoose.disconnect();
}
check().catch(console.error);
