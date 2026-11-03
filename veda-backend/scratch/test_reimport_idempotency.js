const mongoose = require('mongoose');
const path = require('path');
const XLSX = require('../../veda-frontend/node_modules/xlsx');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const studentController = require('../src/modules/student/studentControllers');
const Student = require('../src/modules/student/studentModels');
const Parent = require('../src/modules/parents/parentModel');

async function testReimport() {
  await mongoose.connect(process.env.db_Connect_String);
  const schoolId = '6ae879d5f8a896ece249aca1';

  const fileBuffer = require('fs').readFileSync('C:/Users/91741/Downloads/VedaEd_Student_Parent_Bulk_Import_Test_v2.xlsx');
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

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

  const initialStudentCount = await Student.countDocuments({ schoolId });
  const initialParentCount = await Parent.countDocuments({ schoolId });

  let responseData = null;
  const req = {
    user: { schoolId, userId: '6ae879d5f8a896ece249aca0', role: 'admin' },
    body: { students: rows }
  };
  const res = {
    status: () => res,
    json: (d) => { responseData = d; return res; }
  };

  console.log('Re-importing Excel file...');
  await studentController.importStudents(req, res);

  const finalStudentCount = await Student.countDocuments({ schoolId });
  const finalParentCount = await Parent.countDocuments({ schoolId });

  console.log('Re-import response:', responseData?.message);
  console.log(`Initial Students: ${initialStudentCount}, Final Students: ${finalStudentCount} (Diff: ${finalStudentCount - initialStudentCount})`);
  console.log(`Initial Parents: ${initialParentCount}, Final Parents: ${finalParentCount} (Diff: ${finalParentCount - initialParentCount})`);

  if (finalStudentCount === initialStudentCount && finalParentCount === initialParentCount) {
    console.log('✅ IDEMPOTENCY VERIFIED: Zero duplicate students or parents created on re-import!');
  } else {
    console.error('❌ IDEMPOTENCY FAILED: Duplicate records were created!');
  }

  await mongoose.disconnect();
}

testReimport().catch(console.error);

