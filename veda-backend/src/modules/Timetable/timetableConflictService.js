const mongoose = require("mongoose");
const Timetable = require("./timeTableSchema");
const TimetableHeader = require("./timetableHeaderSchema");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Staff = require("../staff/staffModels");
const Subject = require("../subject/subjectSchema");

const toMin = (hhmm) => {
  if (!hhmm) return 0;
  const str = String(hhmm).trim();
  const parts = str.split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  if (aEnd <= aStart || bEnd <= bStart) return false;
  return aStart < bEnd && bStart < aEnd;
};

const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return mongoose.isValidObjectId(String(id));
  } catch (e) {
    return false;
  }
};

const findOwnedClass = async (classId, schoolId) => {
  if (!isValidObjectId(classId) || !isValidObjectId(schoolId)) return null;
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await Class.findOne({ _id: classId, schoolId }).select("_id schoolId name").lean();
  } catch (e) {
    return null;
  }
};

const findOwnedSection = async (sectionId, schoolId) => {
  if (!isValidObjectId(sectionId) || !isValidObjectId(schoolId)) return null;
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await Section.findOne({ _id: sectionId, schoolId }).select("_id schoolId name").lean();
  } catch (e) {
    return null;
  }
};

const findOwnedStaff = async (staffId, schoolId) => {
  if (!isValidObjectId(staffId) || !isValidObjectId(schoolId)) return null;
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await Staff.findOne({ _id: staffId, schoolId }).select("_id schoolId personalInfo").lean();
  } catch (e) {
    return null;
  }
};

const findOwnedSubject = async (subjectId, schoolId) => {
  if (!isValidObjectId(subjectId) || !isValidObjectId(schoolId)) return null;
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await Subject.findOne({ _id: subjectId, schoolId }).select("_id schoolId subjectName").lean();
  } catch (e) {
    return null;
  }
};

const findOwnedTimetableHeader = async (headerId, schoolId) => {
  if (!isValidObjectId(headerId) || !isValidObjectId(schoolId)) return null;
  try {
    if (mongoose.connection.readyState !== 1) return null;
    return await TimetableHeader.findOne({ _id: headerId, schoolId }).select("_id schoolId class section").lean();
  } catch (e) {
    return null;
  }
};

const validateOwnership = async (schoolId, entities = {}) => {
  const errors = [];
  if (!isValidObjectId(schoolId)) {
    errors.push({ field: "schoolId", message: "Invalid school context" });
    return { isValid: false, errors };
  }


  if (mongoose.connection.readyState !== 1) {
    return { isValid: true, errors: [] };
  }

  try {
    if (entities.classId && isValidObjectId(entities.classId)) {
      const cls = await findOwnedClass(entities.classId, schoolId);
      if (!cls) {
        errors.push({ field: "classId", message: "Class not found or not owned by this school" });
      }
    }
    if (entities.sectionId && isValidObjectId(entities.sectionId)) {
      const sec = await findOwnedSection(entities.sectionId, schoolId);
      if (!sec) {
        errors.push({ field: "sectionId", message: "Section not found or not owned by this school" });
      }
    }
    if (entities.teacherId && isValidObjectId(entities.teacherId)) {
      const teacher = await findOwnedStaff(entities.teacherId, schoolId);
      if (!teacher) {
        errors.push({ field: "teacherId", message: "Teacher not found or not owned by this school" });
      }
    }
    if (entities.subjectId && isValidObjectId(entities.subjectId)) {
      const subject = await findOwnedSubject(entities.subjectId, schoolId);
      if (!subject) {
        errors.push({ field: "subjectId", message: "Subject not found or not owned by this school" });
      }
    }
    if (entities.timetableHeaderId && isValidObjectId(entities.timetableHeaderId)) {
      const header = await findOwnedTimetableHeader(entities.timetableHeaderId, schoolId);
      if (!header) {
        errors.push({ field: "timetableHeaderId", message: "Timetable header not found or not owned by this school" });
      }
    }
  } catch (e) {
    // Ignore DB errors
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateTimetableConflicts = async (options = {}) => {
  const {
    schoolId,
    timetableHeaderId,
    classId,
    sectionId,
    teacherId,
    roomNo,
    day,
    timeFrom,
    timeTo,
    academicYearId,
    excludeAssignmentId,
    excludeAssignmentIds = [],
    excludeHeaderId,
    proposedAssignments = [],
  } = options;

  const conflicts = [];

  if (day) {
    const startMin = toMin(timeFrom);
    const endMin = toMin(timeTo);
    if (endMin <= startMin) {
      conflicts.push({
        type: "INVALID_PERIOD",
        message: "timeFrom must be earlier than timeTo",
        details: { timeFrom, timeTo },
      });
      return { hasConflicts: true, conflicts };
    }
  } else if (
    !Array.isArray(proposedAssignments) ||
    proposedAssignments.length === 0
  ) {
    conflicts.push({
      type: "INVALID_DAY",
      message: "day is required",
    });
    return { hasConflicts: true, conflicts };
  }

  const startMin = day ? toMin(timeFrom) : 0;
  const endMin = day ? toMin(timeTo) : 0;

  const belongsToExcludedHeader = (assignment) =>
    Boolean(
      excludeHeaderId &&
        assignment?.timetableHeader &&
        String(assignment.timetableHeader) === String(excludeHeaderId)
    );

  const excludedAssignmentIdSet = new Set(
    (excludeAssignmentIds || []).map((id) => String(id))
  );

  const isExcludedAssignment = (assignment) =>
    Boolean(
      assignment &&
        excludedAssignmentIdSet.size > 0 &&
        excludedAssignmentIdSet.has(String(assignment._id))
    );

  const belongsToOtherAcademicYear = (assignment) =>
    Boolean(
      academicYearId &&
        assignment?.academicYear &&
        String(assignment.academicYear) !== String(academicYearId)
    );

  // Validate proposed assignments set
  if (Array.isArray(proposedAssignments) && proposedAssignments.length > 0) {
    for (let i = 0; i < proposedAssignments.length; i++) {
      const prop = proposedAssignments[i];
      const pStart = toMin(prop.timeFrom);
      const pEnd = toMin(prop.timeTo);
      if (pEnd <= pStart) {
        conflicts.push({
          type: "INVALID_PERIOD",
          message: `Invalid time range in proposed assignment ${i}`,
          details: { index: i, timeFrom: prop.timeFrom, timeTo: prop.timeTo },
        });
        continue;
      }
    }

    for (let i = 0; i < proposedAssignments.length; i++) {
      const propA = proposedAssignments[i];
      const propAStart = toMin(propA.timeFrom);
      const propAEnd = toMin(propA.timeTo);
      const dayA = propA.day;
      const classA = propA.classId || propA.class;
      const sectionA = propA.sectionId || propA.section;
      const teacherA = propA.teacherId || propA.teacher;
      const roomA = propA.roomNo;

      for (let j = i + 1; j < proposedAssignments.length; j++) {
        const propB = proposedAssignments[j];
        if (dayA !== propB.day) continue;

        const propBStart = toMin(propB.timeFrom);
        const propBEnd = toMin(propB.timeTo);
        const classB = propB.classId || propB.class;
        const sectionB = propB.sectionId || propB.section;
        const teacherB = propB.teacherId || propB.teacher;
        const roomB = propB.roomNo;

        if (classA && sectionA && classB && sectionB &&
            String(classA) === String(classB) && String(sectionA) === String(sectionB)) {
          if (overlaps(propAStart, propAEnd, propBStart, propBEnd)) {
            conflicts.push({
              type: "CLASS_CONFLICT",
              message: "Proposed assignments conflict within the same class/section",
              details: { day: dayA },
              proposedIndices: [i, j],
            });
          }
        }

        if (teacherA && teacherB && String(teacherA) === String(teacherB)) {
          if (overlaps(propAStart, propAEnd, propBStart, propBEnd)) {
            conflicts.push({
              type: "TEACHER_CONFLICT",
              message: "Proposed assignments conflict for the same teacher",
              details: { day: dayA, teacherId: teacherA },
              proposedIndices: [i, j],
            });
          }
        }

        if (roomA && roomB && String(roomA).trim() && String(roomB).trim() &&
            String(roomA).trim() === String(roomB).trim()) {
          if (overlaps(propAStart, propAEnd, propBStart, propBEnd)) {
            conflicts.push({
              type: "ROOM_CONFLICT",
              message: "Proposed assignments conflict for the same room",
              details: { day: dayA, roomNo: roomA },
              proposedIndices: [i, j],
            });
          }
        }
      }
    }
  }

  // Skip DB checks if no connection
  if (mongoose.connection.readyState !== 1) {
    return { hasConflicts: conflicts.length > 0, conflicts };
  }

  // When no single slot was supplied (bulk validation), only the in-memory
  // proposed-assignment checks above are relevant.
  if (!day) {
    return { hasConflicts: conflicts.length > 0, conflicts };
  }

  try {
    const ownershipCheck = await validateOwnership(schoolId, {
      classId,
      sectionId,
      teacherId,
      timetableHeaderId,
    });
    if (!ownershipCheck.isValid) {
      const typeByField = {
        teacherId: "INVALID_TEACHER",
        subjectId: "INVALID_SUBJECT",
      };

      return {
        hasConflicts: true,
        conflicts: ownershipCheck.errors.map((e) => ({
          type: typeByField[e.field] || "INVALID_INPUT",
          message: e.message,
          field: e.field,
        })),
      };
    }

    if (isValidObjectId(classId) && isValidObjectId(sectionId)) {
      const classQuery = { day, class: classId, section: sectionId };
      let classAssignments = await Timetable.find(classQuery)
        .populate({ path: "class", select: "name schoolId" })
        .populate({ path: "section", select: "name schoolId" })
        .lean();

      if (excludeAssignmentId && isValidObjectId(excludeAssignmentId)) {
        classAssignments = classAssignments.filter(
          (a) => String(a._id) !== String(excludeAssignmentId)
        );
      }

      classAssignments = classAssignments.filter((a) => {
        if (isExcludedAssignment(a)) return false;
        if (belongsToExcludedHeader(a)) return false;
        if (belongsToOtherAcademicYear(a)) return false;
        const clsSchool = a.class?.schoolId;
        const secSchool = a.section?.schoolId;
        if (clsSchool && secSchool) {
          return String(clsSchool) === String(schoolId) && String(secSchool) === String(schoolId);
        }
        return true;
      });

      const classConflicts = classAssignments.filter((assignment) => {
        const existingStart = toMin(assignment.timeFrom);
        const existingEnd = toMin(assignment.timeTo);
        return overlaps(startMin, endMin, existingStart, existingEnd);
      });

      if (classConflicts.length > 0) {
        conflicts.push({
          type: "CLASS_CONFLICT",
          message: "Time overlaps with another period for this class/section",
          details: { day, timeFrom, timeTo },
          conflictingAssignments: classConflicts.map((c) => ({
            _id: c._id,
            day: c.day,
            timeFrom: c.timeFrom,
            timeTo: c.timeTo,
            subject: c.subject,
            teacher: c.teacher,
            timetableHeader: c.timetableHeader,
          })),
        });
      }
    }

    if (isValidObjectId(teacherId)) {
      const teacherQuery = { day, teacher: teacherId };
      let teacherAssignments = await Timetable.find(teacherQuery)
        .populate({ path: "class", select: "name schoolId" })
        .populate({ path: "section", select: "name schoolId" })
        .lean();

      if (excludeAssignmentId && isValidObjectId(excludeAssignmentId)) {
        teacherAssignments = teacherAssignments.filter(
          (a) => String(a._id) !== String(excludeAssignmentId)
        );
      }

      teacherAssignments = teacherAssignments.filter((a) => {
        if (isExcludedAssignment(a)) return false;
        if (belongsToExcludedHeader(a)) return false;
        if (belongsToOtherAcademicYear(a)) return false;
        const clsSchool = a.class?.schoolId;
        const secSchool = a.section?.schoolId;
        if (clsSchool && secSchool) {
          return String(clsSchool) === String(schoolId) && String(secSchool) === String(schoolId);
        }
        return true;
      });

      const teacherConflicts = teacherAssignments.filter((assignment) => {
        const existingStart = toMin(assignment.timeFrom);
        const existingEnd = toMin(assignment.timeTo);
        return overlaps(startMin, endMin, existingStart, existingEnd);
      });

      if (teacherConflicts.length > 0) {
        conflicts.push({
          type: "TEACHER_CONFLICT",
          message: "Teacher has another class at this time",
          details: { day, timeFrom, timeTo, teacherId },
          conflictingAssignments: teacherConflicts.map((c) => ({
            _id: c._id,
            day: c.day,
            timeFrom: c.timeFrom,
            timeTo: c.timeTo,
            class: c.class,
            section: c.section,
            timetableHeader: c.timetableHeader,
          })),
        });
      }
    }

    if (roomNo && String(roomNo).trim() !== "") {
      const roomQuery = { day, roomNo: String(roomNo).trim() };
      let roomAssignments = await Timetable.find(roomQuery)
        .populate({ path: "class", select: "name schoolId" })
        .populate({ path: "section", select: "name schoolId" })
        .lean();

      if (excludeAssignmentId && isValidObjectId(excludeAssignmentId)) {
        roomAssignments = roomAssignments.filter(
          (a) => String(a._id) !== String(excludeAssignmentId)
        );
      }

      roomAssignments = roomAssignments.filter((a) => {
        if (isExcludedAssignment(a)) return false;
        if (belongsToExcludedHeader(a)) return false;
        if (belongsToOtherAcademicYear(a)) return false;
        const clsSchool = a.class?.schoolId;
        const secSchool = a.section?.schoolId;
        if (clsSchool && secSchool) {
          return String(clsSchool) === String(schoolId) && String(secSchool) === String(schoolId);
        }
        return true;
      });

      const roomConflicts = roomAssignments.filter((assignment) => {
        const existingStart = toMin(assignment.timeFrom);
        const existingEnd = toMin(assignment.timeTo);
        return overlaps(startMin, endMin, existingStart, existingEnd);
      });

      if (roomConflicts.length > 0) {
        conflicts.push({
          type: "ROOM_CONFLICT",
          message: "Room is already booked at this time",
          details: { day, timeFrom, timeTo, roomNo },
          conflictingAssignments: roomConflicts.map((c) => ({
            _id: c._id,
            day: c.day,
            timeFrom: c.timeFrom,
            timeTo: c.timeTo,
            class: c.class,
            section: c.section,
          })),
        });
      }
    }
  } catch (e) {
    // Ignore DB errors
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

module.exports = {
  validateTimetableConflicts,
  validateOwnership,
  toMin,
  overlaps,
  isValidObjectId,
  findOwnedClass,
  findOwnedSection,
  findOwnedStaff,
  findOwnedSubject,
  findOwnedTimetableHeader,
};
