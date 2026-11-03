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

const normalizeDayCode = (d) => {
  if (!d) return null;
  const u = String(d).toUpperCase();
  if (u.startsWith("MON")) return "MON";
  if (u.startsWith("TUE")) return "TUE";
  if (u.startsWith("WED")) return "WED";
  if (u.startsWith("THU")) return "THU";
  if (u.startsWith("FRI")) return "FRI";
  if (u.startsWith("SAT")) return "SAT";
  if (u.startsWith("SUN")) return "SUN";
  return null;
};

const resolveSourceHeader = async ({ schoolId, body }) => {
  if (body.sourceHeaderId) {
    if (!isValidObjectId(body.sourceHeaderId)) return null;
    let h = await TimetableHeader.findOne({
      _id: body.sourceHeaderId,
      schoolId,
    });
    if (!h) {
      h = await TimetableHeader.findOne({ _id: body.sourceHeaderId });
    }
    return h;
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

  if (academicYearId && isValidObjectId(academicYearId)) {
    filter.academicYear = academicYearId;
  }

  let found = await TimetableHeader.findOne(filter);
  if (!found && filter.academicYear) {
    delete filter.academicYear;
    found = await TimetableHeader.findOne(filter);
  }
  return found;
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

  let sourceRequirements = await TimetableRequirement.find({
    schoolId,
    timetableHeader: sourceHeader._id,
  })
    .populate({ path: "subject", match: { schoolId } })
    .populate({ path: "teacher", match: { schoolId } })
    .sort({ createdAt: 1 });

  // If sourceHeader has no explicit TimetableRequirement docs, check entries in Timetable collection
  if (sourceRequirements.length === 0) {
    const sourceEntries = await Timetable.find({
      $or: [
        { timetableHeader: sourceHeader._id },
        { class: sourceHeader.class, section: sourceHeader.section },
      ],
    })
      .populate({ path: "subject", match: { schoolId } })
      .populate({ path: "teacher", match: { schoolId } });

    if (sourceEntries.length > 0) {
      const bySubject = new Map();
      for (const entry of sourceEntries) {
        if (!entry.subject?._id) continue;
        const sId = String(entry.subject._id);
        const dayCode = normalizeDayCode(entry.day);
        if (!bySubject.has(sId)) {
          bySubject.set(sId, {
            subject: entry.subject,
            teacher: entry.teacher,
            days: new Set(),
            count: 0,
          });
        }
        const item = bySubject.get(sId);
        item.count += 1;
        if (dayCode) item.days.add(dayCode);
      }

      sourceRequirements = Array.from(bySubject.values()).map((item) => ({
        subject: item.subject,
        teacher: item.teacher,
        periodsPerWeek: item.count || 1,
        days: Array.from(item.days),
        preferredPeriodId: null,
      }));
    }
  }

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

    let assignedTeacherId = requirement.teacher?._id || requirement.teacher;
    if (!assignedTeacherId) {
      if (allowed.size > 0) {
        assignedTeacherId = [...allowed][0];
      } else {
        skippedRequirements.push({
          requirementId: requirement._id,
          subjectId,
          subjectName: nameOfSubject(requirement.subject),
          teacherId: null,
          reason: "MISSING_TEACHER",
          message: `${nameOfSubject(requirement.subject)} has no teacher in the source timetable.`,
        });
        continue;
      }
    }

    if (isConfigured && !allowed.has(String(assignedTeacherId))) {
      // Reassign to available teacher in target scope if possible, or keep and warn
      if (allowed.size > 0) {
        assignedTeacherId = [...allowed][0];
        warnings.push({
          type: "TEACHER_REASSIGNED",
          message: `${nameOfTeacher(requirement.teacher)} was not assigned to target section. Reassigned for review in Step 2.`,
        });
      } else {
        warnings.push({
          type: "TEACHER_NOT_ASSIGNED_TO_TARGET_CLASS",
          message: `${nameOfTeacher(requirement.teacher)} is not assigned to target class/section. Review in Step 2.`,
        });
      }
    }

    const normDays = (requirement.days || [])
      .map(normalizeDayCode)
      .filter(Boolean);

    copiedRequirements.push({
      schoolId,
      timetableHeader: targetHeader._id,
      subject: requirement.subject._id || requirement.subject,
      teacher: assignedTeacherId,
      periodsPerWeek: requirement.periodsPerWeek || 1,
      days: normDays.length > 0 ? normDays : ["MON", "TUE", "WED", "THU", "FRI"],
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

  const targetDays = (sourceHeader.workingDays || [])
    .map(normalizeDayCode)
    .filter(Boolean);

  targetHeader.workingDays =
    targetDays.length > 0 ? targetDays : ["MON", "TUE", "WED", "THU", "FRI"];
  targetHeader.startTime = sourceHeader.startTime || "08:30";
  targetHeader.defaultDurationMinutes = sourceHeader.defaultDurationMinutes || 40;
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
