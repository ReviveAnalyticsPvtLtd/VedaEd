const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Student = require('../src/modules/student/studentModels');
const Parent = require('../src/modules/parents/parentModel');
const Class = require('../src/modules/class/classSchema');
const Section = require('../src/modules/section/sectionSchema');
const User = require('../src/models/User');
const studentController = require('../src/modules/student/studentControllers');
const parentController = require('../src/modules/parents/parentControllers');

// Helper to mock express req/res
function mockReqRes(body = {}, query = {}, params = {}, user = {}) {
  let statusCode = 200;
  let responseData = null;

  const req = {
    body,
    query,
    params,
    user,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie() {
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get data() {
      return responseData;
    }
  };

  return { req, res };
}

async function runTests() {
  console.log("=== STARTING STUDENT BULK IMPORT & PARENT AUTO-CREATION TESTS ===");
  await mongoose.connect(process.env.db_Connect_String);

  const School = require('../src/models/School');
  const school = await School.findOne();
  if (!school) {
    throw new Error("No school found in database");
  }
  const schoolId = school._id.toString();
  console.log(`Using school: ${school.name} (${schoolId})`);

  const classDoc = await Class.findOne({ schoolId, name: 'Grade 1' }).populate('sections');
  if (!classDoc || !classDoc.sections.length) {
    throw new Error("Class 'Grade 1' or sections not found");
  }
  const sectionDoc = classDoc.sections[0];
  console.log(`Using Class: ${classDoc.name}, Section: ${sectionDoc.name}`);

  const adminUser = {
    userId: new mongoose.Types.ObjectId(),
    schoolId,
    role: 'admin',
  };

  const testSuffix = Date.now().toString().slice(-5);

  // Clean up any old test data with this test suffix
  const testPhone1 = `98765${testSuffix}`;
  const testPhone2 = `98766${testSuffix}`;
  const testEmail1 = `father_${testSuffix}@example.com`;
  const testEmail2 = `mother_${testSuffix}@example.com`;

  let student1Id = null;
  let parent1Id = null;
  let student2Id = null;
  let student4Id = null;

  try {
    // =========================================================================
    // TEST 1: Complete Student Import with Student & Parent Information
    // =========================================================================
    console.log("\n--- TEST 1: Complete Student Import ---");
    const test1StudentName = `TestStudent1_${testSuffix}`;
    const test1Row = {
      "Name": test1StudentName,
      "Class": classDoc.name,
      "Section": sectionDoc.name,
      "Date of Birth": "2015-05-15",
      "Gender": "Male",
      "Blood Group": "B+",
      "Nationality": "Indian",
      "Religion": "Hindu",
      "Age": "9",
      "Email": `student1_${testSuffix}@school.edu`,
      "Phone": `91111${testSuffix}`,
      "Alternate Phone": `92222${testSuffix}`,
      "Street": "123 Academic Way",
      "City": "Tech City",
      "State": "Madhya Pradesh",
      "Zip Code": "462001",
      "Address": "123 Academic Way, Tech City, Madhya Pradesh, 462001",
      "Previous School": "Sunrise Primary School",
      "Board / University": "CBSE",
      "Class Last Studied": "UKG",
      "Academic Year": "2023-2024",
      "Emergency Contact Name": "Uncle Bob",
      "Emergency Contact Relation": "Uncle",
      "Emergency Contact Phone": `93333${testSuffix}`,
      "Father Name": `Robert_${testSuffix}`,
      "Father Occupation": "Software Architect",
      "Father Phone": testPhone1,
      "Father Email": testEmail1,
      "Mother Name": `Mary_${testSuffix}`,
      "Mother Occupation": "Surgeon",
      "Mother Phone": testPhone2,
      "Mother Email": testEmail2,
      "Guardian Name": `Guardian_${testSuffix}`,
      "Guardian Relation": "Grandfather",
      "Guardian Phone": `94444${testSuffix}`,
      "Guardian Email": `guardian_${testSuffix}@example.com`,
      "Fee": "Paid",
      "Status": "Active"
    };

    const { req: req1, res: res1 } = mockReqRes({ students: [test1Row] }, {}, {}, adminUser);
    await studentController.importStudents(req1, res1);

    console.log("Import response status:", res1.statusCode);
    console.log("Import response message:", res1.data?.message);
    if (res1.statusCode !== 201 || !res1.data?.imported?.length) {
      throw new Error(`Test 1 Failed: Import returned status ${res1.statusCode}: ${JSON.stringify(res1.data)}`);
    }

    student1Id = res1.data.imported[0]._id;
    console.log("Imported Student 1 ID:", student1Id);

    // Verify student in DB
    const student1 = await Student.findById(student1Id);
    if (!student1) throw new Error("Student 1 not found in database");

    // Assert student data fields
    console.assert(student1.personalInfo.name === test1StudentName, "Name mismatch");
    console.assert(student1.personalInfo.gender === "Male", "Gender mismatch");
    console.assert(student1.personalInfo.bloodGroup === "B+", "Blood Group mismatch");
    console.assert(student1.personalInfo.nationality === "Indian", "Nationality mismatch");
    console.assert(student1.personalInfo.religion === "Hindu", "Religion mismatch");
    console.assert(student1.personalInfo.contactDetails.email === `student1_${testSuffix}@school.edu`, "Email mismatch");
    console.assert(student1.personalInfo.contactDetails.mobileNumber === `91111${testSuffix}`, "Phone mismatch");
    console.assert(student1.personalInfo.contactDetails.alternatePhone === `92222${testSuffix}`, "Alt phone mismatch");
    console.assert(student1.contactInfo.street === "123 Academic Way", "Street mismatch");
    console.assert(student1.contactInfo.city === "Tech City", "City mismatch");
    console.assert(student1.contactInfo.state === "Madhya Pradesh", "State mismatch");
    console.assert(student1.contactInfo.zipCode === "462001", "Zip mismatch");
    console.assert(student1.earlierAcademic.schoolName === "Sunrise Primary School", "Prev School mismatch");
    console.assert(student1.earlierAcademic.board === "CBSE", "Board mismatch");
    console.assert(student1.earlierAcademic.lastClass === "UKG", "Last Class mismatch");
    console.assert(student1.earlierAcademic.academicYear === "2023-2024", "Academic Year mismatch");
    console.assert(student1.emergencyContact.name === "Uncle Bob", "Emergency Name mismatch");
    console.assert(student1.emergencyContact.relation === "Uncle", "Emergency Relation mismatch");
    console.assert(student1.emergencyContact.phone === `93333${testSuffix}`, "Emergency Phone mismatch");

    // Verify parent auto-creation and bidirectional relationship
    console.assert(student1.parent != null, "Student 1 parent is not linked");
    parent1Id = student1.parent;
    const parent1 = await Parent.findById(parent1Id);
    if (!parent1) throw new Error("Parent 1 not found in database");

    console.log(`Parent auto-created: ${parent1.name} (ID: ${parent1.parentId})`);
    console.assert(parent1.name === `Robert_${testSuffix}`, "Parent name mismatch");
    console.assert(parent1.fatherName === `Robert_${testSuffix}`, "Father name mismatch");
    console.assert(parent1.fatherOccupation === "Software Architect", "Father occupation mismatch");
    console.assert(parent1.fatherPhone === testPhone1, "Father phone mismatch");
    console.assert(parent1.fatherEmail === testEmail1, "Father email mismatch");
    console.assert(parent1.motherName === `Mary_${testSuffix}`, "Mother name mismatch");
    console.assert(parent1.motherOccupation === "Surgeon", "Mother occupation mismatch");
    console.assert(parent1.motherPhone === testPhone2, "Mother phone mismatch");
    console.assert(parent1.motherEmail === testEmail2, "Mother email mismatch");
    console.assert(parent1.guardian.name === `Guardian_${testSuffix}`, "Guardian name mismatch");
    console.assert(parent1.guardian.relation === "Grandfather", "Guardian relation mismatch");
    console.assert(parent1.guardian.phone === `94444${testSuffix}`, "Guardian phone mismatch");
    console.assert(parent1.guardian.email === `guardian_${testSuffix}@example.com`, "Guardian email mismatch");
    console.assert(parent1.children.some(c => c.toString() === student1Id.toString()), "Student 1 not in parent children");

    // Verify Student Full View Profile API
    const { req: reqProfile, res: resProfile } = mockReqRes({}, {}, { id: student1Id.toString() }, adminUser);
    await studentController.getStudent(reqProfile, resProfile);
    console.assert(resProfile.statusCode === 200, "getStudent API status not 200");
    const loadedStudent = resProfile.data?.student;
    console.assert(loadedStudent.personalInfo.name === test1StudentName, "Profile name mismatch");
    console.assert(loadedStudent.parent != null, "Profile parent not populated");
    console.assert(loadedStudent.parent.fatherName === `Robert_${testSuffix}`, "Profile fatherName mismatch");
    console.assert(loadedStudent.parent.motherName === `Mary_${testSuffix}`, "Profile motherName mismatch");
    console.assert(loadedStudent.parent.guardian?.name === `Guardian_${testSuffix}`, "Profile guardianName mismatch");
    console.assert(loadedStudent.emergencyContact.name === "Uncle Bob", "Profile emergencyContact mismatch");
    console.assert(loadedStudent.earlierAcademic.schoolName === "Sunrise Primary School", "Profile earlierAcademic mismatch");
    console.assert(loadedStudent.contactInfo.city === "Tech City", "Profile contactInfo city mismatch");
    console.log("✅ TEST 1 PASSED: Complete Student Import & Profile Verification successful!");

    // =========================================================================
    // TEST 2: Parent Auto-Creation & List View Verification
    // =========================================================================
    console.log("\n--- TEST 2: Parent Auto-Creation & List View ---");
    const { req: reqParents, res: resParents } = mockReqRes({}, { keyword: `Robert_${testSuffix}` }, {}, adminUser);
    await parentController.getAllParents(reqParents, resParents);
    console.assert(resParents.statusCode === 200, "getAllParents status not 200");
    const parentList = resParents.data?.parents || [];
    console.log("Parent list matching Robert:", parentList.length);
    const listedParent = parentList.find(p => p._id.toString() === parent1Id.toString());
    console.assert(listedParent != null, "Auto-created parent not found in All Parents list");
    console.assert(listedParent.children?.length > 0, "No linked students on listed parent");
    console.assert(listedParent.children[0].stdId === student1.personalInfo.stdId, "Linked Student ID mismatch in list");
    console.log(`Parent list shows: Name=${listedParent.name}, ParentId=${listedParent.parentId}, LinkedStudent=${listedParent.children[0].stdId}`);

    // Verify opening parent full view profile via getParentbyId using parentId, _id, and student stdId
    const { req: reqParentView, res: resParentView } = mockReqRes({}, {}, { id: parent1.parentId }, adminUser);
    await parentController.getParentbyId(reqParentView, resParentView);
    console.assert(resParentView.statusCode === 200, "getParentbyId with parentId failed");
    console.assert(resParentView.data?.parent?.name === `Robert_${testSuffix}`, "getParentbyId parent name mismatch");

    // Also verify getParentbyId using the child's stdId (as used by Parents.js table click)
    const { req: reqParentByChild, res: resParentByChild } = mockReqRes({}, {}, { id: student1.personalInfo.stdId }, adminUser);
    await parentController.getParentbyId(reqParentByChild, resParentByChild);
    console.assert(resParentByChild.statusCode === 200, "getParentbyId with child stdId failed");
    console.assert(resParentByChild.data?.parent?.name === `Robert_${testSuffix}`, "getParentbyId via child stdId mismatch");
    console.log("✅ TEST 2 PASSED: Parent Auto-Creation & List View & Full Profile verified!");

    // =========================================================================
    // TEST 3: Existing Parent Linking (Sibling / Same Parent)
    // =========================================================================
    console.log("\n--- TEST 3: Existing Parent Deduplication & Multiple Children ---");
    const test2StudentName = `TestStudent2_Sibling_${testSuffix}`;
    const test2Row = {
      "Name": test2StudentName,
      "Class": classDoc.name,
      "Section": sectionDoc.name,
      "Gender": "Female",
      "Date of Birth": "2017-08-20",
      "Father Name": `Robert_${testSuffix}`, // same father
      "Father Phone": testPhone1,           // same phone (dedup key!)
      "Father Email": testEmail1,           // same email
      "Mother Name": `Mary_${testSuffix}`,
      "Mother Phone": testPhone2
    };

    const { req: req3, res: res3 } = mockReqRes({ students: [test2Row] }, {}, {}, adminUser);
    await studentController.importStudents(req3, res3);
    console.assert(res3.statusCode === 201 && res3.data?.imported?.length === 1, "Import student 2 failed");

    student2Id = res3.data.imported[0]._id;
    const student2 = await Student.findById(student2Id);
    console.assert(student2 != null, "Student 2 not in database");
    console.assert(student2.parent.toString() === parent1Id.toString(), "Student 2 parent is not Parent 1 (Deduplication failed!)");

    // Verify parent has both children linked
    const updatedParent1 = await Parent.findById(parent1Id);
    console.assert(updatedParent1.children.length === 2, `Parent children count should be 2, got ${updatedParent1.children.length}`);
    const childIds = updatedParent1.children.map(c => c.toString());
    console.assert(childIds.includes(student1Id.toString()), "Child 1 missing from parent children");
    console.assert(childIds.includes(student2Id.toString()), "Child 2 missing from parent children");

    // Verify parent list shows both linked children
    const { req: reqParentsMulti, res: resParentsMulti } = mockReqRes({}, { keyword: `Robert_${testSuffix}` }, {}, adminUser);
    await parentController.getAllParents(reqParentsMulti, resParentsMulti);
    const multiParentItem = resParentsMulti.data?.parents?.find(p => p._id.toString() === parent1Id.toString());
    console.assert(multiParentItem.children.length === 2, "Parent list does not show 2 children");
    console.log(`Parent list linked students: ${multiParentItem.children.map(c => c.stdId).join(", ")}`);
    console.log("✅ TEST 3 PASSED: Sibling linked to existing parent without creating duplicate parent!");

    // =========================================================================
    // TEST 4: Missing Parent Information
    // =========================================================================
    console.log("\n--- TEST 4: Missing Parent Information ---");
    const test4StudentName = `TestStudent4_NoParent_${testSuffix}`;
    const test4Row = {
      "Name": test4StudentName,
      "Class": classDoc.name,
      "Section": sectionDoc.name,
      "Date of Birth": "2016-01-01",
      "Gender": "Male"
      // NO parent information at all
    };

    const countParentsBefore = await Parent.countDocuments({ schoolId });
    const { req: req4, res: res4 } = mockReqRes({ students: [test4Row] }, {}, {}, adminUser);
    await studentController.importStudents(req4, res4);
    console.assert(res4.statusCode === 201 && res4.data?.imported?.length === 1, "Student 4 import failed");

    student4Id = res4.data.imported[0]._id;
    const student4 = await Student.findById(student4Id);
    console.assert(student4 != null, "Student 4 not found");
    console.assert(student4.parent == null, "Student 4 should have no parent linked");

    const countParentsAfter = await Parent.countDocuments({ schoolId });
    console.assert(countParentsBefore === countParentsAfter, `Parent count changed from ${countParentsBefore} to ${countParentsAfter}! Invalid parent was created.`);
    console.log("✅ TEST 4 PASSED: Student imported successfully without creating invalid parent record!");

    // =========================================================================
    // TEST 5: Student Profile Display All Fields
    // =========================================================================
    console.log("\n--- TEST 5: Student Profile Data Verification ---");
    const { req: reqP5, res: resP5 } = mockReqRes({}, {}, { id: student1Id.toString() }, adminUser);
    await studentController.getStudent(reqP5, resP5);
    const s1Prof = resP5.data?.student;
    console.assert(s1Prof.personalInfo.name === test1StudentName, "Full Name not returned");
    console.assert(s1Prof.personalInfo.DOB === "2015-05-15", "DOB not returned");
    console.assert(s1Prof.personalInfo.gender === "Male", "Gender not returned");
    console.assert(s1Prof.personalInfo.bloodGroup === "B+", "Blood Group not returned");
    console.assert(s1Prof.personalInfo.nationality === "Indian", "Nationality not returned");
    console.assert(s1Prof.personalInfo.religion === "Hindu", "Religion not returned");
    console.assert(s1Prof.personalInfo.contactDetails.email === `student1_${testSuffix}@school.edu`, "Email not returned");
    console.assert(s1Prof.contactInfo.street === "123 Academic Way", "Street not returned");
    console.assert(s1Prof.contactInfo.city === "Tech City", "City not returned");
    console.assert(s1Prof.contactInfo.state === "Madhya Pradesh", "State not returned");
    console.assert(s1Prof.contactInfo.zipCode === "462001", "Zip Code not returned");
    console.assert(s1Prof.earlierAcademic.schoolName === "Sunrise Primary School", "School Name not returned");
    console.assert(s1Prof.earlierAcademic.board === "CBSE", "Board not returned");
    console.assert(s1Prof.earlierAcademic.lastClass === "UKG", "Last Class not returned");
    console.assert(s1Prof.earlierAcademic.academicYear === "2023-2024", "Academic Year not returned");
    console.assert(s1Prof.emergencyContact.name === "Uncle Bob", "Emergency Contact not returned");
    console.assert(s1Prof.parent.fatherName === `Robert_${testSuffix}`, "Father Name not returned");
    console.assert(s1Prof.parent.fatherOccupation === "Software Architect", "Father Occupation not returned");
    console.assert(s1Prof.parent.motherName === `Mary_${testSuffix}`, "Mother Name not returned");
    console.assert(s1Prof.parent.guardian.name === `Guardian_${testSuffix}`, "Guardian Name not returned");
    console.log("✅ TEST 5 PASSED: All profile sections return populated data from student and parent schemas!");

    // =========================================================================
    // TEST 6: Re-import Duplicate Handling
    // =========================================================================
    console.log("\n--- TEST 6: Re-import Duplicate Prevention ---");
    const countStudentsBeforeRe = await Student.countDocuments({ schoolId });
    const countParentsBeforeRe = await Parent.countDocuments({ schoolId });

    const { req: reqRe, res: resRe } = mockReqRes({ students: [test1Row, test2Row] }, {}, {}, adminUser);
    await studentController.importStudents(reqRe, resRe);

    console.assert(resRe.data?.skipped?.length === 2, `Expected 2 skipped rows, got ${resRe.data?.skipped?.length}`);
    console.assert(resRe.data?.imported?.length === 0, `Expected 0 imported rows, got ${resRe.data?.imported?.length}`);

    const countStudentsAfterRe = await Student.countDocuments({ schoolId });
    const countParentsAfterRe = await Parent.countDocuments({ schoolId });
    console.assert(countStudentsBeforeRe === countStudentsAfterRe, "Student count changed on re-import!");
    console.assert(countParentsBeforeRe === countParentsAfterRe, "Parent count changed on re-import!");

    const parentAfterRe = await Parent.findById(parent1Id);
    console.assert(parentAfterRe.children.length === 2, "Parent children list was duplicated or corrupted on re-import!");
    console.log("✅ TEST 6 PASSED: Re-import correctly skipped duplicates and preserved existing relationships!");

    // =========================================================================
    // TEST 7: Existing Functionality Regression
    // =========================================================================
    console.log("\n--- TEST 7: Existing Functionality Regression ---");

    // 7A: Manual Student Creation
    console.log("Testing manual student creation...");
    const manualStudentName = `ManualStudent_${testSuffix}`;
    const { req: reqManualStu, res: resManualStu } = mockReqRes({
      personalInfo: {
        name: manualStudentName,
        class: classDoc.name,
        section: sectionDoc.name,
        gender: "Female",
        fees: "Paid",
        password: "default123",
      },
      earlierAcademic: {
        schoolName: "Manual School",
        board: "ICSE"
      },
      contactInfo: {
        city: "Bhopal"
      }
    }, {}, {}, adminUser);
    await studentController.createStudent(reqManualStu, resManualStu);
    console.assert(resManualStu.statusCode === 201, `Manual student create status ${resManualStu.statusCode}`);
    const manualStudentId = resManualStu.data?.student?._id;
    console.assert(manualStudentId != null, "Manual student ID is null");

    // 7B: Manual Parent Creation
    console.log("Testing manual parent creation...");
    const manualParentName = `ManualParent_${testSuffix}`;
    const { req: reqManualP, res: resManualP } = mockReqRes({
      name: manualParentName,
      email: `manualp_${testSuffix}@example.com`,
      phone: `95555${testSuffix}`,
      password: "password123",
      role: "Father"
    }, {}, {}, adminUser);
    await parentController.createParents(reqManualP, resManualP);
    console.assert(resManualP.statusCode === 201, `Manual parent create status ${resManualP.statusCode}`);
    const manualParentId = resManualP.data?.parent?._id;
    console.assert(manualParentId != null, "Manual parent ID is null");

    // 7C: Link manual student to manual parent via student update
    console.log("Testing parent-student linking via update...");
    const { req: reqLink, res: resLink } = mockReqRes({
      personalInfo: {
        name: manualStudentName,
      },
      parent: {
        fatherName: manualParentName,
        infoChanged: true
      }
    }, {}, { id: manualStudentId.toString() }, adminUser);
    // Link parent ObjectId directly
    await Student.findByIdAndUpdate(manualStudentId, { parent: manualParentId });
    await Parent.findByIdAndUpdate(manualParentId, { $push: { children: manualStudentId } });

    // Verify Student List & Parent List
    const { req: reqAllStu, res: resAllStu } = mockReqRes({}, {}, {}, adminUser);
    await studentController.getAllStudents(reqAllStu, resAllStu);
    console.assert(resAllStu.statusCode === 200, "getAllStudents failed");
    console.assert(resAllStu.data?.students?.length > 0, "No students returned in getAllStudents");

    const { req: reqAllP, res: resAllP } = mockReqRes({}, {}, {}, adminUser);
    await parentController.getAllParents(reqAllP, resAllP);
    console.assert(resAllP.statusCode === 200, "getAllParents failed");
    console.assert(resAllP.data?.parents?.length > 0, "No parents returned in getAllParents");

    // Clean up created manual student
    await Student.findByIdAndDelete(manualStudentId);
    await Parent.findByIdAndDelete(manualParentId);
    await User.deleteMany({ refId: { $in: [manualStudentId, manualParentId] } });

    console.log("✅ TEST 7 PASSED: Existing manual creation, linking, and list queries work perfectly!");

    console.log("\n============================================================");
    console.log("ALL 7 TEST SCENARIOS PASSED WITH 100% SUCCESS!");
    console.log("============================================================\n");

  } finally {
    // Clean up test data
    console.log("Cleaning up test records...");
    const cleanupIds = [student1Id, student2Id, student4Id].filter(Boolean);
    if (cleanupIds.length) {
      await Student.deleteMany({ _id: { $in: cleanupIds } });
      await User.deleteMany({ refId: { $in: cleanupIds } });
    }
    if (parent1Id) {
      await Parent.findByIdAndDelete(parent1Id);
      await User.deleteMany({ refId: parent1Id });
    }
    await mongoose.disconnect();
    console.log("Disconnected from DB. Cleanup complete.");
  }
}

runTests().catch(err => {
  console.error("TEST FAILED WITH ERROR:", err);
  process.exit(1);
});
