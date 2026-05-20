const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("./studentModels");
const AdmissionApplication = require("../admission/admissionApplicationModel");
const { generateNextStudentId, peekNextStudentId } = require("../../utils/studentIdGenerator");
const Parent = require("../parents/parentModel");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const path = require('path');
const fs = require('fs');
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const User = require('../../models/User');
const { generateStudentUsernameBase } = require("../../utils/studentUsernameGenerator");
const UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");

const safeDocumentPath = (filename) => {
  const normalizedFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, normalizedFilename);
};

/** Admin student profile may use SIS Student _id or AdmissionApplication _id */
async function findStudentOrAdmissionById(id) {
  if (!id) return null;
  const student = await Student.findById(id);
  if (student) return { kind: "student", doc: student };
  if (mongoose.Types.ObjectId.isValid(id)) {
    const application = await AdmissionApplication.findById(id);
    if (application) return { kind: "application", doc: application };
  }
  return null;
}

const generateUniqueStudentUsername = async (name, dob) => {
  const baseUsername = generateStudentUsernameBase(name, dob) || "user";
  let username = baseUsername;
  let suffix = 1;

  while (await Student.exists({ "personalInfo.username": username })) {
    username = `${baseUsername}${suffix}`;
    suffix += 1;
  }

  return username;
};
}
/** Resolve class / section id whether populated ({ _id, name }) or raw ObjectId */
const refToId = (ref) => {
  if (!ref) return null;
  if (typeof ref === "object" && ref._id) return ref._id;
  return ref;
};

/** Teachers may only read/update students on their assigned class–section roster */
const teacherAssignedToStudent = async (teacherStaffId, studentDoc) => {
  try {
    if (!teacherStaffId || !studentDoc?.personalInfo) return false;
    const classId = refToId(studentDoc.personalInfo.class);
    const sectionId = refToId(studentDoc.personalInfo.section);
    if (!classId || !sectionId) return false;
    const n = await AssignTeacher.countDocuments({
      teachers: teacherStaffId,
      class: classId,
      section: sectionId,
    });
    return n > 0;
  } catch (e) {
    console.error("teacherAssignedToStudent:", e);
    return false;
  }
};

exports.createStudent = async (req, res) => {
  console.log("req-body", req.body);
  const {
    personalInfo,
    parent,
    curriculum,
    assignments,
    exams,
    reports,
    health,
    emergencyContact,
  } = req.body;
  try {
    const requiredFields = ["name", "class", "section", "rollNo"];
    // class and section as id's aa rhe
    for (let fields of requiredFields) {
      console.log(fields);
      if (!personalInfo[fields]) {
        return res.status(400).json({
          success: false,
          message: `${fields} is required`,
        });
      }
    }
    // Class with that name exists?
    const { class: className, section: sectionName } = req.body.personalInfo;

    const existClass = await Class.findOne({ name: className });
    console.log("existClass", existClass);
    if (!existClass) {
      return res.status(400).json({ message: "Class not found" });
    }

    // Section with that name exists?
    const existSection = await Section.findOne({ name: sectionName }, "name");
    console.log(existSection);
    if (!existSection) {
      return res.status(400).json({ message: "Section not found" });
    }
    //CHECK IF SECTION BELONGS TO THIS CLASS
    if (
      !existClass.sections
        .map((id) => id.toString())
        .includes(existSection._id.toString())
    ) {
      return res
        .status(400)
        .json({ message: "Section does not belong to this class" });
    }
    // Student ID + login username (auto-generated from backend)
    const stdIdClean = await generateNextStudentId();

    // persist cleaned/generated stdId
    personalInfo.stdId = stdIdClean;

    const username = await generateUniqueStudentUsername(
      personalInfo.name,
      personalInfo.DOB || personalInfo.dateOfBirth
    );
    personalInfo.username = username;

    const duplicate = await Student.findOne({
      $or: [
        { "personalInfo.username": username },
        { "personalInfo.stdId": stdIdClean },
      ],
    })
      .select("_id personalInfo.stdId personalInfo.username")
      .lean();
    if (duplicate) {
      const sameStdId = duplicate.personalInfo?.stdId === stdIdClean;
      return res.status(409).json({
        success: false,
        message: sameStdId
          ? "A student with this Student ID already exists."
          : "A student with this login username already exists.",
      });
    }

    // const plainPassword = personalInfo.password;
    // const hashedPassword = await bcrypt.hash(personalInfo.password, 10);
    // personalInfo.password = hashedPassword;

    const newStudent = await Student.create({
      personalInfo: {
        ...req.body.personalInfo,
        class: existClass._id,
        section: existSection._id,
      },
      parent,
      curriculum,
      assignments,
      exams,
      exams,
      reports,
      health,
      ...(emergencyContact &&
      typeof emergencyContact === "object" &&
      (emergencyContact.phone || emergencyContact.name || emergencyContact.relation)
        ? {
            emergencyContact: {
              name: emergencyContact.name || "",
              relation: emergencyContact.relation || "",
              phone: emergencyContact.phone || "",
            },
          }
        : {}),
    });

    // linking to parents
    if (parent) {
      const parentExists = await Parent.findById(parent);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent not found",
        });
      }
      await Parent.findByIdAndUpdate(parent, {
        $push: { children: newStudent._id },
      });
    }

    const studentDoc = await Student.findById(newStudent._id)
      .populate("parent")
      .populate("personalInfo.class", "name") // only bring class name
      .populate("personalInfo.section", "name"); // only bring section name
    // convert to plain object
    const student = studentDoc.toObject();

    // replace populated objects with just the `name`
    student.personalInfo.class = student.personalInfo.class?.name || null;
    student.personalInfo.section = student.personalInfo.section?.name || null;
    // student.personalInfo.password = plainPassword;
    // console.log("student: ", student);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });

    // Create User record for auth (Background/Post-response)
    try {
      const roleDoc = await require('../../models/Role').findOne({ name: 'student' });
      if (roleDoc) {
        await require('../../models/User').create({
          name: personalInfo.name,
          email: personalInfo.contactDetails?.email || personalInfo.username,
          password: personalInfo.password, // bcrypt hashing is handled by User model pre-save hook
          roleId: roleDoc._id,
          refId: newStudent._id,
          status: 'active'
        });
        console.log("Auth User created for student");
      }
    } catch (err) {
      console.error("Auth User creation failed for student:", err.message);
    }

  } catch (error) {
    console.error("Error creating student:", error);
    if (error.code === 11000) {
      const keys = error.keyPattern ? Object.keys(error.keyPattern) : [];
      const fieldStr = keys.join(", ") || "record";
      return res.status(409).json({
        success: false,
        message: keys.some((k) => k.includes("username"))
          ? "This login username is already in use. Use a different Student ID."
          : `Duplicate ${fieldStr}. This value is already registered.`,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Find student by username
    const student = await Student.findOne({
      "personalInfo.username": username,
    });
    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      student.personalInfo.password
    );
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = {
      personalInfo: student.personalInfo.select("-personalInfo.password"),
      parentInfo,
      curriculum,
      assignments,
      exams,
      reports,
    };
    // Create JWT payload
    const payload = {
      id: student._id,
      role: "student", // helpful for role-based auth later
      username: student.personalInfo.username,
    };

    // Generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Send token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set secure in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Login successful",
      student: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET students/
exports.getAllStudents = async (req, res) => {
  try {
    let query = {};

    // 1. Parent Access filtering: JWT userId is User._id; Student.parent is Parent._id (User.refId).
    if (req.user && req.user.role === 'parent') {
      const userDoc = await User.findById(req.user.userId).select("refId").lean();
      if (userDoc?.refId) {
        query = { parent: userDoc.refId };
      } else {
        query = { _id: { $in: [] } };
      }
    }

    // 2. Teacher Access filtering: must only see assigned class-section pairs
    if (req.user && req.user.role === 'teacher') {
      // JWT refId points to Staff._id for teacher accounts.
      const teacherStaffId = req.user.refId;
      const assignments = await AssignTeacher.find({ teachers: teacherStaffId })
        .select("class section")
        .lean();

      if (!assignments.length) {
        query = { _id: { $in: [] } };
      } else {
        const classSectionFilters = assignments
          .filter((item) => item.class && item.section)
          .map((item) => ({
            "personalInfo.class": item.class,
            "personalInfo.section": item.section,
          }));

        if (!classSectionFilters.length) {
          query = { _id: { $in: [] } };
        } else {
          query.$or = classSectionFilters;
        }
      }
    }

    // 3. User Filter by class/section
    const { class: cls, section: sec, keyword } = req.query;
    if (cls && cls !== "All") {
      const existClass = await Class.findOne({ name: cls });
      if (existClass) query["personalInfo.class"] = existClass._id;
    }
    if (sec && sec !== "All") {
      const existSection = await Section.findOne({ name: sec });
      if (existSection) query["personalInfo.section"] = existSection._id;
    }
    if (keyword) {
      query["personalInfo.name"] = { $regex: keyword, $options: 'i' };
    }

    // modified//
    // Fetch all students based on the filtered query (newest first)
    const admissionQuery = {
      "personalInfo.fees": { $in: ["Paid", "paid"] },
      // Add basic search/filter support for admission docs as well
      ...(keyword ? { "personalInfo.name": { $regex: keyword, $options: 'i' } } : {}),
      ...(cls && cls !== "All" ? { "personalInfo.classApplied": cls } : {})
    };

    // Teachers should only get roster students from assigned class/section.
    // Admission records are not part of the teacher classroom roster.
    if (req.user && req.user.role === "teacher") {
      admissionQuery._id = { $in: [] };
    }

    const [studentDocs, admissionDocs] = await Promise.all([
      Student.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", "parentId fatherName motherName contactDetails")
        .lean(),
      AdmissionApplication.find(admissionQuery)
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const enrolledStudents = studentDocs.map(student => {
      return {
        ...student,
        personalInfo: {
          ...student.personalInfo,
          class: student.personalInfo.class?.name || null,
          section: student.personalInfo.section?.name || null,
        },
        source: "SIS"
      };
    });

    const pendingAdmissions = admissionDocs.map(app => {
      return {
        _id: app._id,
        personalInfo: {
          ...(app.personalInfo || {}),
          name: app.personalInfo?.name || "Unnamed",
          class: app.personalInfo?.classApplied || "-",
          stdId: app.personalInfo?.stdId || "N/A",
          rollNo: app.personalInfo?.rollNo || "-",
          section: app.personalInfo?.section || "-",
          status: app.personalInfo?.status || "Pending Enrollment"
        },
        contactInfo: app.contactInfo || {},
        earlierAcademic: app.earlierAcademic || {},
        parents: app.parents || {},
        emergencyContact: app.emergencyContact || {},
        transportRequired: app.transportRequired || "",
        medicalConditions: app.medicalConditions || "",
        specialNeeds: app.specialNeeds || "",
        documents: app.documents || [],
        applicationStatus: app.applicationStatus || "",
        source: "Admission"
      };
    });

    // Merge lists
    const mergedStudents = [...enrolledStudents, ...pendingAdmissions];

    res.status(200).json({
      success: true,
      count: mergedStudents.length,
      students: mergedStudents,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// =========================
// OLD MANUAL MAPPING CODE
// COMMENTED FOR BACKUP
// =========================

/*

if (studentDoc) {
  console.log("Found in SIS Students");

  // Map to consistent structure
  studentDoc = {
    ...studentDoc,
    _id: studentDoc._id,
    name: studentDoc.personalInfo?.name,
    stdId: studentDoc.personalInfo?.stdId,
    rollNo: studentDoc.personalInfo?.rollNo,
    grade:
      studentDoc.personalInfo?.class?.name ||
      studentDoc.personalInfo?.class ||
      "-",
    section:
      studentDoc.personalInfo?.section?.name ||
      studentDoc.personalInfo?.section ||
      "-",
    gender: studentDoc.personalInfo?.gender,
    dob: studentDoc.personalInfo?.DOB,
    age: studentDoc.personalInfo?.age,
    bloodGroup: studentDoc.personalInfo?.bloodGroup,
    address: studentDoc.personalInfo?.address,
    contact: studentDoc.personalInfo?.contactDetails?.mobileNumber,
    email: studentDoc.personalInfo?.contactDetails?.email,
    fatherName: studentDoc.parent?.fatherName,
    motherName: studentDoc.parent?.motherName,
    parentContact: studentDoc.parent?.contactDetails?.phone,
    attendance: "92%", // Placeholder
    fee: studentDoc.personalInfo?.fees || "Paid",

    documents: (studentDoc.documents || []).map((doc) => ({
      name: doc.name,
      date: doc.uploadedAt
        ? new Date(doc.uploadedAt).toLocaleDateString()
        : "N/A",
      size: doc.size
        ? (doc.size / 1024).toFixed(2) + " KB"
        : "N/A",
    })),

    source: "SIS",
  };
}

*/


// =========================
// OLD ADMISSION MAPPING CODE
// COMMENTED FOR BACKUP
// =========================

/*

if (admissionDoc) {
  console.log("Found in Admission Applications");

  studentDoc = {
    _id: admissionDoc._id,
    name: admissionDoc.personalInfo?.name,
    stdId: admissionDoc.personalInfo?.stdId,
    rollNo: admissionDoc.personalInfo?.rollNo || "-",
    grade: admissionDoc.personalInfo?.classApplied || "-",
    section: admissionDoc.personalInfo?.section || "-",
    gender: admissionDoc.personalInfo?.gender,
    dob: admissionDoc.personalInfo?.dateOfBirth,
    age: admissionDoc.personalInfo?.age,
    bloodGroup: admissionDoc.personalInfo?.bloodGroup,
    address: admissionDoc.contactInfo?.address,
    contact: admissionDoc.contactInfo?.phone,
    email: admissionDoc.contactInfo?.email,
    fatherName: admissionDoc.parents?.father?.name,
    motherName: admissionDoc.parents?.mother?.name,

    parentContact:
      admissionDoc.parents?.father?.phone ||
      admissionDoc.parents?.mother?.phone,

    attendance: "N/A",
    fee: admissionDoc.personalInfo?.fees || "Pending",

    documents: (admissionDoc.documents || []).map((doc) => ({
      name: doc.name,
      date: doc.uploadedAt
        ? new Date(doc.uploadedAt).toLocaleDateString()
        : "N/A",
      size: doc.size
        ? (doc.size / 1024).toFixed(2) + " KB"
        : "N/A",
    })),

    source: "Admission",
  };
}

*/
// Single student profile
exports.getStudent = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id)
      return res.status(404).json({
        success: false,
        message: "ID invalid/missing",
      });

    // RBAC check: Student can only view their own profile
    if (
      req.user &&
      req.user.role === "student" &&
      req.user.refId?.toString() !== id?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: `Access denied. refId: ${req.user.refId} vs id: ${id}`,
      });
    }

    const trimmedId = id.trim();
    console.log("Fetching student with ID (trimmed):", trimmedId);

    let studentDoc = null;

    // 1. Try finding in SIS Students by ID
    if (mongoose.Types.ObjectId.isValid(trimmedId)) {
      studentDoc = await Student.findById(trimmedId)
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", "parentId fatherName motherName contactDetails")
        .lean();
    }

    // 2. If not found, try finding in SIS Students by stdId or username
    if (!studentDoc) {
      studentDoc = await Student.findOne({
        $or: [
          { "personalInfo.stdId": trimmedId },
          { "personalInfo.username": trimmedId },
        ],
      })
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", "parentId fatherName motherName contactDetails")
        .lean();
    }

    // =========================
    // SIS STUDENT FOUND
    // =========================
    if (studentDoc) {
      console.log("Found in SIS Students");

      if (req.user?.role === "teacher") {
        const allowed = await teacherAssignedToStudent(
          req.user.refId,
          studentDoc
        );
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message:
              "Access denied. You can only view students in your assigned classes.",
          });
        }
      }
      // Map to consistent structure
      studentDoc = {
        ...studentDoc,

        personalInfo: {
          ...studentDoc.personalInfo,

          class:
            studentDoc.personalInfo?.class?.name ||
            studentDoc.personalInfo?.class ||
            null,

          section:
            studentDoc.personalInfo?.section?.name ||
            studentDoc.personalInfo?.section ||
            null,
        },

        source: "SIS",
      };
    } else {
      console.log("Not found in SIS, checking Admission Applications...");

      let admissionDoc = null;

      // 3. Try finding in Admission Applications by ID
      if (mongoose.Types.ObjectId.isValid(trimmedId)) {
        admissionDoc = await AdmissionApplication.findById(
          trimmedId
        ).lean();
      }

      // 4. If not found, try finding in Admission Applications by stdId or username
      if (!admissionDoc) {
        admissionDoc = await AdmissionApplication.findOne({
          $or: [
            { "personalInfo.stdId": trimmedId },
            { "personalInfo.username": trimmedId },
          ],
        }).lean();
      }

      // =========================
      // ADMISSION STUDENT FOUND
      // =========================
      if (admissionDoc) {
        console.log("Found in Admission Applications");

        studentDoc = {
          ...admissionDoc,
          source: "Admission",
        };
      } else {
        console.log("Not found in Admission Applications either");
      }
    }

    if (!studentDoc)
      return res.status(404).json({
        success: false,
        message: `Student not found for ID: ${trimmedId} [LOC_PROFILE]`,
      });

    res.status(200).json({
      success: true,
      student: studentDoc,
    });
  } catch (error) {
    console.error("Error Viewing student Profile:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}; 

/** Names used only for Class/Section lookup; placeholders must not trigger DB lookup failures */
const normalizeClassSectionLookupName = (raw) => {
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && raw.name != null) {
    return normalizeClassSectionLookupName(raw.name);
  }
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (s === "-" || lower === "n/a" || lower === "na" || lower === "none" || lower === "—") {
    return null;
  }
  return s;
};

exports.updateStudent = async (req, res) => {
  console.log("Full request body:", JSON.stringify(req.body, null, 2));
  console.log("Update request for ID:", req.params.id);
  try {
    const { id } = req.params;
    const updateData = req.body;

    const piRaw = req.body.personalInfo || {};
    const className = normalizeClassSectionLookupName(piRaw.class);
    const sectionName = normalizeClassSectionLookupName(piRaw.section);
    console.log("Extracted className:", className, "sectionName:", sectionName);

    let existClass = null;
    let existSection = null;

    // Only validate class and section if they are provided in the request
    if (className) {
      console.log("Looking for class with name:", className);
      existClass = await Class.findOne({ name: className });
      console.log("existClass", existClass);
      if (!existClass) {
        return res.status(400).json({ message: "Class not found" });
      }
    } else {
      console.log("No className provided, skipping class validation");
    }

    if (sectionName) {
      console.log("Looking for section with name:", sectionName);
      existSection = await Section.findOne({ name: sectionName }, "name");
      console.log("existSection", existSection);
      if (!existSection) {
        return res.status(400).json({ message: "Section not found" });
      }
    } else {
      console.log("No sectionName provided, skipping section validation");
    }

    // Only validate class-section relationship if both are provided
    if (existClass && existSection) {
      if (
        !existClass.sections
          .map((id) => id.toString())
          .includes(existSection._id.toString())
      ) {
        return res
          .status(400)
          .json({ message: "Section does not belong to this class" });
      }
    }

    // If password is being updated, hash it
    if (updateData.personalInfo?.password) {
      updateData.personalInfo.password = await bcrypt.hash(
        updateData.personalInfo.password,
        10
      );
    }

    // Get the existing student to preserve required fields
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (req.user?.role === "teacher") {
      const allowed = await teacherAssignedToStudent(
        req.user.refId,
        existingStudent
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only update students in your assigned classes.",
        });
      }
    }

    const pi = updateData.personalInfo || {};
    const ex =
      typeof existingStudent.personalInfo?.toObject === "function"
        ? existingStudent.personalInfo.toObject()
        : existingStudent.personalInfo || {};

    const pick = (key, exKey = key) =>
      pi[key] !== undefined && pi[key] !== null ? pi[key] : ex[exKey];

    const fromProfileBlood =
      pi.bloodGroup !== undefined && pi.bloodGroup !== null
        ? pi.bloodGroup
        : null;
    const fromHealthBlood =
      updateData.health &&
      updateData.health.bloodGroup !== undefined &&
      updateData.health.bloodGroup !== null
        ? updateData.health.bloodGroup
        : null;
    const finalBloodGroup =
      fromProfileBlood !== null
        ? fromProfileBlood
        : fromHealthBlood !== null
        ? fromHealthBlood
        : pick("bloodGroup");

    const existingHealthRaw =
      typeof existingStudent.health?.toObject === "function"
        ? existingStudent.health.toObject()
        : existingStudent.health || {};

    // Use $set operator; merge with existing personalInfo so health-only PATCHes do not wipe profile fields
    const exContact =
      ex.contactDetails && typeof ex.contactDetails === "object"
        ? { ...ex.contactDetails }
        : {};
    const piContact =
      pi.contactDetails && typeof pi.contactDetails === "object"
        ? pi.contactDetails
        : null;
    const mergedContactDetails = piContact
      ? { ...exContact, ...piContact }
      : pick("contactDetails");

    const updateFields = {
      $set: {
        "personalInfo.name": pick("name"),
        "personalInfo.stdId": pick("stdId"),
        "personalInfo.DOB": pick("DOB"),
        "personalInfo.gender": pick("gender"),
        "personalInfo.age": pick("age"),
        "personalInfo.address": pick("address"),
        "personalInfo.contactDetails": mergedContactDetails,
        "personalInfo.fees": pick("fees"),
        "personalInfo.rollNo": pick("rollNo"),
        "personalInfo.bloodGroup": finalBloodGroup,
      }
    };

    if (updateData.health) {
      const healthOut = {
        ...existingHealthRaw,
        ...updateData.health,
      };
      if (finalBloodGroup !== undefined && finalBloodGroup !== null) {
        healthOut.bloodGroup = finalBloodGroup;
      }
      updateFields.$set.health = healthOut;
    } else if (finalBloodGroup !== undefined && finalBloodGroup !== null) {
      updateFields.$set["health.bloodGroup"] = finalBloodGroup;
    }

    // Only update class and section if they are provided and valid
    if (existClass) {
      updateFields.$set["personalInfo.class"] = existClass._id;
    }
    if (existSection) {
      updateFields.$set["personalInfo.section"] = existSection._id;
    }

    if (updateData.emergencyContact !== undefined && updateData.emergencyContact !== null) {
      const ec0 =
        typeof existingStudent.emergencyContact?.toObject === "function"
          ? existingStudent.emergencyContact.toObject()
          : existingStudent.emergencyContact || {};
      const ecIn = updateData.emergencyContact;
      updateFields.$set.emergencyContact = {
        name:
          ecIn.name !== undefined && ecIn.name !== null
            ? ecIn.name
            : ec0.name || "",
        relation:
          ecIn.relation !== undefined && ecIn.relation !== null
            ? ecIn.relation
            : ec0.relation || "",
        phone:
          ecIn.phone !== undefined && ecIn.phone !== null
            ? ecIn.phone
            : ec0.phone || "",
      };
    }

    console.log("Existing student class:", existingStudent.personalInfo.class);
    console.log("Existing student section:", existingStudent.personalInfo.section);
    console.log("Existing student username:", existingStudent.personalInfo.username);
    console.log("Username type:", typeof existingStudent.personalInfo.username);
    console.log("Username is null?", existingStudent.personalInfo.username === null);
    console.log("Username is undefined?", existingStudent.personalInfo.username === undefined);
    console.log("Final update data:", JSON.stringify(updateFields, null, 2));

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(id, updateFields, {
      new: true, // return updated doc
      runValidators: true, // run schema validators
    })
      .populate("personalInfo.class", "name") // populate class with name
      .populate("personalInfo.section", "name") // populate section with name
      .populate("parent", "parentId fatherName motherName contactDetails")
      .select("-personalInfo.password"); // exclude password in response

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (updateData.parent && updatedStudent.parent?._id) {
      const parentUpdate = {};
      if (updateData.parent.fatherName !== undefined) {
        parentUpdate.fatherName = updateData.parent.fatherName;
      }
      if (updateData.parent.motherName !== undefined) {
        parentUpdate.motherName = updateData.parent.motherName;
      }
      if (updateData.parent.contactDetails && typeof updateData.parent.contactDetails === "object") {
        parentUpdate.contactDetails = {
          phone: updateData.parent.contactDetails.phone || "",
          email: updateData.parent.contactDetails.email || "",
        };
      }

      if (Object.keys(parentUpdate).length > 0) {
        await Parent.findByIdAndUpdate(updatedStudent.parent._id, { $set: parentUpdate }, { new: true });
        updatedStudent.parent = await Parent.findById(updatedStudent.parent._id)
          .select("fatherName motherName contactDetails");
      }
    }

    console.log("updatedStudent", updatedStudent);
    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });

    // Sync Auth User
    try {
      const user = await require('../../models/User').findOne({ refId: id });
      const syncPi = updateData.personalInfo;
      if (user && syncPi) {
        user.name = syncPi.name || user.name;
        user.email =
          (syncPi.contactDetails?.email || syncPi.username) || user.email;
        if (syncPi.password) {
          user.password = req.body.personalInfo.password;
        }
        await user.save();
      }
    } catch (err) {
      console.error("Auth User sync failed for student:", err.message);
    }

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/** PUT /students/:id/health — health + optional profile blood group only */
exports.updateStudentHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    if (!updateData.health || typeof updateData.health !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body must include a health object",
      });
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const role = req.user?.role?.toLowerCase();

    if (role === "student") {
      if (req.user.refId?.toString() !== id?.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }
    } else if (role === "teacher") {
      const allowed = await teacherAssignedToStudent(
        req.user.refId,
        existingStudent
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only update students in your assigned classes.",
        });
      }
    }

    const pi = updateData.personalInfo || {};
    const existingHealthRaw =
      typeof existingStudent.health?.toObject === "function"
        ? existingStudent.health.toObject()
        : existingStudent.health || {};

    const mergedHealth = {
      ...existingHealthRaw,
      ...updateData.health,
    };

    const fromProfileBlood =
      pi.bloodGroup !== undefined && pi.bloodGroup !== null
        ? pi.bloodGroup
        : null;
    const fromHealthBlood =
      mergedHealth.bloodGroup !== undefined && mergedHealth.bloodGroup !== null
        ? mergedHealth.bloodGroup
        : null;
    const finalBloodGroup =
      fromProfileBlood !== null
        ? fromProfileBlood
        : fromHealthBlood !== null
        ? fromHealthBlood
        : existingStudent.personalInfo?.bloodGroup ??
          existingHealthRaw.bloodGroup ??
          null;

    if (finalBloodGroup !== null && finalBloodGroup !== undefined) {
      mergedHealth.bloodGroup = finalBloodGroup;
    }

    const updateFields = { $set: { health: mergedHealth } };

    if (finalBloodGroup !== null && finalBloodGroup !== undefined) {
      updateFields.$set["personalInfo.bloodGroup"] = finalBloodGroup;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("personalInfo.class", "name")
      .populate("personalInfo.section", "name")
      .populate("parent", "parentId fatherName motherName contactDetails")
      .select("-personalInfo.password");

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Health record updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student health:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.deleteStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });

    // Cleanup Auth User
    try {
      await require('../../models/User').findOneAndDelete({ refId: id });
    } catch (err) {
      console.error("Auth User cleanup failed for student:", err.message);
    }

  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get student statistics
exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ "personalInfo.status": "Active" });
    const inactiveStudents = await Student.countDocuments({ "personalInfo.status": "Inactive" });

    // Get students by class
    const studentsByClass = await Student.aggregate([
      {
        $group: {
          _id: "$personalInfo.class",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        studentsByClass
      }
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getNextStudentId = async (req, res) => {
  try {
    const nextStudentId = await peekNextStudentId();
    return res.status(200).json({
      success: true,
      nextStudentId,
    });
  } catch (error) {
    console.error("Error fetching next student ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get student dashboard stats (for mobile/web portal)
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const { id } = req.params;

    // RBAC check: Student can only view their own dashboard stats
    if (req.user && req.user.role === 'student' && req.user.refId !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied."
      });
    }

    let student = await Student.findById(id);
    if (!student) {
      student = await AdmissionApplication.findById(id);
    }
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found [LOC_DASH_STATS]" });
    }

    // These would be real counts in a full system
    res.status(200).json({
      success: true,
      stats: {
        assignments: 12, // Placeholder
        attendance: 92, // Placeholder
        exams: 2, // Placeholder
        activities: 4, // Placeholder
      }
    });
  } catch (error) {
    console.error("Error fetching student dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.importStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format: 'students' array is required",
      });
    }

    const results = {
      imported: [],
      skipped: [],
      errors: [],
    };

    const Role = require('../../models/Role');
    const studentRole = await Role.findOne({ name: 'student' }).lean();

    for (const stu of students) {
      try {
        const name = String(stu.personalInfo?.name || "").trim();
        const rawClass = String(stu.personalInfo?.class || "").trim();
        const rawSection = String(stu.personalInfo?.section || "").trim();

        if (!name) {
          results.errors.push({ row: stu, reason: "Name is required" });
          continue;
        }

        // ── Resolve Class ObjectId ──────────────────────────────────────────
        let classId = null;
        if (rawClass && rawClass !== "-") {
          // 1. Try exact match (e.g., "Class 10")
          let cls = await Class.findOne({ name: rawClass });
          
          // 2. If not found and rawClass is just a number (e.g., "10"), try "Class 10"
          if (!cls && /^\d+$/.test(rawClass)) {
            cls = await Class.findOne({ name: `Class ${rawClass}` });
          }

          if (cls) {
            classId = cls._id;
          } else {
            console.warn(`Import: Class not found – "${rawClass}"`);
          }
        }

        // ── Resolve Section ObjectId ────────────────────────────────────────
        let sectionId = null;
        if (rawSection && rawSection !== "-") {
          const sec = await Section.findOne({ name: rawSection });
          if (sec) {
            sectionId = sec._id;
          } else {
            console.warn(`Import: Section not found – "${rawSection}"`);
          }
        }

        // ── Duplicate check: skip if same name + class + section exists ─────
        const duplicateQuery = { "personalInfo.name": name };
        if (classId)   duplicateQuery["personalInfo.class"]   = classId;
        if (sectionId) duplicateQuery["personalInfo.section"] = sectionId;

        const existing = await Student.findOne(duplicateQuery).select("_id personalInfo.stdId").lean();
        if (existing) {
          results.skipped.push({
            name,
            reason: `Student already exists (ID: ${existing.personalInfo?.stdId || existing._id})`
          });
          continue;
        }

        // ── Generate unique Student ID (same logic as createStudent) ────────
        const stdId = await generateNextStudentId();
        const username = await generateUniqueStudentUsername(
          name,
          stu.personalInfo?.DOB || stu.personalInfo?.dateOfBirth
        );
        const plainPassword = stu.personalInfo?.password || "default123";

        // ── Build and save student document ─────────────────────────────────
        const newStudent = await Student.create({
          personalInfo: {
            name,
            class: classId,
            section: sectionId,
            stdId,
            username,
            rollNo: String(stu.personalInfo?.rollNo || "-").trim(),
            fees: (["Paid", "Due"].includes(String(stu.personalInfo?.fees || "").charAt(0).toUpperCase() + String(stu.personalInfo?.fees || "").slice(1).toLowerCase())) 
                  ? String(stu.personalInfo?.fees || "").charAt(0).toUpperCase() + String(stu.personalInfo?.fees || "").slice(1).toLowerCase() 
                  : "Due",
            password: plainPassword,
            status: stu.personalInfo?.status || "Active",
          },
          attendance: stu.attendance || "-",
        });

        results.imported.push({
          _id: newStudent._id,
          name,
          stdId,
          class: rawClass || "-",
          section: rawSection || "-",
        });

        // ── Create Auth User record (background, non-blocking) ───────────────
        if (studentRole) {
          try {
            await User.create({
              name,
              email: stu.personalInfo?.email || username,
              password: plainPassword,
              roleId: studentRole._id,
              refId: newStudent._id,
              status: 'active',
            });
          } catch (authErr) {
            // Auth creation failure is non-fatal for import
            console.warn(`Auth User creation failed for imported student "${name}":`, authErr.message);
          }
        }

      } catch (rowErr) {
        const name = stu.personalInfo?.name || "Unknown";
        console.error(`Error processing import row "${name}":`, rowErr.message);
        results.errors.push({ name, reason: rowErr.message });
      }
    }

    const totalImported = results.imported.length;
    const totalSkipped  = results.skipped.length;
    const totalErrors   = results.errors.length;

    return res.status(201).json({
      success: true,
      message: `Import complete: ${totalImported} added, ${totalSkipped} skipped (already exist), ${totalErrors} error(s)`,
      imported: results.imported,
      skipped:  results.skipped,
      errors:   results.errors,
    });

  } catch (err) {
    console.error("Error in importStudents:", err);
    return res.status(500).json({
      success: false,
      message: "Import failed",
      error: err.message,
    });
  }
};

exports.uploadDocument = async (req, res) => {
  console.log("req.file from uploaddoc student", req.file);
  console.log("req.body:", req.body);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { studentId } = req.body; // send studentId from frontend
    console.log("Received studentId:", studentId);

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const ctx = await findStudentOrAdmissionById(studentId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: "Student or admission record not found" });
    }

    const baseDoc = {
      name: req.file.originalname,
      path: fileUrl,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    if (ctx.kind === "student") {
      const student = ctx.doc;
      if (!student.documents) {
        student.documents = [];
      }
      student.documents.push(baseDoc);
      await student.save();
      const savedDocument = student.documents[student.documents.length - 1];
      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: savedDocument,
      });
    }

    const application = ctx.doc;
    if (!application.documents) {
      application.documents = [];
    }
    application.documents.push({
      ...baseDoc,
      fileType: req.file.mimetype || "",
    });
    await application.save();
    const savedDocument = application.documents[application.documents.length - 1];
    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: savedDocument,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all documents for student
exports.getAllDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log("Getting documents for studentId:", studentId);
    const ctx = await findStudentOrAdmissionById(studentId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: "Student not found [LOC_DOCS]" });
    }

    const raw = ctx.doc.documents || [];
    // Admission applications share one `documents` array with parent profile uploads (`parentProfileUpload: true`)
    const list =
      ctx.kind === "application"
        ? raw.filter((d) => d && d.parentProfileUpload !== true)
        : raw;
    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.previewDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = safeDocumentPath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = safeDocumentPath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { studentId, documentId } = req.params;
    const ctx = await findStudentOrAdmissionById(studentId);

    if (!ctx) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const owner = ctx.doc;
    const targetDocument = owner.documents.id(documentId);
    if (!targetDocument) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (ctx.kind === "application" && targetDocument.parentProfileUpload) {
      return res.status(403).json({
        success: false,
        message: "This file was uploaded from the parent profile and cannot be removed here.",
      });
    }

    if (targetDocument.path) {
      const filename = path.basename(targetDocument.path);
      const filePath = safeDocumentPath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    owner.documents.pull({ _id: documentId });
    await owner.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};