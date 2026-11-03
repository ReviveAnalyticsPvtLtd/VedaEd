const mongoose = require('mongoose');
const path = require('path');
const XLSX = require('../../veda-frontend/node_modules/xlsx');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const studentController = require('../src/modules/student/studentControllers');
const Student = require('../src/modules/student/studentModels');
const Parent = require('../src/modules/parents/parentModel');

async function runRepairAndTest() {
  await mongoose.connect(process.env.db_Connect_String);
  console.log('Connected to MongoDB');

  // Read Excel file
  const excelPath = 'C:/Users/91741/Downloads/VedaEd_Student_Parent_Bulk_Import_Test_v2.xlsx';
  const fileBuffer = require('fs').readFileSync(excelPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Read ${rawRows.length} rows from Excel file`);

  // Transform rows identically to frontend handleImport
  const rows = rawRows.map((row) => ({
    ...row,
    personalInfo: {
      ...row,
      name:     row["Name"]     || row["Student Name"] || row["Full Name"] || row.name || "",
      class:    row["Class"]    || row["Grade"] || row.class || "-",
      rollNo:   row["Roll"]     || row["Roll No"] || row["Roll Number"] || row.rollNo || "-",
      section:  row["Section"]  || row.section || "-",
      password: row["Password"] || row.password || "default123",
      fees:     row["Fee"]      || row["Fees"] || row.fees || "Paid",
      email:    row["Email"]    || row["Student Email"] || row.email || "",
    },
    attendance: row["Attendance"] || row.attendance || "-",
  }));

  const schoolId = '6ae879d5f8a896ece249aca1';
  console.log('Using schoolId:', schoolId);

  // Mock req, res
  const req = {
    user: {
      schoolId: schoolId,
      userId: '6ae879d5f8a896ece249aca0',
      role: 'admin',
    },
    body: {
      students: rows
    }
  };

  let responseData = null;
  let statusCode = 200;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };

  console.log('Executing studentController.importStudents...');
  await studentController.importStudents(req, res);

  console.log(`Response Status: ${statusCode}`);
  console.log('Response Message:', responseData?.message);
  console.log('Imported count:', responseData?.imported?.length);
  console.log('Skipped count:', responseData?.skipped?.length);
  console.log('Errors count:', responseData?.errors?.length);
  console.log('Imported details:', JSON.stringify(responseData?.imported, null, 2));
  if (responseData?.errors?.length) {
    console.log('Errors:', JSON.stringify(responseData?.errors, null, 2));
  }

  // Verify the 4 students in DB
  console.log('\n================ VERIFYING 4 STUDENTS IN DB ================');
  const targetNames = ['Aarav Sharma', 'Ananya Sharma', 'Vivaan Patel', 'Diya Verma'];
  for (const name of targetNames) {
    const s = await Student.findOne({ schoolId, 'personalInfo.name': name })
      .populate('personalInfo.class', 'name')
      .populate('personalInfo.section', 'name')
      .populate('parent')
      .lean();

    if (!s) {
      console.error(`❌ Student ${name} not found!`);
      continue;
    }

    console.log(`\n--- STUDENT: ${s.personalInfo?.name} ---`);
    console.log(`Student ID (stdId): ${s.personalInfo?.stdId}`);
    console.log(`Roll No: ${s.personalInfo?.rollNo}`);
    console.log(`Class: ${s.personalInfo?.class?.name || s.personalInfo?.class}, Section: ${s.personalInfo?.section?.name || s.personalInfo?.section}`);
    console.log(`DOB: ${s.personalInfo?.DOB}, Gender: ${s.personalInfo?.gender}, Blood Group: ${s.personalInfo?.bloodGroup}`);
    console.log(`Nationality: ${s.personalInfo?.nationality}, Religion: ${s.personalInfo?.religion}`);
    console.log(`Phone: ${s.personalInfo?.contactDetails?.mobileNumber}, Alt: ${s.personalInfo?.contactDetails?.alternatePhone}, Email: ${s.personalInfo?.contactDetails?.email}`);
    console.log(`ContactInfo:`, s.contactInfo);
    console.log(`EmergencyContact:`, s.emergencyContact);
    console.log(`EarlierAcademic:`, s.earlierAcademic);

    if (s.parent) {
      console.log(`Linked Parent ID: ${s.parent.parentId}`);
      console.log(`Parent Name: ${s.parent.name}, Role: ${s.parent.role}`);
      console.log(`Father: ${s.parent.fatherName} (${s.parent.fatherPhone}, ${s.parent.fatherEmail}, ${s.parent.fatherOccupation})`);
      console.log(`Mother: ${s.parent.motherName} (${s.parent.motherPhone}, ${s.parent.motherEmail}, ${s.parent.motherOccupation})`);
      console.log(`Guardian:`, s.parent.guardian);
      console.log(`Parent Children count: ${s.parent.children?.length}`);
      console.log(`Parent Children IDs:`, s.parent.children);
    } else {
      console.log(`Linked Parent: NONE`);
    }
  }

  await mongoose.disconnect();
}

runRepairAndTest().catch(console.error);
