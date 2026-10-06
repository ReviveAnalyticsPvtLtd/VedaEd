const mongoose = require("mongoose");
const Student = require("../studentModels");
const Class = require("../../class/classSchema");
const Section = require("../../section/sectionSchema");

/**
 * Normalizes school ID to a string or null if invalid.
 */
const normalizeSchoolId = (schoolId) => {
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) return null;
  return String(schoolId);
};

/**
 * Resolves numerical capacity for a Class + Section.
 * Priority: Section capacity (if > 0) -> Class capacity (if > 0) -> default 40.
 */
function resolveClassSectionCapacity(classDoc, sectionDoc) {
  const secCap = Number(sectionDoc?.capacity);
  if (Number.isFinite(secCap) && secCap > 0) {
    return Math.floor(secCap);
  }
  const clsCap = Number(classDoc?.capacity);
  if (Number.isFinite(clsCap) && clsCap > 0) {
    return Math.floor(clsCap);
  }
  return 40;
}

/**
 * Resolves Class and Section documents for a given school by ID or name.
 */
async function resolveClassAndSection(schoolId, { classId, sectionId, className, sectionName } = {}) {
  const scopedSchoolId = normalizeSchoolId(schoolId);
  if (!scopedSchoolId) {
    throw new Error("Invalid or missing school ID");
  }

  let classDoc = null;
  let sectionDoc = null;

  if (classId && mongoose.isValidObjectId(String(classId))) {
    classDoc = await Class.findOne({ _id: classId, schoolId: scopedSchoolId });
  } else if (className) {
    classDoc = await Class.findOne({ name: String(className).trim(), schoolId: scopedSchoolId });
  }

  if (!classDoc) {
    throw new Error("Class not found");
  }

  if (sectionId && mongoose.isValidObjectId(String(sectionId))) {
    sectionDoc = await Section.findOne({ _id: sectionId, schoolId: scopedSchoolId });
  } else if (sectionName) {
    sectionDoc = await Section.findOne({
      _id: { $in: classDoc.sections || [] },
      name: String(sectionName).trim(),
      schoolId: scopedSchoolId,
    });
    if (!sectionDoc) {
      sectionDoc = await Section.findOne({ name: String(sectionName).trim(), schoolId: scopedSchoolId });
    }
  }

  if (!sectionDoc) {
    throw new Error("Section not found");
  }

  // Verify section belongs to class
  const classSectionIds = (classDoc.sections || []).map((s) => s.toString());
  if (!classSectionIds.includes(sectionDoc._id.toString())) {
    throw new Error("Section does not belong to this class");
  }

  return { classDoc, sectionDoc };
}

/**
 * Gets all assigned roll numbers for a Class + Section within a school.
 * Returns a Set of integer roll numbers.
 */
async function getAssignedRollNumbers(schoolId, classId, sectionId, excludeStudentId = null) {
  const scopedSchoolId = normalizeSchoolId(schoolId);
  const query = {
    schoolId: scopedSchoolId,
    "personalInfo.class": classId,
    "personalInfo.section": sectionId,
  };

  if (excludeStudentId && mongoose.isValidObjectId(String(excludeStudentId))) {
    query._id = { $ne: excludeStudentId };
  }

  const students = await Student.find(query).select("personalInfo.rollNo _id").lean();
  const usedNumbers = new Set();

  for (const s of students) {
    const raw = s.personalInfo?.rollNo;
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = parseInt(String(raw).trim(), 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        usedNumbers.add(parsed);
      }
    }
  }

  return { usedNumbers, totalEnrolled: students.length };
}

/**
 * Finds the smallest available positive integer roll number starting from 1 up to capacity.
 * If all roll numbers 1..capacity are occupied, returns null (capacity full).
 */
function findSmallestAvailableRollNumber(usedNumbers, capacity) {
  for (let i = 1; i <= capacity; i++) {
    if (!usedNumbers.has(i)) {
      return i;
    }
  }
  return null;
}

/**
 * Allocates the next available roll number for a Class + Section.
 */
async function allocateNextRollNumber(schoolId, classId, sectionId, excludeStudentId = null, existingUsedNumbers = null) {
  const scopedSchoolId = normalizeSchoolId(schoolId);
  const classDoc = await Class.findOne({ _id: classId, schoolId: scopedSchoolId });
  const sectionDoc = await Section.findOne({ _id: sectionId, schoolId: scopedSchoolId });

  if (!classDoc || !sectionDoc) {
    throw new Error("Class or section not found");
  }

  const capacity = resolveClassSectionCapacity(classDoc, sectionDoc);
  let usedNumbers = existingUsedNumbers;
  let totalEnrolled = 0;

  if (!usedNumbers) {
    const res = await getAssignedRollNumbers(
      scopedSchoolId,
      classId,
      sectionId,
      excludeStudentId
    );
    usedNumbers = res.usedNumbers;
    totalEnrolled = res.totalEnrolled;
  } else {
    totalEnrolled = usedNumbers.size;
  }

  const nextNumber = findSmallestAvailableRollNumber(usedNumbers, capacity);

  if (nextNumber === null) {
    const error = new Error(
      `This class/section has reached its maximum capacity of ${capacity} students. No Roll Number is available.`
    );
    error.statusCode = 400;
    error.isCapacityFull = true;
    error.capacity = capacity;
    throw error;
  }

  return {
    rollNo: String(nextNumber),
    capacity,
    totalEnrolled,
    usedRollNumbers: Array.from(usedNumbers).sort((a, b) => a - b),
    className: classDoc.name,
    sectionName: sectionDoc.name,
  };
}

/**
 * Validates a manual roll number for a Class + Section.
 */
async function validateManualRollNumber(
  schoolId,
  classId,
  sectionId,
  requestedRollNo,
  excludeStudentId = null,
  batchUsedNumbers = null
) {
  const scopedSchoolId = normalizeSchoolId(schoolId);
  const classDoc = await Class.findOne({ _id: classId, schoolId: scopedSchoolId });
  const sectionDoc = await Section.findOne({ _id: sectionId, schoolId: scopedSchoolId });

  if (!classDoc || !sectionDoc) {
    throw new Error("Class or section not found");
  }

  const capacity = resolveClassSectionCapacity(classDoc, sectionDoc);
  const rawStr = String(requestedRollNo || "").trim();
  const parsedInt = parseInt(rawStr, 10);

  if (!/^\d+$/.test(rawStr) || !Number.isInteger(parsedInt) || parsedInt < 1) {
    const error = new Error("Roll Number must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  if (parsedInt > capacity) {
    const error = new Error(
      `Roll Number cannot exceed the maximum capacity of ${capacity} for this class/section.`
    );
    error.statusCode = 400;
    error.capacity = capacity;
    throw error;
  }

  const { usedNumbers } = await getAssignedRollNumbers(
    scopedSchoolId,
    classId,
    sectionId,
    excludeStudentId
  );

  if (batchUsedNumbers) {
    for (const n of batchUsedNumbers) {
      usedNumbers.add(n);
    }
  }

  if (usedNumbers.has(parsedInt)) {
    const error = new Error(
      `Roll Number ${parsedInt} is already assigned in ${classDoc.name} - Section ${sectionDoc.name}.`
    );
    error.statusCode = 409;
    error.isDuplicate = true;
    throw error;
  }

  return {
    valid: true,
    rollNo: String(parsedInt),
    capacity,
    className: classDoc.name,
    sectionName: sectionDoc.name,
  };
}

/**
 * Cleans up and normalizes existing student roll numbers in the database.
 * Replaces non-numeric strings with the first available roll number in that class/section.
 * Normalizes numbers with leading zeros (e.g., "01" -> "1").
 */
async function sanitizeExistingRollNumbersInDb(schoolId = null) {
  const query = schoolId ? { schoolId: normalizeSchoolId(schoolId) } : {};
  const students = await Student.find(query).populate("personalInfo.class personalInfo.section");
  const updated = [];

  // Group students by schoolId + classId + sectionId
  const groups = new Map();
  for (const stu of students) {
    const sId = String(stu.schoolId || "");
    const cId = String(stu.personalInfo?.class?._id || stu.personalInfo?.class || "");
    const secId = String(stu.personalInfo?.section?._id || stu.personalInfo?.section || "");
    if (!sId || !cId || !secId) continue;

    const key = `${sId}:${cId}:${secId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(stu);
  }

  for (const [key, groupStudents] of groups.entries()) {
    const [sId, cId, secId] = key.split(":");
    const assignedInGroup = new Set();
    const classDoc = groupStudents[0].personalInfo?.class;
    const sectionDoc = groupStudents[0].personalInfo?.section;
    const capacity = resolveClassSectionCapacity(classDoc, sectionDoc);

    for (const stu of groupStudents) {
      const raw = String(stu.personalInfo?.rollNo || "").trim();
      const parsed = parseInt(raw, 10);
      const isClean = /^\d+$/.test(raw) && Number.isInteger(parsed) && parsed >= 1 && parsed <= capacity;

      if (isClean && !assignedInGroup.has(parsed)) {
        assignedInGroup.add(parsed);
        const normalizedStr = String(parsed);
        if (stu.personalInfo.rollNo !== normalizedStr) {
          stu.personalInfo.rollNo = normalizedStr;
          await stu.save();
          updated.push({ id: stu._id, name: stu.personalInfo?.name, oldRoll: raw, newRoll: normalizedStr });
        }
      } else {
        // Needs reallocation
        const nextRoll = findSmallestAvailableRollNumber(assignedInGroup, capacity);
        if (nextRoll !== null) {
          assignedInGroup.add(nextRoll);
          const newRollStr = String(nextRoll);
          stu.personalInfo.rollNo = newRollStr;
          await stu.save();
          updated.push({ id: stu._id, name: stu.personalInfo?.name, oldRoll: raw, newRoll: newRollStr });
        }
      }
    }
  }

  return { success: true, updatedCount: updated.length, updated };
}

module.exports = {
  resolveClassSectionCapacity,
  resolveClassAndSection,
  getAssignedRollNumbers,
  findSmallestAvailableRollNumber,
  allocateNextRollNumber,
  validateManualRollNumber,
  sanitizeExistingRollNumbersInDb,
};
