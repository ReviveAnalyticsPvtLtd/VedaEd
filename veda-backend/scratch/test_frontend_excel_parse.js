const XLSX = require('c:/Users/91741/Desktop/VedaEd/VedaEd/veda-frontend/node_modules/xlsx');
const fs = require('fs');

const fileBuffer = fs.readFileSync('C:/Users/91741/Downloads/VedaEd_Student_Parent_Bulk_Import_Test_v2.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
console.log('Sheet names:', workbook.SheetNames);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Parsed rows count:', data.length);
console.log('Row 0 raw keys:', Object.keys(data[0]));
console.log('Row 0 full data:', JSON.stringify(data[0], null, 2));

const rows = data.map((row) => ({
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

console.log('\nProcessed Row 0 personalInfo keys:', Object.keys(rows[0].personalInfo));
console.log('Processed Row 0 fatherName:', rows[0].fatherName, 'in personalInfo:', rows[0].personalInfo.fatherName);
console.log('Processed Row 0 motherName:', rows[0].motherName);
console.log('Processed Row 0 emergencyContactName:', rows[0].emergencyContactName);
console.log('Processed Row 0 previousSchool:', rows[0].previousSchool);

