const mongoose = require("mongoose");
const Student = require("../../student/studentModels");
const AdmissionApplication = require("../admissionApplicationModel");
const Parent = require("../../parents/parentModel");
const { generateNextStudentId } = require("../../../utils/studentIdGenerator");
const { generateStudentUsernameBase } = require("../../../utils/studentUsernameGenerator");
const { generateNextParentId } = require("../../../utils/parentIdGenerator");
const {
  resolveClassAndSection,
  allocateNextRollNumber,
} = require("../../student/services/rollNumberService");
const User = require("../../../models/User");
const Role = require("../../../models/Role");

const normalizeDob = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split("T")[0];
  return String(val);
};

const normalizeContact = (ci = {}) => {
  if (!ci) return {};
  return {
    mobileNumber: ci.phone || ci.mobileNumber || ci.mobile || "",
    countryCode: ci.countryCode || "",
    alternatePhone: ci.alternatePhone || ci.alternate || "",
    email: ci.email || "",
  };
};

async function generateUniqueStudentUsername(name, dob, schoolId) {
  const baseUsername = generateStudentUsernameBase(name, dob) || "user";
  let username = baseUsername;
  let suffix = 1;
  while (await Student.exists({ "personalInfo.username": username, schoolId })) {
    username = `${baseUsername}${suffix}`;
    suffix += 1;
  }
  return username;
}

function buildStudentData({
  schoolId,
  application,
  classDoc,
  sectionDoc,
  assignedRollNo,
  stdId,
  username,
}) {
  const pi = application.personalInfo || {};
  const ci = application.contactInfo || {};
  const earlier = application.earlierAcademic || {};
  const emg = application.emergencyContact || {};

  const personalInfo = {
    name: pi.name || "Unnamed",
    stdId,
    username,
    DOB: normalizeDob(pi.dateOfBirth || pi.DOB),
    gender: pi.gender || "",
    bloodGroup: pi.bloodGroup || "",
    age: pi.age || "",
    class: classDoc._id,
    section: sectionDoc._id,
    rollNo: assignedRollNo,
    admissionDate: new Date(),
    status: "Active",
    contactDetails: normalizeContact({
      phone: ci.phone,
      email: ci.email,
      alternatePhone: ci.alternatePhone,
      countryCode: ci.countryCode,
    }),
    address: ci.address || "",
    password: pi.password || "default123",
    fees: (pi.fees || "").toLowerCase() === "paid" ? "Paid" : "Due",
  };

  const curriculum = {
    academicYear: earlier.academicYear || pi.academicYear || "",
    admissionType: earlier.admissionType || "",
  };

  const studentData = {
    schoolId,
    personalInfo,
    curriculum,
    emergencyContact: {
      name: emg.name || "",
      relation: emg.relation || "",
      phone: emg.phone || "",
    },
    health: {},
    documents: (application.documents || []).map((d) => ({
      name: d.name,
      path: d.path,
      size: d.size,
      uploadedAt: d.uploadedAt || new Date(),
    })),
    admissionApplicationId: application._id,
  };

  return studentData;
}

async function ensureParentFromApplication({ application, schoolId }) {
  const parents = application.parents || {};
  let existingParent = null;

  // Try to find parent by parentId if it exists
  if (parents.parentId) {
    existingParent = await Parent.findOne({ parentId: parents.parentId, schoolId });
    if (existingParent) return existingParent;
  }

  // Create parent
  const accountHolder = (parents.parentIdAccountHolder || "father").toLowerCase();
  const generatedParentId = parents.parentId || (await generateNextParentId());
  const father = parents.father || {};
  const mother = parents.mother || {};
  const guardian = parents.guardian || {};

  let parentName = father.name || mother.name || guardian.name || application.personalInfo?.name || "Parent";
  let parentEmail = father.email || mother.email || guardian.email || application.contactInfo?.email || "";
  let parentPhone = father.phone || mother.phone || guardian.phone || application.contactInfo?.phone || "";
  const parentPassword = application.personalInfo?.parentPassword || "default123";

  // The Parent schema requires email/phone. Fall back to deterministic
  // placeholders derived from parentId when the application omits them so
  // enrollment is not blocked by incomplete parent data.
  if (!parentEmail) parentEmail = `${generatedParentId.toLowerCase()}@parent.local`;
  if (!parentPhone) parentPhone = "0000000000";

  // Normalize account holder
  if (accountHolder === "mother" && mother.name) parentName = mother.name;
  if (accountHolder === "guardian" && guardian.name) parentName = guardian.name;

  const parentDoc = await Parent.create({
    schoolId,
    fatherName: father.name || "",
    motherName: mother.name || "",
    contactDetails: {
      phone: parentPhone,
      email: parentEmail,
    },
    name: parentName,
    parentId: generatedParentId,
    email: parentEmail,
    phone: parentPhone,
    role: accountHolder === "father" ? "Father" : accountHolder === "mother" ? "Mother" : (guardian.relation || "Guardian"),
    occupation: father.occupation || mother.occupation || guardian.relation || "Parent",
    relation: accountHolder,
    guardian: {
      name: guardian.name || "",
      relation: guardian.relation || "",
      phone: guardian.phone || "",
      email: guardian.email || "",
    },
    fatherOccupation: father.occupation || "",
    fatherPhone: father.phone || "",
    fatherEmail: father.email || "",
    motherOccupation: mother.occupation || "",
    motherPhone: mother.phone || "",
    motherEmail: mother.email || "",
    address: application.contactInfo?.address || "",
    status: "Active",
    children: [],
    password: parentPassword,
  });

  return parentDoc;
}

async function enrollApplication({ applicationId, schoolId, classId, sectionId, className, sectionName }) {
  const application = await AdmissionApplication.findOne({ _id: applicationId, schoolId });
  if (!application) {
    const err = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if already enrolled
  if (application.enrolledStudentId) {
    const existingStudent = await Student.findById(application.enrolledStudentId).lean();
    if (existingStudent) {
      return { alreadyEnrolled: true, student: existingStudent };
    }
  }

  // Also check by admissionApplicationId
  const existingByRef = await Student.findOne({ admissionApplicationId: application._id, schoolId });
  if (existingByRef) {
    // Link back
    if (!application.enrolledStudentId) {
      application.enrolledStudentId = existingByRef._id;
      application.enrolledAt = new Date();
      application.promotedAt = new Date();
      await application.save();
    }
    return { alreadyEnrolled: true, student: existingByRef.toObject ? existingByRef.toObject() : existingByRef };
  }

  // Policy checks
  const docVer = String(application.documentVerificationStatus || "").toLowerCase();
  const feeStatus = String(application.personalInfo?.fees || application.admissionFee?.status || "").toLowerCase();
  if (docVer !== "verified") {
    const err = new Error("Documents must be verified before enrollment");
    err.statusCode = 400;
    throw err;
  }
  if (feeStatus !== "paid") {
    const err = new Error("Fees must be paid before enrollment");
    err.statusCode = 400;
    throw err;
  }

  // Resolve class/section
  let classDoc, sectionDoc;
  try {
    const resolved = await resolveClassAndSection(schoolId, {
      classId,
      sectionId,
      className: className || application.personalInfo?.classApplied,
      sectionName: sectionName || application.personalInfo?.section,
    });
    classDoc = resolved.classDoc;
    sectionDoc = resolved.sectionDoc;
  } catch (e) {
    const err = new Error(e.message || "Class or section not found");
    err.statusCode = 400;
    throw err;
  }

  // Roll numbers are always auto-generated during SIS enrollment. The
  // applicant/admin can never supply one; we reuse the exact same allocation
  // logic used by the standard Add Student flow.
  let assignedRollNo;
  try {
    const allocated = await allocateNextRollNumber(schoolId, classDoc._id, sectionDoc._id);
    assignedRollNo = allocated.rollNo;
  } catch (e) {
    const err = new Error(e.message || "Failed to allocate roll number");
    err.statusCode = e.statusCode || 400;
    if (e.isCapacityFull) {
      err.isCapacityFull = true;
      err.capacity = e.capacity;
    }
    throw err;
  }

  // Generate IDs
  let stdIdClean = application.personalInfo?.stdId;
  if (!stdIdClean || String(stdIdClean).trim() === "") {
    stdIdClean = await generateNextStudentId();
  }
  let username = await generateUniqueStudentUsername(application.personalInfo?.name, application.personalInfo?.dateOfBirth || application.personalInfo?.DOB, schoolId);

  // Create student with retry
  let newStudent = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts && !newStudent) {
    try {
      attempts++;
      const studentData = buildStudentData({
        schoolId,
        application,
        classDoc,
        sectionDoc,
        assignedRollNo,
        stdId: stdIdClean,
        username,
      });
      newStudent = await Student.create(studentData);
    } catch (createErr) {
      if (createErr.code === 11000 && attempts < maxAttempts) {
        const keys = createErr.keyPattern ? Object.keys(createErr.keyPattern) : [];
        if (keys.some((k) => k.includes("rollNo"))) {
          try {
            const reAlloc = await allocateNextRollNumber(schoolId, classDoc._id, sectionDoc._id);
            assignedRollNo = reAlloc.rollNo;
          } catch (_) {
            // fall through
          }
        }
        if (keys.some((k) => k.includes("username"))) {
          username = await generateUniqueStudentUsername(application.personalInfo?.name, application.personalInfo?.dateOfBirth || application.personalInfo?.DOB, schoolId);
        }
        if (keys.some((k) => k.includes("stdId"))) {
          stdIdClean = await generateNextStudentId();
        }
        continue;
      }
      throw createErr;
    }
  }

  if (!newStudent) {
    const err = new Error("Failed to create student after retries");
    err.statusCode = 500;
    throw err;
  }

  // Link parent. Parent data on admission applications is often incomplete, so a
  // failure here must not abort enrollment or leave the application unmarked.
  try {
    const parentDoc = await ensureParentFromApplication({ application, schoolId });
    if (parentDoc) {
      newStudent.parent = parentDoc._id;
      await newStudent.save();
      await Parent.findByIdAndUpdate(parentDoc._id, { $addToSet: { children: newStudent._id } });
    }
  } catch (parentErr) {
    console.error("Parent linking failed during admission enrollment:", parentErr.message);
  }

  // Update application
  application.enrolledStudentId = newStudent._id;
  application.enrolledAt = new Date();
  application.promotedAt = new Date();
  if (application.applicationStatus !== "Approved") {
    application.applicationStatus = "Approved";
  }
  await application.save();

  // Update user ref if exists
  try {
    const user = await User.findOne({ refId: application._id, schoolId });
    if (user) {
      user.refId = newStudent._id;
      await user.save();
    }
  } catch (e) {
    // non-fatal
  }

  const studentObj = newStudent.toObject ? newStudent.toObject() : newStudent;
  return { alreadyEnrolled: false, student: studentObj };
}

module.exports = { enrollApplication };
