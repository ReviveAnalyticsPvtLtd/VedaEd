const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("../src/config/db");

// Import Models
const User = require("../src/models/User");
const Role = require("../src/models/Role");
const Class = require("../src/modules/class/classSchema");
const Subject = require("../src/modules/subject/subjectSchema");
const Student = require("../src/modules/student/studentModels");
const Syllabus = require("../src/modules/curriculum/syllabusModel");
const StudyMaterial = require("../src/modules/curriculum/studyMaterialModel");

// Import Controllers
const curriculumController = require("../src/modules/curriculum/curriculumController");

const UPLOADS_DIR = path.resolve(__dirname, "../public/uploads");

// Ensure uploads dir exists for testing
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

// Mock Express Response helper
function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log("Starting Syllabus & Study Material Integration Tests...");
  await connectDB();
  console.log("Connected to MongoDB database.");

  // 1. Setup Test Prerequisites (Find or create Class, Subject, Teacher, Student)
  let testClass = await Class.findOne();
  if (!testClass) {
    testClass = await Class.create({ name: "Test Grade 10" });
  }

  let testSubject = await Subject.findOne();
  if (!testSubject) {
    testSubject = await Subject.create({
      subjectCode: "TEST-MATH-101",
      subjectName: "Test Mathematics",
      type: "Theory",
    });
  }

  // Find or create roles
  let teacherRole = await Role.findOne({ name: "teacher" });
  if (!teacherRole) {
    teacherRole = await Role.create({ name: "teacher" });
  }
  let studentRole = await Role.findOne({ name: "student" });
  if (!studentRole) {
    studentRole = await Role.create({ name: "student" });
  }

  // Find or create Teacher User
  let teacherUser = await User.findOne({ email: "test_teacher_verification@veda.com" });
  if (!teacherUser) {
    teacherUser = await User.create({
      name: "Verification Teacher",
      email: "test_teacher_verification@veda.com",
      password: "password123",
      roleId: teacherRole._id,
      status: "active",
    });
  }

  // Find or create Student User and Student record
  let studentUser = await User.findOne({ email: "test_student_verification@veda.com" });
  if (!studentUser) {
    studentUser = await User.create({
      name: "Verification Student",
      email: "test_student_verification@veda.com",
      password: "password123",
      roleId: studentRole._id,
      status: "active",
    });
  }

  let studentRecord = await Student.findOne({ "personalInfo.username": "test_student_verify" });
  if (!studentRecord) {
    studentRecord = await Student.create({
      personalInfo: {
        name: "Verification Student",
        stdId: "STD-VERIFY-01",
        username: "test_student_verify",
        class: testClass._id,
        section: new mongoose.Types.ObjectId(), // Dummy section ID
        rollNo: "R-VERIFY-01",
        password: "password123",
        fees: "Paid",
      },
    });
  }

  // Link Student User to Student record refId
  studentUser.refId = studentRecord._id;
  await studentUser.save();

  console.log("Environment Setup Complete:");
  console.log(`- Class ID: ${testClass._id} (${testClass.name})`);
  console.log(`- Subject ID: ${testSubject._id} (${testSubject.subjectName})`);
  console.log(`- Teacher User ID: ${teacherUser._id}`);
  console.log(`- Student Record ID: ${studentRecord._id}`);

  // Create temporary mock files on disk to test unlink logic
  const mockSyllabusFile = "verify-test-syllabus.pdf";
  const mockMaterialFile1 = "verify-test-mat1.pdf";
  const mockMaterialFile2 = "verify-test-mat2.pdf";
  fs.writeFileSync(path.join(UPLOADS_DIR, mockSyllabusFile), "dummy syllabus content");
  fs.writeFileSync(path.join(UPLOADS_DIR, mockMaterialFile1), "dummy material 1");
  fs.writeFileSync(path.join(UPLOADS_DIR, mockMaterialFile2), "dummy material 2");

  let createdSyllabusId;
  let createdStudyMaterialId;
  let fileIdToDelete;

  try {
    // ==========================================
    // TEST 1: Upload Syllabus (Teacher POV)
    // ==========================================
    console.log("\n--- TEST 1: Upload Syllabus ---");
    const req1 = {
      user: { userId: teacherUser._id, role: "teacher" },
      body: {
        classId: testClass._id.toString(),
        subjectId: testSubject._id.toString(),
        academicYear: "2026-2027",
        title: "Mathematics Syllabus 2026",
        description: "Year-long math syllabus",
        status: "Draft",
      },
      file: {
        filename: mockSyllabusFile,
        originalname: mockSyllabusFile,
      },
    };
    const res1 = mockResponse();
    await curriculumController.uploadSyllabus(req1, res1);

    assert(res1.statusCode === 201, "Syllabus upload returns 201 Created");
    assert(res1.jsonPayload.success === true, "Response payload signals success");
    assert(res1.jsonPayload.data.title === "Mathematics Syllabus 2026", "Syllabus title matches input");
    assert(res1.jsonPayload.data.status === "Draft", "Initial syllabus status is Draft");

    createdSyllabusId = res1.jsonPayload.data._id;

    // ==========================================
    // TEST 2: Get Teacher Syllabuses
    // ==========================================
    console.log("\n--- TEST 2: Get Teacher Syllabuses ---");
    const req2 = {
      user: { userId: teacherUser._id, role: "teacher" },
      query: { classId: testClass._id.toString() },
    };
    const res2 = mockResponse();
    await curriculumController.getTeacherSyllabuses(req2, res2);

    assert(res2.statusCode === 200, "Get teacher syllabuses returns 200");
    assert(res2.jsonPayload.data.length >= 1, "At least 1 syllabus retrieved");
    assert(res2.jsonPayload.data.some(s => s._id.toString() === createdSyllabusId.toString()), "Created syllabus is in list");

    // ==========================================
    // TEST 3: Get Student Syllabuses (Should be 0 since it is in Draft)
    // ==========================================
    console.log("\n--- TEST 3: Get Student Syllabuses (Draft visibility) ---");
    const req3 = {
      user: { userId: studentUser._id, role: "student", refId: studentUser.refId },
      query: {},
    };
    const res3 = mockResponse();
    await curriculumController.getStudentSyllabuses(req3, res3);

    assert(res3.statusCode === 200, "Get student syllabuses returns 200");
    assert(!res3.jsonPayload.data.some(s => s._id.toString() === createdSyllabusId.toString()), "Draft syllabus is hidden from student");

    // ==========================================
    // TEST 4: Update Syllabus & Publish
    // ==========================================
    console.log("\n--- TEST 4: Update Syllabus to Published ---");
    const req4 = {
      user: { userId: teacherUser._id, role: "teacher" },
      params: { id: createdSyllabusId.toString() },
      body: {
        status: "Published",
        title: "Mathematics Syllabus 2026 (Updated)",
      },
    };
    const res4 = mockResponse();
    await curriculumController.updateSyllabus(req4, res4);

    assert(res4.statusCode === 200, "Syllabus update returns 200");
    assert(res4.jsonPayload.data.status === "Published", "Syllabus updated status is Published");
    assert(res4.jsonPayload.data.title === "Mathematics Syllabus 2026 (Updated)", "Syllabus updated title matches");

    // ==========================================
    // TEST 5: Get Student Syllabuses (Should now appear)
    // ==========================================
    console.log("\n--- TEST 5: Get Student Syllabuses (Published visibility) ---");
    const res5 = mockResponse();
    await curriculumController.getStudentSyllabuses(req3, res5); // reuse student request object

    assert(res5.statusCode === 200, "Get student syllabuses returns 200");
    assert(res5.jsonPayload.data.some(s => s._id.toString() === createdSyllabusId.toString()), "Published syllabus is now visible to student");

    // ==========================================
    // TEST 6: Upload Study Material (Teacher POV)
    // ==========================================
    console.log("\n--- TEST 6: Upload Study Material ---");
    const req6 = {
      user: { userId: teacherUser._id, role: "teacher" },
      body: {
        classId: testClass._id.toString(),
        subjectId: testSubject._id.toString(),
        title: "Algebra Lecture Notes",
        description: "PDF files containing linear algebra exercises",
        visibleToStudents: "true",
      },
      files: [
        {
          filename: mockMaterialFile1,
          originalname: mockMaterialFile1,
        },
        {
          filename: mockMaterialFile2,
          originalname: mockMaterialFile2,
        },
      ],
    };
    const res6 = mockResponse();
    await curriculumController.uploadStudyMaterial(req6, res6);

    assert(res6.statusCode === 201, "Study material upload returns 201");
    assert(res6.jsonPayload.data.files.length === 2, "Stored two uploaded files");
    assert(res6.jsonPayload.data.visibleToStudents === true, "Student visibility is set to true");

    createdStudyMaterialId = res6.jsonPayload.data._id;
    fileIdToDelete = res6.jsonPayload.data.files[1]._id; // Store reference to 2nd file

    // ==========================================
    // TEST 7: Get Student Study Materials (Should appear since visibleToStudents = true)
    // ==========================================
    console.log("\n--- TEST 7: Get Student Study Materials ---");
    const req7 = {
      user: { userId: studentUser._id, role: "student", refId: studentUser.refId },
      query: {},
    };
    const res7 = mockResponse();
    await curriculumController.getStudentStudyMaterials(req7, res7);

    assert(res7.statusCode === 200, "Get student study materials returns 200");
    assert(res7.jsonPayload.data.some(m => m._id.toString() === createdStudyMaterialId.toString()), "Study material is visible to student");

    // ==========================================
    // TEST 8: Update Study Material (Toggle Student Visibility to False)
    // ==========================================
    console.log("\n--- TEST 8: Toggle Study Material Visibility to False ---");
    const req8 = {
      user: { userId: teacherUser._id, role: "teacher" },
      params: { id: createdStudyMaterialId.toString() },
      body: {
        visibleToStudents: "false",
      },
    };
    const res8 = mockResponse();
    await curriculumController.updateStudyMaterial(req8, res8);

    assert(res8.statusCode === 200, "Study material toggle returns 200");
    assert(res8.jsonPayload.data.visibleToStudents === false, "Study material visibility set to false");

    // ==========================================
    // TEST 9: Get Student Study Materials (Should be hidden)
    // ==========================================
    console.log("\n--- TEST 9: Get Student Study Materials (Should be empty/hidden) ---");
    const res9 = mockResponse();
    await curriculumController.getStudentStudyMaterials(req7, res9);

    assert(res9.statusCode === 200, "Get student study materials returns 200");
    assert(!res9.jsonPayload.data.some(m => m._id.toString() === createdStudyMaterialId.toString()), "Study material is successfully hidden from student");

    // ==========================================
    // TEST 10: Delete Single File from Study Material
    // ==========================================
    console.log("\n--- TEST 10: Delete Single File from Study Material ---");
    const req10 = {
      user: { userId: teacherUser._id, role: "teacher" },
      params: { id: createdStudyMaterialId.toString(), fileId: fileIdToDelete.toString() },
    };
    const res10 = mockResponse();
    await curriculumController.deleteStudyMaterialFile(req10, res10);

    assert(res10.statusCode === 200, "Delete file returns 200");
    assert(res10.jsonPayload.data.files.length === 1, "Study material now only contains 1 file");
    assert(!fs.existsSync(path.join(UPLOADS_DIR, mockMaterialFile2)), "File 2 was physically deleted from disk");

    // ==========================================
    // TEST 11: Clean Up & Delete Record Entities
    // ==========================================
    console.log("\n--- TEST 11: Deletion & Cleanup ---");
    
    // Delete remaining study material
    const req11 = {
      user: { userId: teacherUser._id, role: "teacher" },
      params: { id: createdStudyMaterialId.toString() },
    };
    const res11 = mockResponse();
    await curriculumController.deleteStudyMaterial(req11, res11);
    assert(res11.statusCode === 200, "Delete study material returns 200");
    assert(!fs.existsSync(path.join(UPLOADS_DIR, mockMaterialFile1)), "File 1 was physically deleted from disk");

    // Delete syllabus
    const req12 = {
      user: { userId: teacherUser._id, role: "teacher" },
      params: { id: createdSyllabusId.toString() },
    };
    const res12 = mockResponse();
    await curriculumController.deleteSyllabus(req12, res12);
    assert(res12.statusCode === 200, "Delete syllabus returns 200");
    assert(!fs.existsSync(path.join(UPLOADS_DIR, mockSyllabusFile)), "Syllabus file was physically deleted from disk");

    console.log("\nAll integration tests passed successfully!");
  } catch (err) {
    console.error("\nTest execution encountered an error:", err);
  } finally {
    // Delete files if they still exist
    [mockSyllabusFile, mockMaterialFile1, mockMaterialFile2].forEach(f => {
      try {
        const fp = path.join(UPLOADS_DIR, f);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch (_) {}
    });

    // Cleanup DB mock records
    if (createdSyllabusId) await Syllabus.findByIdAndDelete(createdSyllabusId);
    if (createdStudyMaterialId) await StudyMaterial.findByIdAndDelete(createdStudyMaterialId);
    if (studentRecord) await Student.findByIdAndDelete(studentRecord._id);
    if (teacherUser) await User.findByIdAndDelete(teacherUser._id);
    if (studentUser) await User.findByIdAndDelete(studentUser._id);

    console.log("Prerequisites and test files cleaned up.");
    process.exit(0);
  }
}

runTests();
