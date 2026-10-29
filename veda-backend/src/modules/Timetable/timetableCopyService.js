const Timetable = require("./timeTableSchema");
const TimetableHeader = require("./timetableHeaderSchema");
const TimetableRequirement = require("./timetableRequirementSchema");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const { recordTimetableAudit } = require("./timetableAuditSchema");

const isValidObjectId = (id) =>
  Boolean(id) && require("mongoose").isValidObjectId(String(id));

const teacherIdOf = (teacher) =>
  teacher?._id ? String(teacher._id) : teacher ? String(teacher) : null;

const subjectIdOf = (subject) =>
  subject?._id ? String(subject._id) : subject ? String(subject) : null;

const nameOfTeacher = (teacher) =>
  teacher?.personalInfo?.name || teacher?.name || "This teacher";

const nameOfSubject = (subject) =>
  subject?.subjectName || subject?.name || "This subject";

const resolveSourceHeader = async ({ schoolId, body }) => {
  if (body.sourceHeaderId) {
    if (!isValidObjectId(body.sourceHeaderId)) return null;
    return TimetableHeader.findOne({
      _id: body.sourceHeaderId,
      schoolId,
    });
  }

  const sourceClassId =
    body.sourceClassId || body.source?.classId || body.classId;
  const sourceSectionId =
    body.sourceSectionId || body.source?.sectionId || body.sectionId;

  if (!isValidObjectId(sourceClassId) || !isValidObjectId(sourceSectionId)) {
    return null;
  }

  const filter = { schoolId, class: sourceClassId, section: sourceSectionId };

  const academicYearId =
    body.sourceAcademicYearId || body.source?.academicYearId || body.academicYearId;

  if (academicYearId) {
    if (!isValidObjectId(academicYearId)) return null;
    filter.academicYear = academicYearId;
  }

  return TimetableHeader.findOne(filter);
};

// The target class/section only lists the teachers that may teach it. A
// requirement copied from another section is kept only when its teacher is in
// that list. When the target has no teacher assignments configured yet there
// is nothing to validate against, so the copy is kept and reported as needing
// review instead of silently dropping everything.
const loadTargetTeacherScope = async ({ header }) => {
  const assignments = await AssignTeacher.find({
    class: header.class,
    section: header.section,
  })
    .select("teachers teacher")
    .lean();

  const allowed = new Set();

  for (const assignment of assignments) {
    for (const teacher of assignment.teachers || []) {
      if (teacher) allowed.add(String(teacher));
    }
    if (assignment.teacher) allowed.add(String(assignment.teacher));
  }

  return { isConfigured: assignments.length > 0, allowed };
};

const copyFromHeader = async ({
  targetHeader,
  schoolId,
  body = {},
  userId = null,
}) => {
  if (!targetHeader?._id || !schoolId) {
    return {
      error: { status: 400, message: "A timetable header and school are required." },
    };
  }

  const sourceHeader = await resolveSourceHeader({ schoolId, body });

  if (!sourceHeader) {
    return {
      error: {
        status: 404,
        message: "Source timetable not found",
      },
    };
  }

  if (String(sourceHeader._id) === String(targetHeader._id)) {
    return {
      error: {
        status: 400,
        message: "A timetable cannot be copied onto itself.",
      },
    };
  }

  const sourceRequirements = await TimetableRequirement.find({
    schoolId,
    timetableHeader: sourceHeader._id,
  })
    .populate({ path: "subject", match: { schoolId } })
    .populate({ path: "teacher", match: { schoolId } })
    .sort({ createdAt: 1 });

  const { isConfigured, allowed } = await loadTargetTeacherScope({
    header: targetHeader,
  });

  const copiedRequirements = [];
  const skippedRequirements = [];
  const warnings = [];

  if (sourceRequirements.length > 0 && !isConfigured) {
    warnings.push({
      type: "TEACHER_ASSIGNMENTS_NOT_CONFIGURED",
      message:
        "No teachers are assigned to the target class/section, so copied teachers could not be revalidated. Review the copied requirements.",
    });
  }

  for (const requirement of sourceRequirements) {
    const subjectId = subjectIdOf(requirement.subject);
    const teacherId = teacherIdOf(requirement.teacher);

    if (!requirement.subject || !subjectId) {
      skippedRequirements.push({
        requirementId: requirement._id,
        subjectId: requirement.subject || null,
        teacherId: teacherId,
        reason: "INVALID_SUBJECT",
        message: "The source requirement references a subject that is not in this school.",
      });
      continue;
    }

    if (!requirement.teacher || !teacherId) {
      skippedRequirements.push({
        requirementId: requirement._id,
        subjectId,
        subjectName: nameOfSubject(requirement.subject),
        teacherId: requirement.teacher || null,
        reason: "MISSING_TEACHER",
        message: `${nameOfSubject(requirement.subject)} has no teacher in the source timetable.`,
      });
      continue;
    }

    if (isConfigured && !allowed.has(teacherId)) {
      skippedRequirements.push({
        requirementId: requirement._id,
        subjectId,
        subjectName: nameOfSubject(requirement.subject),
        teacherId,
        teacherName: nameOfTeacher(requirement.teacher),
        reason: "TEACHER_NOT_ASSIGNED_TO_TARGET_CLASS",
        message: `${nameOfTeacher(requirement.teacher)} is not assigned to the target class/section.`,
      });
      continue;
    }

    copiedRequirements.push({
      schoolId,
      timetableHeader: targetHeader._id,
      subject: requirement.subject._id,
      teacher: requirement.teacher._id,
      periodsPerWeek: requirement.periodsPerWeek,
      days: requirement.days || [],
      preferredPeriodId: requirement.preferredPeriodId || null,
    });
  }

  // Copy the setup only. Assignments are deliberately cleared because they
  // belong to the source class/section and may use teachers or rooms that are
  // not valid for the target.
  const removedAssignments = await Timetable.deleteMany({
    class: targetHeader.class,
    section: targetHeader.section,
    $or: [
      { timetableHeader: targetHeader._id },
      { timetableHeader: { $exists: false } },
      { timetableHeader: null },
    ],
  });

  await TimetableRequirement.deleteMany({
    schoolId,
    timetableHeader: targetHeader._id,
  });

  if (copiedRequirements.length > 0) {
    await TimetableRequirement.insertMany(copiedRequirements);
  }

  targetHeader.workingDays = [...(sourceHeader.workingDays || [])];
  targetHeader.startTime = sourceHeader.startTime;
  targetHeader.defaultDurationMinutes = sourceHeader.defaultDurationMinutes;
  targetHeader.defaultRoom = "";
  targetHeader.lunch = sourceHeader.lunch || null;
  targetHeader.periods = (sourceHeader.periods || []).map((period) => ({
    periodId: period.periodId,
    name: period.name,
    startTime: period.startTime,
    endTime: period.endTime,
    durationMinutes: period.durationMinutes,
    type: period.type,
  }));
  targetHeader.status = "DRAFT";
  targetHeader.needsRebuild = true;
  targetHeader.updatedBy = userId || null;
  targetHeader.version = (targetHeader.version || 1) + 1;
  await targetHeader.save();

  await recordTimetableAudit({
    header: targetHeader,
    schoolId,
    action: "COPIED",
    userId,
    details: {
      sourceHeaderId: sourceHeader._id,
      sourceClass: sourceHeader.class,
      sourceSection: sourceHeader.section,
      copiedRequirements: copiedRequirements.length,
      skippedRequirements: skippedRequirements.length,
      removedAssignments: removedAssignments.deletedCount || 0,
    },
  });

  return {
    data: {
      sourceHeaderId: sourceHeader._id,
      copiedRequirements: copiedRequirements.length,
      skippedRequirements,
      removedAssignments: removedAssignments.deletedCount || 0,
      warnings,
    },
  };
};

module.exports = { copyFromHeader };
