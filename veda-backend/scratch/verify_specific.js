const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('../src/modules/class/classSchema');
require('../src/modules/section/sectionSchema');
const Student = require('../src/modules/student/studentModels');
const Parent = require('../src/modules/parents/parentModel');

async function verifySpecific() {
  await mongoose.connect(process.env.db_Connect_String);

  const ids = [
    '6ae97f9fc821f3599c440992', // Aarav Sharma (Grade 7 A)
    '6ae97f9fc821f3599c44099d', // Ananya Sharma (Grade 5 B)
    '6ae97fa1c821f3599c4409a8', // Vivaan Patel (Grade 6 A)
    '6ae97fa2c821f3599c4409b3'  // Diya Verma (Grade 4 C)
  ];

  for (const id of ids) {
    const s = await Student.findById(id)
      .populate('personalInfo.class', 'name')
      .populate('personalInfo.section', 'name')
      .populate('parent')
      .lean();

    console.log(`\n================ STUDENT: ${s.personalInfo?.name} (${s._id}) ================`);
    console.log(`Student ID (stdId): ${s.personalInfo?.stdId}`);
    console.log(`Roll No: ${s.personalInfo?.rollNo}`);
    console.log(`Class: ${s.personalInfo?.class?.name || s.personalInfo?.class}, Section: ${s.personalInfo?.section?.name || s.personalInfo?.section}`);
    console.log(`DOB: ${s.personalInfo?.DOB}`);
    console.log(`Gender: ${s.personalInfo?.gender}`);
    console.log(`Blood Group: ${s.personalInfo?.bloodGroup}`);
    console.log(`Nationality: ${s.personalInfo?.nationality}`);
    console.log(`Religion: ${s.personalInfo?.religion}`);
    console.log(`Address: ${s.personalInfo?.address}`);
    console.log(`Fees: ${s.personalInfo?.fees}`);
    console.log(`Mobile: ${s.personalInfo?.contactDetails?.mobileNumber}`);
    console.log(`Alt Phone: ${s.personalInfo?.contactDetails?.alternatePhone}`);
    console.log(`Email: ${s.personalInfo?.contactDetails?.email}`);
    console.log(`ContactInfo:`, s.contactInfo);
    console.log(`EmergencyContact:`, s.emergencyContact);
    console.log(`EarlierAcademic:`, s.earlierAcademic);

    if (s.parent) {
      console.log(`--- LINKED PARENT ---`);
      console.log(`Parent ID: ${s.parent.parentId}`);
      console.log(`Parent Name: ${s.parent.name}, Role: ${s.parent.role}`);
      console.log(`Father: ${s.parent.fatherName} (${s.parent.fatherPhone}, ${s.parent.fatherEmail}, ${s.parent.fatherOccupation})`);
      console.log(`Mother: ${s.parent.motherName} (${s.parent.motherPhone}, ${s.parent.motherEmail}, ${s.parent.motherOccupation})`);
      console.log(`Guardian:`, s.parent.guardian);
      console.log(`Children IDs in Parent:`, s.parent.children);
    } else {
      console.log(`Linked Parent: NONE`);
    }
  }

  // Also verify Parent Rajesh Sharma has BOTH children
  const rajesh = await Parent.findOne({ parentId: 'PRN-2026-1193' }).lean();
  console.log(`\n================ PARENT RAJESH SHARMA DEDUPLICATION CHECK ================`);
  console.log(`Parent ID: ${rajesh.parentId}`);
  console.log(`Name: ${rajesh.name}`);
  console.log(`Children count: ${rajesh.children.length}`);
  console.log(`Children ObjectIds:`, rajesh.children);
  console.log(`Matches Aarav (6ae97f9fc821f3599c440992)?`, rajesh.children.some(c => c.toString() === '6ae97f9fc821f3599c440992'));
  console.log(`Matches Ananya (6ae97f9fc821f3599c44099d)?`, rajesh.children.some(c => c.toString() === '6ae97f9fc821f3599c44099d'));

  await mongoose.disconnect();
}

verifySpecific().catch(console.error);
