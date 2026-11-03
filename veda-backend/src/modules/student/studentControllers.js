const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("./studentModels");
const AdmissionApplication = require("../admission/admissionApplicationModel");
const { generateNextStudentId, peekNextStudentId } = require("../../utils/studentIdGenerator");
const { generateNextParentId } = require("../../utils/parentIdGenerator");
const Parent = require("../parents/parentModel");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const path = require('path');
const fs = require('fs');
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const Attendance = require("../attendence/attendenceSchema");
const Gradebook = require("../gradebook/gradebookModel");
const Assignment = require("../assignment/assignment");
const Timetable = require("../Timetable/timeTableSchema");
const CalendarEvent = require("../calendar/calendarModel");
const Notice = require("../communication/noticeModel");
const User = require('../../models/User');
const { generateStudentUsernameBase } = require("../../utils/studentUsernameGenerator");
const { getTeacherRosterScope } = require("../../services/teacherAssignmentScope");
const {
  resolveClassSectionCapacity,
  resolveClassAndSection,
  getAssignedRollNumbers,
  findSmallestAvailableRollNumber,
  allocateNextRollNumber,
  validateManualRollNumber,
} = require("./services/rollNumberService");
const UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");

/**
 * Parent fields the student profile endpoints expose. Every populate/select that
 * hydrates `student.parent` must use this list, otherwise fields saved from the
 * SIS student profile are silently dropped on read.
 */
const PARENT_PROFILE_FIELDS = [
  "parentId",
  "name",
  "email",
  "phone",
  "role",
  "occupation",
  "relation",
  "fatherName",
  "motherName",
  "contactDetails",
  "guardian",
  "fatherOccupation",
  "fatherPhone",
  "fatherEmail",
  "motherOccupation",
  "motherPhone",
  "motherEmail",
  "emergencyContact",
  "address",
  "profilePhoto",
  "status",
].join(" ");

const safeDocumentPath = (filename) => {
  const normalizedFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, normalizedFilename);
};

// Tenant context is resolved by authMiddleware from the authenticated User
// document. It is never read from the request payload.
const requireSchool = (req, res) => {
  const schoolId = req.user?.schoolId;
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
    res.status(403).json({
      success: false,
      message: "Your account is not linked to a school.",
    });
    return null;
  }
  return String(schoolId);
};

/** Admin student profile may use SIS Student _id or AdmissionApplication _id */
async function findStudentOrAdmissionById(id, schoolId) {
  if (!id) return null;
  const student = await Student.findOne({ _id: id, schoolId });
  if (student) return { kind: "student", doc: student };
  if (mongoose.Types.ObjectId.isValid(id)) {
    const application = await AdmissionApplication.findById(id);
    if (application) return { kind: "application", doc: application };
  }
  return null;
}

const generateUniqueStudentUsername = async (name, dob, schoolId) => {
  const baseUsername = generateStudentUsernameBase(name, dob) || "user";
  let username = baseUsername;
  let suffix = 1;

  while (await Student.exists({ "personalInfo.username": username, schoolId })) {
    username = `${baseUsername}${suffix}`;
    suffix += 1;
  }

  return username;
};

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
      class: classId,
      section: sectionId,
      $or: [{ teachers: teacherStaffId }, { classTeacher: teacherStaffId }],
    });
    return n > 0;
  } catch (e) {
    console.error("teacherAssignedToStudent:", e);
    return false;
  }
};

exports.createStudent = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  console.log("req-body", req.body);
  const {
    personalInfo = {},
    parent,
    curriculum,
    assignments,
    exams,
    reports,
    health,
    emergencyContact,
  } = req.body;
  try {
    const requiredFields = ["name", "class", "section"];
    for (let fields of requiredFields) {
      if (!personalInfo[fields]) {
        return res.status(400).json({
          success: false,
          message: `${fields} is required`,
        });
      }
    }

    const { class: className, section: sectionName } = personalInfo;

    let classDoc = null;
    let sectionDoc = null;
    try {
      const resolved = await resolveClassAndSection(schoolId, {
        className,
        sectionName,
        classId: mongoose.isValidObjectId(String(className)) ? className : undefined,
        sectionId: mongoose.isValidObjectId(String(sectionName)) ? sectionName : undefined,
      });
      classDoc = resolved.classDoc;
      sectionDoc = resolved.sectionDoc;
    } catch (resolveErr) {
      return res.status(400).json({
        success: false,
        message: resolveErr.message,
      });
    }

    // Roll number allocation / validation
    let assignedRollNo = null;
    const rawRoll = personalInfo.rollNo;
    const isManualRollProvided = rawRoll !== undefined && rawRoll !== null && String(rawRoll).trim() !== "" && String(rawRoll).trim() !== "-" && String(rawRoll).trim() !== "auto";

    if (isManualRollProvided) {
      try {
        const validated = await validateManualRollNumber(
          schoolId,
          classDoc._id,
          sectionDoc._id,
          rawRoll
        );
        assignedRollNo = validated.rollNo;
      } catch (valErr) {
        return res.status(valErr.statusCode || 400).json({
          success: false,
          message: valErr.message,
        });
      }
    } else {
      try {
        const allocated = await allocateNextRollNumber(
          schoolId,
          classDoc._id,
          sectionDoc._id
        );
        assignedRollNo = allocated.rollNo;
      } catch (allocErr) {
        return res.status(allocErr.statusCode || 400).json({
          success: false,
          message: allocErr.message,
        });
      }
    }

    personalInfo.rollNo = assignedRollNo;

    // Student ID + login username (auto-generated from backend)
    let stdIdClean = await generateNextStudentId();
    personalInfo.stdId = stdIdClean;

    let username = await generateUniqueStudentUsername(
      personalInfo.name,
      personalInfo.DOB || personalInfo.dateOfBirth,
      schoolId
    );
    personalInfo.username = username;

    const duplicate = await Student.findOne({
      schoolId,
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

    // Create student with retry on concurrency race condition
    let newStudent = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        newStudent = await Student.create({
          personalInfo: {
            ...personalInfo,
            class: classDoc._id,
            section: sectionDoc._id,
            rollNo: assignedRollNo,
            username,
            stdId: stdIdClean,
          },
          schoolId,
          parent,
          curriculum,
          assignments,
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
          ...(req.body.earlierAcademic && typeof req.body.earlierAcademic === "object"
            ? { earlierAcademic: req.body.earlierAcademic }
            : {}),
          ...(req.body.contactInfo && typeof req.body.contactInfo === "object"
            ? { contactInfo: req.body.contactInfo }
            : {}),
        });
        break;
      } catch (createErr) {
        if (createErr.code === 11000 && attempts < maxAttempts) {
          const keys = createErr.keyPattern ? Object.keys(createErr.keyPattern) : [];
          if (keys.some((k) => k.includes("rollNo")) && !isManualRollProvided) {
            const reAlloc = await allocateNextRollNumber(schoolId, classDoc._id, sectionDoc._id);
            assignedRollNo = reAlloc.rollNo;
            personalInfo.rollNo = assignedRollNo;
          }
          if (keys.some((k) => k.includes("username"))) {
            username = await generateUniqueStudentUsername(
              personalInfo.name,
              personalInfo.DOB || personalInfo.dateOfBirth,
              schoolId
            );
            personalInfo.username = username;
          }
          if (keys.some((k) => k.includes("stdId"))) {
            stdIdClean = await generateNextStudentId();
            personalInfo.stdId = stdIdClean;
          }
          continue;
        }
        throw createErr;
      }
    }

    // linking to parents
    if (parent) {
      const parentExists = await Parent.findOne({ _id: parent, schoolId });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent not found",
        });
      }
      await Parent.findOneAndUpdate(
        { _id: parent, schoolId },
        {
          $push: { children: newStudent._id },
        }
      );
    }

    const studentDoc = await Student.findOne({ _id: newStudent._id, schoolId })
      .populate("parent")
      .populate("personalInfo.class", "name")
      .populate("personalInfo.section", "name");
    const student = studentDoc.toObject();

    student.personalInfo.class = student.personalInfo.class?.name || null;
    student.personalInfo.section = student.personalInfo.section?.name || null;

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
          password: personalInfo.password,
          roleId: roleDoc._id,
          refId: newStudent._id,
          schoolId,
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
      if (keys.some((k) => k.includes("rollNo"))) {
        return res.status(409).json({
          success: false,
          message: "Roll Number is already assigned in this class and section.",
        });
      }
      const fieldStr = keys.join(", ") || "record";
      return res.status(409).json({
        success: false,
        message: keys.some((k) => k.includes("username"))
          ? "This login username is already in use. Use a different Student ID."
          : `Duplicate ${fieldStr}. This value is already registered.`,
      });
    }
    res.status(error.statusCode || 500).json({
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    let query = { schoolId };

    console.log("=== STUDENT TENANT DEBUG ===");
    console.log("DB:", mongoose.connection.name);
    console.log("User ID:", req.user?.userId);
    console.log("Role:", req.user?.role);
    console.log("School ID:", schoolId);
    console.log("Initial query:", JSON.stringify(query));

    // 1. Parent Access filtering: JWT userId is User._id; Student.parent is Parent._id (User.refId).
    if (req.user && req.user.role === 'parent') {
      const userDoc = await User.findOne({ _id: req.user.userId, schoolId }).select("refId").lean();
      if (userDoc?.refId) {
        query.parent = userDoc.refId;
      } else {
        query._id = { $in: [] };
      }
    }

    // 2. Teacher Access filtering: must only see assigned class-section pairs
    if (req.user && req.user.role === 'teacher') {
      // JWT refId points to Staff._id for teacher accounts.
      const { pairs } = await getTeacherRosterScope(req.user.refId, schoolId);

      const classSectionFilters = pairs.map((pair) => ({
        "personalInfo.class": pair.class,
        "personalInfo.section": pair.section,
      }));

      if (!classSectionFilters.length) {
        query._id = { $in: [] };
      } else {
        query.$or = classSectionFilters;
      }
    }

    // 3. User Filter by class/section
    const { class: cls, section: sec, keyword } = req.query;
    if (cls && cls !== "All") {
      const existClass = await Class.findOne({ name: cls, schoolId });
      if (existClass) query["personalInfo.class"] = existClass._id;
    }
    if (sec && sec !== "All") {
      const existSection = await Section.findOne({ name: sec, schoolId });
      if (existSection) query["personalInfo.section"] = existSection._id;
    }
    if (keyword) {
      const matchingClasses = await Class.find({ name: { $regex: keyword, $options: 'i' }, schoolId }).select("_id");
      const classIds = matchingClasses.map(c => c._id);

      const keywordFilter = {
        $or: [
          { "personalInfo.name": { $regex: keyword, $options: 'i' } },
          { "personalInfo.stdId": { $regex: keyword, $options: 'i' } },
          { "personalInfo.contactDetails.mobileNumber": { $regex: keyword, $options: 'i' } },
          ...(classIds.length > 0 ? [{ "personalInfo.class": { $in: classIds } }] : [])
        ]
      };
      if (query.$or) {
        const teacherFilters = query.$or;
        delete query.$or;
        query.$and = [
          { $or: teacherFilters },
          keywordFilter
        ];
      } else {
        query.$or = keywordFilter.$or;
      }
    }

    // modified//
    // Fetch all students based on the filtered query (newest first)
    const admissionQuery = {
      "personalInfo.fees": { $in: ["Paid", "paid"] },
      enrolledStudentId: { $exists: false },
      // Add basic search/filter support for admission docs as well
      ...(keyword ? {
        $or: [
          { "personalInfo.name": { $regex: keyword, $options: 'i' } },
          { "personalInfo.contactDetails.mobileNumber": { $regex: keyword, $options: 'i' } }
        ]
      } : {}),
      ...(cls && cls !== "All" ? { "personalInfo.classApplied": cls } : {})
    };

    // Teachers should only get roster students from assigned class/section.
    // Admission records are not part of the teacher classroom roster.
    if (req.user && req.user.role === "teacher") {
      admissionQuery._id = { $in: [] };
    }

    console.log("Final student query:", JSON.stringify(query));
    console.log(
      "Matching students:",
      await Student.countDocuments(query)
    );
    const [studentDocs, admissionDocs] = await Promise.all([
      Student.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", PARENT_PROFILE_FIELDS)
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
      data: mergedStudents,
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
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
      studentDoc = await Student.findOne({ _id: trimmedId, schoolId })
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", PARENT_PROFILE_FIELDS)
        .lean();
    }

    // 2. If not found, try finding in SIS Students by stdId or username
    if (!studentDoc) {
      studentDoc = await Student.findOne({
        schoolId,
        $or: [
          { "personalInfo.stdId": trimmedId },
          { "personalInfo.username": trimmedId },
        ],
      })
        .populate("personalInfo.class", "name")
        .populate("personalInfo.section", "name")
        .populate("parent", PARENT_PROFILE_FIELDS)
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  console.log("Full request body:", JSON.stringify(req.body, null, 2));
  console.log("Update request for ID:", req.params.id);
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get the existing student
    const existingStudent = await Student.findOne({ _id: id, schoolId });
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

    const piRaw = req.body.personalInfo || {};
    const className = normalizeClassSectionLookupName(piRaw.class);
    const sectionName = normalizeClassSectionLookupName(piRaw.section);
    console.log("Extracted className:", className, "sectionName:", sectionName);

    let targetClass = null;
    let targetSection = null;

    if (className) {
      if (mongoose.isValidObjectId(className)) {
        targetClass = await Class.findOne({ _id: className, schoolId });
      }
      if (!targetClass) {
        targetClass = await Class.findOne({ name: className, schoolId });
      }
      if (!targetClass) {
        return res.status(400).json({ success: false, message: "Class not found" });
      }
    } else if (existingStudent.personalInfo?.class) {
      targetClass = await Class.findOne({ _id: existingStudent.personalInfo.class, schoolId });
    }

    if (sectionName) {
      if (mongoose.isValidObjectId(sectionName)) {
        targetSection = await Section.findOne({ _id: sectionName, schoolId });
      }
      if (!targetSection && targetClass) {
        targetSection = await Section.findOne({
          _id: { $in: targetClass.sections || [] },
          name: sectionName,
          schoolId,
        });
      }
      if (!targetSection) {
        targetSection = await Section.findOne({ name: sectionName, schoolId });
      }
      if (!targetSection) {
        return res.status(400).json({ success: false, message: "Section not found" });
      }
    } else if (existingStudent.personalInfo?.section) {
      targetSection = await Section.findOne({ _id: existingStudent.personalInfo.section, schoolId });
    }

    if (targetClass && targetSection) {
      const secIds = (targetClass.sections || []).map((s) => s.toString());
      if (!secIds.includes(targetSection._id.toString())) {
        return res
          .status(400)
          .json({ success: false, message: "Section does not belong to this class" });
      }
    }

    const isClassChanged = targetClass && targetClass._id.toString() !== existingStudent.personalInfo?.class?.toString();
    const isSectionChanged = targetSection && targetSection._id.toString() !== existingStudent.personalInfo?.section?.toString();

    // Roll number resolution
    let finalRollNo = undefined;
    const isExplicitRoll = piRaw.rollNo !== undefined && piRaw.rollNo !== null && String(piRaw.rollNo).trim() !== "" && String(piRaw.rollNo).trim() !== "-";

    if (isExplicitRoll && targetClass && targetSection) {
      const validated = await validateManualRollNumber(
        schoolId,
        targetClass._id,
        targetSection._id,
        piRaw.rollNo,
        id
      );
      finalRollNo = validated.rollNo;
    } else if ((isClassChanged || isSectionChanged) && targetClass && targetSection) {
      // Student moved to new class/section without explicit new roll number
      try {
        const kept = await validateManualRollNumber(
          schoolId,
          targetClass._id,
          targetSection._id,
          existingStudent.personalInfo?.rollNo,
          id
        );
        finalRollNo = kept.rollNo;
      } catch (keptErr) {
        // Existing roll is invalid/occupied in destination class+section, auto-allocate
        const allocated = await allocateNextRollNumber(
          schoolId,
          targetClass._id,
          targetSection._id,
          id
        );
        finalRollNo = allocated.rollNo;
      }
    } else {
      finalRollNo = piRaw.rollNo !== undefined && piRaw.rollNo !== null && String(piRaw.rollNo).trim() !== "" ? String(piRaw.rollNo).trim() : existingStudent.personalInfo?.rollNo;
    }

    // If password is being updated, hash it
    if (updateData.personalInfo?.password) {
      updateData.personalInfo.password = await bcrypt.hash(
        updateData.personalInfo.password,
        10
      );
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
        "personalInfo.rollNo": finalRollNo,
        "personalInfo.bloodGroup": finalBloodGroup,
        "personalInfo.nationality": pick("nationality"),
        "personalInfo.religion": pick("religion"),
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
    if (targetClass) {
      updateFields.$set["personalInfo.class"] = targetClass._id;
    }
    if (targetSection) {
      updateFields.$set["personalInfo.section"] = targetSection._id;
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

    // Earlier Academic Information card. Merge onto the existing object so a
    // partial payload cannot blank fields the client did not send.
    const toPlain = (doc) =>
      doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};

    if (updateData.earlierAcademic !== undefined && updateData.earlierAcademic !== null) {
      const ea0 = toPlain(existingStudent.earlierAcademic);
      const eaIn = updateData.earlierAcademic;
      const eaVal = (key) =>
        eaIn[key] !== undefined && eaIn[key] !== null ? eaIn[key] : ea0[key] || "";
      updateFields.$set.earlierAcademic = {
        schoolName: eaVal("schoolName"),
        board: eaVal("board"),
        lastClass: eaVal("lastClass"),
        academicYear: eaVal("academicYear"),
      };
    }

    // Contact Information address parts (street / city / state / zip).
    if (updateData.contactInfo !== undefined && updateData.contactInfo !== null) {
      const ci0 = toPlain(existingStudent.contactInfo);
      const ciIn = updateData.contactInfo;
      const ciVal = (key) =>
        ciIn[key] !== undefined && ciIn[key] !== null ? ciIn[key] : ci0[key] || "";
      updateFields.$set.contactInfo = {
        street: ciVal("street"),
        city: ciVal("city"),
        state: ciVal("state"),
        zipCode: ciVal("zipCode"),
      };
    }

    console.log("Final update data:", JSON.stringify(updateFields, null, 2));

    // Update student
    const updatedStudent = await Student.findOneAndUpdate({ _id: id, schoolId }, updateFields, {
      new: true, // return updated doc
      runValidators: true, // run schema validators
    })
      .populate("personalInfo.class", "name") // populate class with name
      .populate("personalInfo.section", "name") // populate section with name
      .populate("parent", PARENT_PROFILE_FIELDS)
      .select("-personalInfo.password"); // exclude password in response

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Parent / guardian details live on the linked Parent document, so there is
    // nowhere to store them without one. Never fabricate a parent record here:
    // fail loudly when the admin actually edited that card, and stay out of the
    // way when they did not (the payload always carries the current values).
    if (updateData.parent && updateData.parent.infoChanged && !updatedStudent.parent?._id) {
      return res.status(409).json({
        success: false,
        message:
          "This student has no parent linked, so parent and guardian details cannot be saved. Create the parent from the Parents module first, then reopen this profile.",
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
      if (updateData.parent.guardian && typeof updateData.parent.guardian === "object") {
        const g = updateData.parent.guardian;
        parentUpdate.guardian = {
          name: g.name || "",
          relation: g.relation || "",
          phone: g.phone || "",
          email: g.email || "",
        };
      }

      // Per-parent details edited on the SIS student profile. Only overwrite a
      // field the client actually sent, so a partial payload cannot blank data.
      [
        "fatherOccupation",
        "fatherPhone",
        "fatherEmail",
        "motherOccupation",
        "motherPhone",
        "motherEmail",
      ].forEach((key) => {
        if (updateData.parent[key] !== undefined) {
          parentUpdate[key] = updateData.parent[key] || "";
        }
      });

      if (Object.keys(parentUpdate).length > 0) {
        await Parent.findOneAndUpdate({ _id: updatedStudent.parent._id, schoolId }, { $set: parentUpdate }, { new: true });
        updatedStudent.parent = await Parent.findOne({ _id: updatedStudent.parent._id, schoolId })
          .select(PARENT_PROFILE_FIELDS);
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
    if (error.code === 11000) {
      const keys = error.keyPattern ? Object.keys(error.keyPattern) : [];
      if (keys.some((k) => k.includes("rollNo"))) {
        return res.status(409).json({
          success: false,
          message: "Roll Number is already assigned to another student in this class and section.",
        });
      }
    }
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/** PUT /students/:id/health — health + optional profile blood group only */
exports.updateStudentHealth = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    if (!updateData.health || typeof updateData.health !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body must include a health object",
      });
    }

    const existingStudent = await Student.findOne({ _id: id, schoolId });
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

    const updatedStudent = await Student.findOneAndUpdate({ _id: id, schoolId }, updateFields, {
      new: true,
      runValidators: true,
    })
      .populate("personalInfo.class", "name")
      .populate("personalInfo.section", "name")
      .populate("parent", PARENT_PROFILE_FIELDS)
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { id } = req.params;

    const deletedStudent = await Student.findOneAndDelete({ _id: id, schoolId });

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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const totalStudents = await Student.countDocuments({ schoolId });
    const activeStudents = await Student.countDocuments({ schoolId, "personalInfo.status": "Active" });
    const inactiveStudents = await Student.countDocuments({ schoolId, "personalInfo.status": "Inactive" });

    // Get students by class
    const studentsByClass = await Student.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(String(schoolId)) } },
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
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

exports.getNextRollNumber = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { classId, className, sectionId, sectionName, studentId } = req.query;

    if (!classId && !className) {
      return res.status(400).json({ success: false, message: "Class is required" });
    }
    if (!sectionId && !sectionName) {
      return res.status(400).json({ success: false, message: "Section is required" });
    }

    const { classDoc, sectionDoc } = await resolveClassAndSection(schoolId, {
      classId,
      className,
      sectionId,
      sectionName,
    });

    const capacity = resolveClassSectionCapacity(classDoc, sectionDoc);
    const { usedNumbers, totalEnrolled } = await getAssignedRollNumbers(
      schoolId,
      classDoc._id,
      sectionDoc._id,
      studentId
    );

    const nextRoll = findSmallestAvailableRollNumber(usedNumbers, capacity);
    const isFull = nextRoll === null;

    return res.status(200).json({
      success: true,
      className: classDoc.name,
      sectionName: sectionDoc.name,
      capacity,
      enrolledCount: totalEnrolled,
      nextRollNo: nextRoll ? String(nextRoll) : null,
      isFull,
      usedRollNumbers: Array.from(usedNumbers).sort((a, b) => a - b),
      message: isFull
        ? `This class/section has reached its maximum capacity of ${capacity} students. No Roll Number is available.`
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching next roll number:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get student dashboard stats (for mobile/web portal)
const STUDENT_MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function studMonthKey(d) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(2)}`;
}

async function studSafe(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.error("Student dashboard stats sub-error:", e.message);
    return fallback;
  }
}

exports.getStudentDashboardStats = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { id } = req.params;

    // Resolve student via route id, req.user.refId, or a User._id → refId chain
    let student = null;
    const candidates = [
      req.user && req.user.refId ? String(req.user.refId) : null,
      id,
    ].filter(Boolean);
    for (const c of candidates) {
      const str = String(c);
      if (!mongoose.Types.ObjectId.isValid(str)) continue;
      student = await studSafe(() => Student.findOne({ _id: str, schoolId }).lean(), null);
      if (student) break;
      const user = await studSafe(() => User.findOne({ _id: str, schoolId }).lean(), null);
      if (
        user &&
        user.refId &&
        mongoose.Types.ObjectId.isValid(user.refId)
      ) {
        student = await studSafe(() => Student.findOne({ _id: user.refId, schoolId }).lean(), null);
        if (student) break;
      }
    }

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // RBAC: Students may only view their own stats
    if (
      req.user &&
      req.user.role === "student" &&
      String(req.user.refId) !== String(student._id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const studentId = student._id;
    const personalInfo = student.personalInfo || {};
    const classId = personalInfo.class;
    const sectionId = personalInfo.section;
    const now = new Date();

    // ---- Attendance (overall + last 6 months) ----
    const attRecs = await studSafe(
      () => Attendance.find({ student: studentId }).lean(),
      []
    );
    let presented = 0;
    let total = 0;
    const attMonthly = {};
    for (const rec of attRecs) {
      total += 1;
      if (rec.status !== "Absent") presented += 1;
      if (rec.date) {
        const mkey = studMonthKey(new Date(rec.date));
        attMonthly[mkey] = attMonthly[mkey] || { present: 0, total: 0 };
        attMonthly[mkey].total += 1;
        if (rec.status !== "Absent") attMonthly[mkey].present += 1;
      }
    }
    const attendance = total ? Math.round((presented / total) * 100) : 0;
    const monthlyAttendance = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const agg = attMonthly[studMonthKey(d)];
      monthlyAttendance.push({
        month: STUDENT_MONTH_NAMES[d.getMonth()],
        value: agg && agg.total ? Math.round((agg.present / agg.total) * 100) : 0,
      });
    }

    // ---- Gradebook → subject performance ----
    const gradeRecs = await studSafe(
      () => Gradebook.find({ student: studentId }).populate("subject", "name").lean(),
      []
    );
    const subjectAgg = {};
    for (const g of gradeRecs) {
      const subjName =
        g.subject && g.subject.name ? g.subject.name : "Subject";
      const agg = (subjectAgg[subjName] = subjectAgg[subjName] || {
        total: 0,
        count: 0,
      });
      for (const m of g.marks || []) {
        agg.total += (Number(m.theory) || 0) + (Number(m.practical) || 0);
        agg.count += 100;
      }
    }
    const subjectProgress = Object.keys(subjectAgg).map((name) => ({
      name,
      value: subjectAgg[name].count
        ? Math.round((subjectAgg[name].total / subjectAgg[name].count) * 100)
        : 0,
    }));

    // ---- Assignments for this class + section ----
    let assignments = [];
    if (classId && sectionId) {
      assignments = await studSafe(
        () =>
          Assignment.find({ class: classId, section: sectionId, status: "Active" })
            .populate("subject", "name")
            .lean(),
        []
      );
    }
    const pendingAssignments = assignments
      .filter(
        (a) =>
          !(a.submissions || []).some(
            (s) =>
              s &&
              String(s.student) === String(studentId) &&
              (s.status === "Submitted" || s.status === "Late")
          )
      )
      .map((a) => ({
        id: String(a._id),
        title: a.title || "Assignment",
        subject: a.subject && a.subject.name ? a.subject.name : "—",
        dueDate: a.dueDate || null,
      }))
      .sort(
        (x, y) => new Date(x.dueDate || 0) - new Date(y.dueDate || 0)
      );

    // ---- Today's classes ----
    const todayName = [
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ][now.getDay()];
    let todayClasses = [];
    if (classId && sectionId) {
      todayClasses = await studSafe(
        () =>
          Timetable.find({ class: classId, section: sectionId, day: todayName })
            .populate("subject", "name")
            .populate("teacher", "name")
            .lean(),
        []
      );
    }
    todayClasses = todayClasses.map((t) => ({
      id: String(t._id),
      title: t.subject && t.subject.name ? t.subject.name : "Class",
      time: `${t.timeFrom || ""} – ${t.timeTo || ""}`.trim(),
      meta: t.teacher && t.teacher.name ? t.teacher.name : t.roomNo || "",
    }));

    // ---- Upcoming events / exams ----
    // Tenant-scoped by schoolId, which requireSchool validated above from
    // req.user.schoolId. This query previously had no schoolId filter, so it
    // returned every scheduled student-visible event in the deployment, letting
    // one school's events populate another school's dashboard exam count and
    // next-exam date. studSafe fails closed to [] if the query throws.
    const upcomingEventsRaw = await studSafe(
      () =>
        CalendarEvent.find({
          schoolId,
          startDate: { $gte: now },
          status: "Scheduled",
          visibility: "Student",
        })
          .sort({ startDate: 1 })
          .limit(8)
          .lean(),
      []
    );
    const upcomingEvents = upcomingEventsRaw.map((e) => ({
      id: String(e._id),
      title: e.title || "Event",
      type: e.type || "Event",
      date: e.startDate || null,
    }));
    const exams = upcomingEvents.filter(
      (e) => String(e.type).toLowerCase() === "exam"
    ).length;
    const nextExamEvent = upcomingEvents.find(
      (e) => String(e.type).toLowerCase() === "exam"
    );

    // ---- Published notices for students ----
    // Tenant-scoped. This query previously had no schoolId filter, so it could
    // surface notices published by a different school on a student dashboard.
    // `schoolId` was already resolved and validated by requireSchool above, and
    // studSafe fails closed to [] if the query throws.
    const notices = await studSafe(
      () =>
        Notice.find({
          schoolId,
          status: "published",
          publishDate: { $lte: now },
          $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
          targetAudience: { $in: ["all", "students"] },
        })
          .sort({ publishDate: -1 })
          .limit(5)
          .lean(),
      []
    );
    const noticesList = notices.map((n) => ({
      id: String(n._id),
      title: n.title || "Notice",
      category: n.category || "general",
      date: n.publishDate || null,
    }));

    res.status(200).json({
      success: true,
      stats: {
        assignments: assignments.length,
        pendingAssignments,
        attendance,
        exams,
        nextExam: nextExamEvent ? nextExamEvent.date : null,
        notices: noticesList,
        activities: 0, // retained for compatibility
        subjectsCount: subjectProgress.length,
        monthlyAttendance,
        subjectProgress,
        todayClasses,
        upcomingEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching student dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Resolve a Student document that belongs to the authenticated school.
 * Accepts the route id, the caller's own refId, or a User._id that points at a
 * student, so admin views and the student portal both resolve. The schoolId
 * filter is what keeps this tenant-safe.
 */
const resolveScopedStudent = async (req, id, schoolId) => {
  const candidates = [
    req.user && req.user.refId ? String(req.user.refId) : null,
    id,
  ].filter(Boolean);

  for (const c of candidates) {
    const str = String(c);
    if (!mongoose.Types.ObjectId.isValid(str)) continue;

    const direct = await studSafe(
      () => Student.findOne({ _id: str, schoolId }).lean(),
      null
    );
    if (direct) return direct;

    const user = await studSafe(
      () => User.findOne({ _id: str, schoolId }).lean(),
      null
    );
    if (user && user.refId && mongoose.Types.ObjectId.isValid(user.refId)) {
      const viaUser = await studSafe(
        () => Student.findOne({ _id: user.refId, schoolId }).lean(),
        null
      );
      if (viaUser) return viaUser;
    }
  }

  return null;
};

exports.getStudentAttendance = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const student = await resolveScopedStudent(req, req.params.id, schoolId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // RBAC: a student may only read their own attendance.
    if (
      req.user &&
      req.user.role === "student" &&
      String(req.user.refId) !== String(student._id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    // Attendance rows carry no schoolId of their own. They are keyed by student
    // reference, and the student above was resolved with a schoolId match, so
    // filtering by that student's _id cannot reach another school's rows.
    // The tenant is never taken from the request body.
    const records = await studSafe(
      () =>
        Attendance.find({ student: student._id })
          .select("date status")
          .sort({ date: -1 })
          .lean(),
      []
    );

    let present = 0;
    let absent = 0;
    let late = 0;
    let lastPresentMs = null;

    for (const rec of records) {
      if (rec.status === "Absent") {
        absent += 1;
        continue;
      }
      if (rec.status === "Late") late += 1;
      else present += 1;
      if (rec.date) {
        const ms = new Date(rec.date).getTime();
        // Take the latest attended day explicitly rather than trusting the
        // sort order, so the answer is correct regardless of index ordering.
        if (!Number.isNaN(ms) && (lastPresentMs === null || ms > lastPresentMs)) {
          lastPresentMs = ms;
        }
      }
    }

    const total = records.length;
    // "Late" counts as attended, matching the definition already used by
    // getStudentDashboardStats (status !== "Absent").
    const attended = present + late;

    res.status(200).json({
      success: true,
      attendance: {
        // null rather than 0 when nothing is recorded, so the UI can tell
        // "no data yet" apart from "absent every single day".
        percentage: total > 0 ? Math.round((attended / total) * 100) : null,
        present,
        late,
        absent,
        total,
        lastPresent: lastPresentMs === null ? null : new Date(lastPresentMs),
      },
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.importStudents = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const rawData = req.body;
    const students = Array.isArray(rawData) ? rawData : (rawData?.students || []);

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
    const [studentRole, parentRole] = await Promise.all([
      Role.findOne({ name: 'student' }).lean(),
      Role.findOne({ name: 'parent' }).lean()
    ]);

    const passwordHashCache = new Map();
    const hashPasswordCached = async (plain) => {
      const p = plain || "default123";
      if (passwordHashCache.has(p)) return passwordHashCache.get(p);
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(p, salt);
      passwordHashCache.set(p, hash);
      return hash;
    };

    const getVal = (row, keys, fallback = "") => {
      if (!row || typeof row !== "object") return fallback;

      // 1. Direct checks
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
      }

      // 2. Check in common nested containers if present
      const containers = [
        row.personalInfo,
        row.contactDetails,
        row.contactInfo,
        row.emergencyContact,
        row.earlierAcademic,
        row.parent,
        row.parents,
        row.parents?.father,
        row.parents?.mother,
        row.parents?.guardian,
      ];

      for (const c of containers) {
        if (c && typeof c === "object") {
          for (const k of keys) {
            if (c[k] !== undefined && c[k] !== null && String(c[k]).trim() !== "") {
              return String(c[k]).trim();
            }
          }
        }
      }

      // 3. Normalized key check on root row
      const rowKeyMap = {};
      for (const rk of Object.keys(row)) {
        const norm = rk.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!rowKeyMap[norm]) rowKeyMap[norm] = rk;
      }
      for (const k of keys) {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (rowKeyMap[normK]) {
          const actualKey = rowKeyMap[normK];
          if (row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== "") {
            return String(row[actualKey]).trim();
          }
        }
      }

      // 4. Normalized key check on nested objects
      for (const c of containers) {
        if (c && typeof c === "object") {
          const cKeyMap = {};
          for (const rk of Object.keys(c)) {
            const norm = rk.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (!cKeyMap[norm]) cKeyMap[norm] = rk;
          }
          for (const k of keys) {
            const normK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cKeyMap[normK]) {
              const actualKey = cKeyMap[normK];
              if (c[actualKey] !== undefined && c[actualKey] !== null && String(c[actualKey]).trim() !== "") {
                return String(c[actualKey]).trim();
              }
            }
          }
        }
      }

      return fallback;
    };

    // Track batch allocated roll numbers per classId:sectionId
    const batchRollMap = new Map();

    // In-memory parent cache for deduplicating siblings in the same batch
    const batchParentsByPhone = new Map();
    const batchParentsByEmail = new Map();

    for (const stu of students) {
      try {
        const name = getVal(stu, ["name", "Name", "Student Name", "StudentName", "Full Name", "FullName", "student_name"]);
        const rawClass = getVal(stu, ["class", "Class", "Grade", "grade", "ClassName", "Class Name"]);
        const rawSection = getVal(stu, ["section", "Section", "sec", "Sec", "Section Name"]);

        if (!name) {
          results.errors.push({ row: stu, reason: "Name is required" });
          continue;
        }

        // ── Resolve Class ObjectId ──────────────────────────────────────────
        let classId = null;
        let classDoc = null;
        if (rawClass && rawClass !== "-") {
          if (mongoose.isValidObjectId(rawClass)) {
            classDoc = await Class.findOne({ _id: rawClass, schoolId });
          }
          if (!classDoc) {
            classDoc = await Class.findOne({ name: rawClass, schoolId });
          }
          if (!classDoc && /^\d+$/.test(rawClass)) {
            classDoc = await Class.findOne({ name: `Grade ${rawClass}`, schoolId }) ||
                       await Class.findOne({ name: `Class ${rawClass}`, schoolId });
          }
          if (classDoc) {
            classId = classDoc._id;
          } else {
            results.errors.push({ name, reason: `Class not found: "${rawClass}"` });
            continue;
          }
        } else {
          results.errors.push({ name, reason: "Class is required" });
          continue;
        }

        // ── Resolve Section ObjectId ────────────────────────────────────────
        let sectionId = null;
        let sectionDoc = null;
        if (rawSection && rawSection !== "-") {
          if (mongoose.isValidObjectId(rawSection)) {
            sectionDoc = await Section.findOne({ _id: rawSection, schoolId });
          }
          if (!sectionDoc && classDoc) {
            sectionDoc = await Section.findOne({
              _id: { $in: classDoc.sections || [] },
              name: rawSection,
              schoolId,
            });
          }
          if (!sectionDoc) {
            sectionDoc = await Section.findOne({ name: rawSection, schoolId });
          }
          if (sectionDoc) {
            sectionId = sectionDoc._id;
          } else {
            results.errors.push({ name, reason: `Section not found: "${rawSection}"` });
            continue;
          }
        } else {
          results.errors.push({ name, reason: "Section is required" });
          continue;
        }

        // Verify section belongs to class
        const secIds = (classDoc.sections || []).map((s) => s.toString());
        if (!secIds.includes(sectionDoc._id.toString())) {
          results.errors.push({ name, reason: `Section "${rawSection}" does not belong to Class "${rawClass}"` });
          continue;
        }

        // ── Student ID / Duplicate Check ────────────────────────────────────
        const rawStdId = getVal(stu, ["stdId", "Student ID", "StudentId", "StudentID", "Std ID", "std_id", "Student_ID"]);
        const duplicateConditions = [
          {
            "personalInfo.name": name,
            "personalInfo.class": classId,
            "personalInfo.section": sectionId,
          }
        ];
        if (rawStdId && rawStdId !== "-" && rawStdId.toLowerCase() !== "auto") {
          duplicateConditions.push({ "personalInfo.stdId": rawStdId });
        }

        const existingStudent = await Student.findOne({
          schoolId,
          $or: duplicateConditions
        });

        // ── Extract All Additional Student Data ──────────────────────────────
        const rawDob = getVal(stu, ["dob", "DOB", "Date of Birth", "DateOfBirth", "Birth Date", "BirthDate", "dateOfBirth", "date_of_birth"]);
        let dobVal = rawDob;
        if (typeof rawDob === "number") {
          const d = new Date(Math.round((rawDob - 25569) * 86400 * 1000));
          if (!isNaN(d.getTime())) dobVal = d.toISOString().split("T")[0];
        }

        const rawGender = getVal(stu, ["gender", "Gender", "Sex", "sex"]);
        let genderVal = "";
        if (rawGender) {
          if (/^f/i.test(rawGender.trim())) genderVal = "Female";
          else if (/^m/i.test(rawGender.trim())) genderVal = "Male";
          else if (/^o/i.test(rawGender.trim())) genderVal = "Other";
          else genderVal = rawGender.trim();
        }

        const rawBlood = getVal(stu, ["bloodGroup", "blood group", "Blood Group", "BloodGroup", "Blood", "blood_group"]);
        const bloodGroupVal = rawBlood ? rawBlood.trim().toUpperCase() : "";

        const nationalityVal = getVal(stu, ["nationality", "Nationality"]);
        const religionVal = getVal(stu, ["religion", "Religion"]);
        const ageVal = getVal(stu, ["age", "Age"]);

        const rawFees = getVal(stu, ["fees", "Fees", "fee", "Fee", "Fee Status", "feeStatus"]);
        const feesVal = (rawFees && ["paid", "due"].includes(rawFees.trim().toLowerCase()))
          ? (rawFees.trim().toLowerCase() === "paid" ? "Paid" : "Due")
          : "Paid";

        const rawStatus = getVal(stu, ["status", "Status"]);
        const statusVal = (rawStatus && rawStatus.trim().toLowerCase() === "inactive") ? "Inactive" : "Active";

        const admissionDateRaw = getVal(stu, ["admissionDate", "Admission Date", "Date of Admission", "admission_date"]);
        let admissionDateVal = new Date();
        if (admissionDateRaw) {
          const parsedAd = new Date(admissionDateRaw);
          if (!isNaN(parsedAd.getTime())) admissionDateVal = parsedAd;
        }

        const plainPassword = getVal(stu, ["password", "Password", "Pass", "pass"]) || "default123";

        // Contact details
        const emailVal = getVal(stu, ["email", "Email", "Student Email", "Student Email ID", "student_email", "Email ID"]);
        const phoneVal = getVal(stu, ["mobileNumber", "phone", "Phone", "Mobile", "Student Phone", "Student Mobile", "Contact Number", "Contact", "mobile"]);
        const countryCodeVal = getVal(stu, ["countryCode", "Country Code", "country_code"]);
        const altPhoneVal = getVal(stu, ["alternatePhone", "Alternate Phone", "Alt Phone", "Alt Mobile", "alternate_phone"]);

        // Address parts
        let streetVal = getVal(stu, ["street", "Street", "Street Address", "Address Line 1", "Address 1"]);
        let cityVal = getVal(stu, ["city", "City", "Town"]);
        let stateVal = getVal(stu, ["state", "State", "Province"]);
        let zipVal = getVal(stu, ["zipCode", "Zip Code", "ZipCode", "Zip", "Pincode", "Pin Code", "Postal Code", "zip_code", "pincode"]);
        let addressVal = getVal(stu, ["address", "Address", "Full Address", "Residential Address", "residential_address"]);

        if (addressVal && (!streetVal || !cityVal || !stateVal || !zipVal)) {
          const parts = String(addressVal).split(",").map(s => s.trim()).filter(Boolean);
          if (!streetVal && parts[0]) streetVal = parts[0];
          if (!cityVal && parts[1]) cityVal = parts[1];
          if (parts.length >= 3) {
            const tail = parts.slice(2).join(", ");
            const zipMatch = tail.match(/(\d{4,10})$/);
            if (!zipVal && zipMatch) zipVal = zipMatch[1];
            if (!stateVal) stateVal = tail.replace(/\s+\d{4,10}$/, "").trim();
          }
        }
        if (!addressVal && (streetVal || cityVal || stateVal || zipVal)) {
          addressVal = [streetVal, cityVal, stateVal, zipVal].filter(Boolean).join(", ");
        }

        // Earlier academic
        const schoolNameVal = getVal(stu, ["previousSchool", "Previous School", "Previous School Name", "Earlier School", "schoolName", "school_name"]);
        const boardVal = getVal(stu, ["boardOrUniversity", "board", "Board / University", "Board/University", "Board", "University", "board_university"]);
        const lastClassVal = getVal(stu, ["classLastStudied", "lastClass", "Class Last Studied", "Class Last Studied/Passed", "Last Class", "Class Studied", "Previous Class", "last_class"]);
        const academicYearVal = getVal(stu, ["academicYear", "Academic Year", "AcademicYear", "Session", "Year of Study", "academic_year"]);

        // Emergency contact
        let emergencyName = getVal(stu, ["emergencyContactName", "emergencyName", "Emergency Contact Name", "Emergency Contact", "Emergency Name", "emergency_contact_name"]);
        let emergencyRelation = getVal(stu, ["emergencyContactRelation", "emergencyRelation", "Emergency Contact Relation", "Emergency Relation", "Relation with Emergency Contact", "emergency_relation"]);
        let emergencyPhone = getVal(stu, ["emergencyContactPhone", "emergencyPhone", "Emergency Contact Phone", "Emergency Phone", "Emergency Mobile", "Emergency Contact Number", "emergency_phone"]);

        // Parent Information fields
        const fatherName = getVal(stu, ["fatherName", "Father Name", "Father's Name", "FatherName", "Father"]);
        const fatherOccupation = getVal(stu, ["fatherOccupation", "Father Occupation", "Father's Occupation", "Father Profession", "Father Occupation/Profession"]);
        const fatherPhone = getVal(stu, ["fatherPhone", "Father Phone", "Father's Phone", "Father Mobile", "Father Mobile Number", "Father Contact", "Father Contact Number"]);
        const fatherEmail = getVal(stu, ["fatherEmail", "Father Email", "Father's Email", "Father Email ID"]);

        const motherName = getVal(stu, ["motherName", "Mother Name", "Mother's Name", "MotherName", "Mother"]);
        const motherOccupation = getVal(stu, ["motherOccupation", "Mother Occupation", "Mother's Occupation", "Mother Profession"]);
        const motherPhone = getVal(stu, ["motherPhone", "Mother Phone", "Mother's Phone", "Mother Mobile", "Mother Mobile Number", "Mother Contact", "Mother Contact Number"]);
        const motherEmail = getVal(stu, ["motherEmail", "Mother Email", "Mother's Email", "Mother Email ID"]);

        const guardianName = getVal(stu, ["guardianName", "Guardian Name", "Guardian's Name", "Local Guardian Name", "Guardian"]);
        const guardianRelation = getVal(stu, ["guardianRelation", "Guardian Relation", "Relation with Guardian", "Guardian's Relation"]);
        const guardianPhone = getVal(stu, ["guardianPhone", "Guardian Phone", "Guardian's Phone", "Guardian Mobile", "Guardian Contact"]);
        const guardianEmail = getVal(stu, ["guardianEmail", "Guardian Email", "Guardian's Email", "Guardian Email ID"]);
        const guardianOccupation = getVal(stu, ["guardianOccupation", "Guardian Occupation", "Guardian's Occupation", "Guardian Profession"]);

        const genericParentName = getVal(stu, ["parentName", "Parent Name", "Parent", "Primary Guardian Name"]);
        const genericParentPhone = getVal(stu, ["parentPhone", "Parent Phone", "Parent Mobile", "Parent Contact"]);
        const genericParentEmail = getVal(stu, ["parentEmail", "Parent Email", "Parent Email ID"]);
        const genericParentRole = getVal(stu, ["parentRole", "Role", "Parent Role", "Parent Relation"]);
        const genericParentOccupation = getVal(stu, ["parentOccupation", "Parent Occupation"]);

        // Fallback emergency contact from parent if not specified
        if (!emergencyName) {
          emergencyName = fatherName || motherName || guardianName || genericParentName || "";
          emergencyRelation = emergencyRelation || (fatherName ? "Father" : motherName ? "Mother" : guardianName ? (guardianRelation || "Guardian") : "Parent");
          emergencyPhone = emergencyPhone || fatherPhone || motherPhone || guardianPhone || genericParentPhone || "";
        }

        let targetStudent = null;
        let isNewStudent = false;
        let finalRollNo = null;

        if (existingStudent) {
          targetStudent = existingStudent;
          finalRollNo = existingStudent.personalInfo?.rollNo;

          // Backfill missing fields without overwriting valid data
          let studentChanged = false;
          const pi = targetStudent.personalInfo || {};
          if (!pi.DOB && dobVal) { pi.DOB = dobVal; studentChanged = true; }
          if (!pi.gender && genderVal) { pi.gender = genderVal; studentChanged = true; }
          if (!pi.bloodGroup && bloodGroupVal) { pi.bloodGroup = bloodGroupVal; studentChanged = true; }
          if (!pi.nationality && nationalityVal) { pi.nationality = nationalityVal; studentChanged = true; }
          if (!pi.religion && religionVal) { pi.religion = religionVal; studentChanged = true; }
          if (!pi.age && ageVal) { pi.age = ageVal; studentChanged = true; }
          if (!pi.address && addressVal) { pi.address = addressVal; studentChanged = true; }
          if ((!pi.fees || pi.fees === "Due") && feesVal === "Paid") { pi.fees = feesVal; studentChanged = true; }

          if (!pi.contactDetails) pi.contactDetails = {};
          if (!pi.contactDetails.mobileNumber && phoneVal) { pi.contactDetails.mobileNumber = phoneVal; studentChanged = true; }
          if (!pi.contactDetails.countryCode && countryCodeVal) { pi.contactDetails.countryCode = countryCodeVal; studentChanged = true; }
          if (!pi.contactDetails.alternatePhone && altPhoneVal) { pi.contactDetails.alternatePhone = altPhoneVal; studentChanged = true; }
          if (!pi.contactDetails.email && emailVal) { pi.contactDetails.email = emailVal; studentChanged = true; }
          targetStudent.personalInfo = pi;

          if (!targetStudent.contactInfo) targetStudent.contactInfo = {};
          if (!targetStudent.contactInfo.street && streetVal) { targetStudent.contactInfo.street = streetVal; studentChanged = true; }
          if (!targetStudent.contactInfo.city && cityVal) { targetStudent.contactInfo.city = cityVal; studentChanged = true; }
          if (!targetStudent.contactInfo.state && stateVal) { targetStudent.contactInfo.state = stateVal; studentChanged = true; }
          if (!targetStudent.contactInfo.zipCode && zipVal) { targetStudent.contactInfo.zipCode = zipVal; studentChanged = true; }

          if (!targetStudent.emergencyContact) targetStudent.emergencyContact = {};
          if (!targetStudent.emergencyContact.name && emergencyName) { targetStudent.emergencyContact.name = emergencyName; studentChanged = true; }
          if (!targetStudent.emergencyContact.relation && emergencyRelation) { targetStudent.emergencyContact.relation = emergencyRelation; studentChanged = true; }
          if (!targetStudent.emergencyContact.phone && emergencyPhone) { targetStudent.emergencyContact.phone = emergencyPhone; studentChanged = true; }

          if (!targetStudent.earlierAcademic) targetStudent.earlierAcademic = {};
          if (!targetStudent.earlierAcademic.schoolName && schoolNameVal) { targetStudent.earlierAcademic.schoolName = schoolNameVal; studentChanged = true; }
          if (!targetStudent.earlierAcademic.board && boardVal) { targetStudent.earlierAcademic.board = boardVal; studentChanged = true; }
          if (!targetStudent.earlierAcademic.lastClass && lastClassVal) { targetStudent.earlierAcademic.lastClass = lastClassVal; studentChanged = true; }
          if (!targetStudent.earlierAcademic.academicYear && academicYearVal) { targetStudent.earlierAcademic.academicYear = academicYearVal; studentChanged = true; }

          if (studentChanged) {
            await targetStudent.save();
          }

        } else {
          // ── Roll Number Allocation & Batch Conflict Tracking ────────────────
          const batchKey = `${classId.toString()}:${sectionId.toString()}`;
          if (!batchRollMap.has(batchKey)) {
            const dbAssigned = await getAssignedRollNumbers(schoolId, classId, sectionId);
            batchRollMap.set(batchKey, new Set(dbAssigned.usedNumbers));
          }
          const currentBatchSet = batchRollMap.get(batchKey);
          const capacity = resolveClassSectionCapacity(classDoc, sectionDoc);

          const rawRoll = getVal(stu, ["rollNo", "roll", "Roll", "RollNo", "Roll Number", "Roll No", "roll_no", "Roll#"]);
          const hasManualRoll = rawRoll !== undefined && rawRoll !== null && String(rawRoll).trim() !== "" && String(rawRoll).trim() !== "-" && String(rawRoll).trim().toLowerCase() !== "auto";

          if (hasManualRoll) {
            const parsed = parseInt(String(rawRoll).trim(), 10);
            if (!Number.isInteger(parsed) || parsed < 1 || parsed > capacity || currentBatchSet.has(parsed)) {
              if (!Number.isInteger(parsed) || parsed < 1) {
                results.errors.push({ name, reason: `Invalid roll number: "${rawRoll}"` });
                continue;
              }
              if (parsed > capacity) {
                results.errors.push({ name, reason: `Roll number ${parsed} exceeds capacity of ${capacity}` });
                continue;
              }
              if (currentBatchSet.has(parsed)) {
                results.errors.push({ name, reason: `Roll number ${parsed} is already assigned in ${classDoc.name} - Section ${sectionDoc.name}` });
                continue;
              }
            }
            finalRollNo = String(parsed);
            currentBatchSet.add(parsed);
          } else {
            const nextRoll = findSmallestAvailableRollNumber(currentBatchSet, capacity);
            if (nextRoll === null) {
              results.errors.push({ name, reason: `Class ${classDoc.name} - Section ${sectionDoc.name} reached capacity of ${capacity} students` });
              continue;
            }
            finalRollNo = String(nextRoll);
            currentBatchSet.add(nextRoll);
          }

          // Student ID and username
          let stdId = rawStdId && rawStdId !== "-" && rawStdId.toLowerCase() !== "auto"
            ? rawStdId
            : await generateNextStudentId();

          const username = await generateUniqueStudentUsername(name, dobVal, schoolId);

          targetStudent = await Student.create({
            schoolId,
            personalInfo: {
              name,
              class: classId,
              section: sectionId,
              stdId,
              username,
              rollNo: finalRollNo,
              DOB: dobVal || "",
              gender: genderVal,
              bloodGroup: bloodGroupVal,
              nationality: nationalityVal,
              religion: religionVal,
              age: ageVal,
              admissionDate: admissionDateVal,
              status: statusVal,
              fees: feesVal,
              contactDetails: {
                mobileNumber: phoneVal,
                countryCode: countryCodeVal,
                alternatePhone: altPhoneVal,
                email: emailVal,
              },
              address: addressVal,
              password: plainPassword,
            },
            contactInfo: {
              street: streetVal,
              city: cityVal,
              state: stateVal,
              zipCode: zipVal,
            },
            emergencyContact: {
              name: emergencyName,
              relation: emergencyRelation,
              phone: emergencyPhone,
            },
            earlierAcademic: {
              schoolName: schoolNameVal,
              board: boardVal,
              lastClass: lastClassVal,
              academicYear: academicYearVal,
            },
            attendance: stu.attendance || "-",
          });

          isNewStudent = true;
        }

        // ── Automatic Parent Creation & Deduplication ───────────────────────
        let linkedParent = null;
        const hasParentName = Boolean(fatherName || motherName || guardianName || genericParentName);
        const candidatePhones = [fatherPhone, motherPhone, guardianPhone, genericParentPhone].filter(Boolean);
        const candidateEmails = [fatherEmail, motherEmail, guardianEmail, genericParentEmail].filter(Boolean);

        const primaryPhone = candidatePhones[0] || (phoneVal ? String(phoneVal).trim() : "");
        const primaryEmail = candidateEmails[0] || (emailVal ? String(emailVal).trim().toLowerCase() : "");

        if (hasParentName && (primaryPhone || candidateEmails.length > 0)) {
          // Normalize candidate phones and emails for reliable deduplication
          const phoneNorms = [];
          for (const p of candidatePhones) {
            const rawP = String(p).trim();
            phoneNorms.push(rawP);
            const digits = rawP.replace(/\D/g, "");
            if (digits) {
              phoneNorms.push(digits);
              if (digits.length >= 10) {
                phoneNorms.push(digits.slice(-10));
              }
            }
          }
          const emailNorms = candidateEmails.map(e => String(e).trim().toLowerCase());

          // 1. Check batch cache (siblings in same file)
          let existingParent = null;
          for (const p of phoneNorms) {
            if (batchParentsByPhone.has(p)) {
              existingParent = batchParentsByPhone.get(p);
              break;
            }
          }
          if (!existingParent) {
            for (const e of emailNorms) {
              if (batchParentsByEmail.has(e)) {
                existingParent = batchParentsByEmail.get(e);
                break;
              }
            }
          }

          // 2. Check MongoDB for existing parent
          if (!existingParent) {
            const orConditions = [];
            if (phoneNorms.length > 0) {
              orConditions.push({ phone: { $in: phoneNorms } });
              orConditions.push({ "contactDetails.phone": { $in: phoneNorms } });
              orConditions.push({ fatherPhone: { $in: phoneNorms } });
              orConditions.push({ motherPhone: { $in: phoneNorms } });
              orConditions.push({ "guardian.phone": { $in: phoneNorms } });
            }
            if (emailNorms.length > 0) {
              orConditions.push({ email: { $in: emailNorms } });
              orConditions.push({ "contactDetails.email": { $in: emailNorms } });
              orConditions.push({ fatherEmail: { $in: emailNorms } });
              orConditions.push({ motherEmail: { $in: emailNorms } });
              orConditions.push({ "guardian.email": { $in: emailNorms } });
            }
            if (orConditions.length > 0) {
              existingParent = await Parent.findOne({ schoolId, $or: orConditions });
            }
          }

          // 3. Determine role & name for parent account
          const primaryParentName = (
            genericParentName ||
            fatherName ||
            motherName ||
            guardianName ||
            "Parent"
          ).trim();

          let primaryRole = "Primary Guardian";
          if (genericParentRole) {
            const normR = genericParentRole.toLowerCase().trim();
            if (normR.includes("father")) primaryRole = "Father";
            else if (normR.includes("mother")) primaryRole = "Mother";
            else if (normR.includes("secondary")) primaryRole = "Secondary Guardian";
            else if (normR.includes("guardian")) primaryRole = "Guardian";
            else if (normR.includes("primary")) primaryRole = "Primary Guardian";
          } else if (fatherName) {
            primaryRole = "Father";
          } else if (motherName) {
            primaryRole = "Mother";
          } else if (guardianName) {
            primaryRole = "Guardian";
          }

          if (existingParent) {
            // Link student to existing parent without creating duplicate
            if (!existingParent.children) existingParent.children = [];
            const childIdStr = targetStudent._id.toString();
            const alreadyLinked = existingParent.children.some(c => (c._id || c).toString() === childIdStr);
            if (!alreadyLinked) {
              existingParent.children.push(targetStudent._id);
            }

            // Fill in missing parent details without overwriting existing data
            if (!existingParent.fatherName && fatherName) existingParent.fatherName = fatherName;
            if (!existingParent.fatherOccupation && fatherOccupation) existingParent.fatherOccupation = fatherOccupation;
            if (!existingParent.fatherPhone && fatherPhone) existingParent.fatherPhone = fatherPhone;
            if (!existingParent.fatherEmail && fatherEmail) existingParent.fatherEmail = fatherEmail;

            if (!existingParent.motherName && motherName) existingParent.motherName = motherName;
            if (!existingParent.motherOccupation && motherOccupation) existingParent.motherOccupation = motherOccupation;
            if (!existingParent.motherPhone && motherPhone) existingParent.motherPhone = motherPhone;
            if (!existingParent.motherEmail && motherEmail) existingParent.motherEmail = motherEmail;

            if (guardianName) {
              if (!existingParent.guardian) existingParent.guardian = {};
              if (!existingParent.guardian.name) existingParent.guardian.name = guardianName;
              if (!existingParent.guardian.relation && guardianRelation) existingParent.guardian.relation = guardianRelation;
              if (!existingParent.guardian.phone && guardianPhone) existingParent.guardian.phone = guardianPhone;
              if (!existingParent.guardian.email && guardianEmail) existingParent.guardian.email = guardianEmail;
              if (!existingParent.guardian.occupation && guardianOccupation) existingParent.guardian.occupation = guardianOccupation;
            }
            if (emergencyName) {
              if (!existingParent.emergencyContact) existingParent.emergencyContact = {};
              if (!existingParent.emergencyContact.name) existingParent.emergencyContact.name = emergencyName;
              if (!existingParent.emergencyContact.relation && emergencyRelation) existingParent.emergencyContact.relation = emergencyRelation;
              if (!existingParent.emergencyContact.phone && emergencyPhone) existingParent.emergencyContact.phone = emergencyPhone;
            }

            await existingParent.save();
            linkedParent = existingParent;

            // Cache in batch
            for (const p of phoneNorms) batchParentsByPhone.set(p, existingParent);
            for (const e of emailNorms) batchParentsByEmail.set(e, existingParent);
            if (existingParent.phone) batchParentsByPhone.set(existingParent.phone, existingParent);
            if (existingParent.email) batchParentsByEmail.set(existingParent.email.toLowerCase(), existingParent);

          } else {
            // Create new parent record
            const parentId = await generateNextParentId();
            const finalEmail = primaryEmail || `${parentId.toLowerCase()}@parent.vedaed`;
            const finalPhone = primaryPhone || (phoneVal ? String(phoneVal).trim() : "N/A");

            const newParent = await Parent.create({
              schoolId,
              parentId,
              name: primaryParentName,
              email: finalEmail,
              phone: finalPhone,
              role: primaryRole,
              occupation: (primaryRole === "Guardian" && guardianOccupation) ? guardianOccupation : (fatherOccupation || motherOccupation || genericParentOccupation || "Parent"),
              relation: (primaryRole === "Father" || primaryRole === "Mother") ? primaryRole : (guardianRelation || "Parent"),
              fatherName: fatherName || (primaryRole === "Father" ? primaryParentName : ""),
              fatherOccupation: fatherOccupation || "",
              fatherPhone: fatherPhone || (primaryRole === "Father" ? finalPhone : ""),
              fatherEmail: fatherEmail || (primaryRole === "Father" ? (primaryEmail || finalEmail) : ""),
              motherName: motherName || (primaryRole === "Mother" ? primaryParentName : ""),
              motherOccupation: motherOccupation || "",
              motherPhone: motherPhone || (primaryRole === "Mother" ? finalPhone : ""),
              motherEmail: motherEmail || (primaryRole === "Mother" ? (primaryEmail || finalEmail) : ""),
              guardian: {
                name: guardianName || (primaryRole === "Guardian" ? primaryParentName : ""),
                relation: guardianRelation || "",
                phone: guardianPhone || (primaryRole === "Guardian" ? finalPhone : ""),
                email: guardianEmail || (primaryRole === "Guardian" ? (primaryEmail || finalEmail) : ""),
                occupation: guardianOccupation || "",
              },
              emergencyContact: {
                name: emergencyName || primaryParentName,
                relation: emergencyRelation || primaryRole || "Parent",
                phone: emergencyPhone || finalPhone,
              },
              contactDetails: {
                phone: finalPhone,
                email: finalEmail,
              },
              address: addressVal || "",
              status: "Active",
              password: plainPassword,
              children: [targetStudent._id],
            });

            linkedParent = newParent;

            // Cache in batch
            for (const p of phoneNorms) batchParentsByPhone.set(p, newParent);
            for (const e of emailNorms) batchParentsByEmail.set(e, newParent);
            if (finalPhone) batchParentsByPhone.set(finalPhone, newParent);
            if (finalEmail) batchParentsByEmail.set(finalEmail.toLowerCase(), newParent);

            // Create Auth User for parent
            if (parentRole) {
              try {
                const hashedParentPassword = await hashPasswordCached(plainPassword);
                await User.create({
                  name: primaryParentName,
                  email: finalEmail,
                  password: hashedParentPassword,
                  roleId: parentRole._id,
                  refId: newParent._id,
                  schoolId,
                  status: "active",
                });
              } catch (pAuthErr) {
                console.warn(`Parent User auth creation note for "${primaryParentName}":`, pAuthErr.message);
              }
            }
          }

          // Bidirectional link: attach parent to student if not already attached
          if (!targetStudent.parent || targetStudent.parent.toString() !== linkedParent._id.toString()) {
            targetStudent.parent = linkedParent._id;
            await targetStudent.save();
          }
        }

        if (existingStudent && !isNewStudent) {
          results.imported.push({
            _id: targetStudent._id,
            name,
            stdId: targetStudent.personalInfo.stdId,
            rollNo: targetStudent.personalInfo.rollNo,
            class: classDoc.name,
            section: sectionDoc.name,
            parentId: linkedParent ? linkedParent.parentId : (targetStudent.parent ? String(targetStudent.parent) : null),
            parentName: linkedParent ? linkedParent.name : null,
            updated: true,
          });
        } else {
          results.imported.push({
            _id: targetStudent._id,
            name,
            stdId: targetStudent.personalInfo.stdId,
            rollNo: finalRollNo,
            class: classDoc.name,
            section: sectionDoc.name,
            parentId: linkedParent ? linkedParent.parentId : null,
            parentName: linkedParent ? linkedParent.name : null,
          });

          // ── Create Auth User record for Student ─────────────────────────────
          if (studentRole) {
            try {
              const hashedStudentPassword = await hashPasswordCached(plainPassword);
              await User.create({
                name,
                email: emailVal || targetStudent.personalInfo.username,
                password: hashedStudentPassword,
                roleId: studentRole._id,
                refId: targetStudent._id,
                schoolId,
                status: "active",
              });
            } catch (authErr) {
              console.warn(`Auth User creation failed for imported student "${name}":`, authErr.message);
            }
          }
        }

      } catch (rowErr) {
        const name = getVal(stu, ["name", "Name", "Student Name"]) || "Unknown";
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
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

    const ctx = await findStudentOrAdmissionById(studentId, schoolId);
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { studentId } = req.params;
    console.log("Getting documents for studentId:", studentId);
    const ctx = await findStudentOrAdmissionById(studentId, schoolId);
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
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
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;
  try {
    const { studentId, documentId } = req.params;
    const ctx = await findStudentOrAdmissionById(studentId, schoolId);

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