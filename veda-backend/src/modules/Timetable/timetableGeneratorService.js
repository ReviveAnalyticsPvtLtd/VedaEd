const TimetableHeader = require("./timetableHeaderSchema");
const TimetableRequirement = require("./timetableRequirementSchema");
const Timetable = require("./timeTableSchema");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");

const DAY_NAMES = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

/**
 * Converts a valid HH:MM string into minutes after midnight.
 * Throws for malformed or invalid time strings.
 */
const toMin = (value) => {
  if (typeof value !== "string") {
    throw new Error(`Invalid time value: ${value}`);
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid time format: ${value}. Expected HH:MM.`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
};

/**
 * Returns true when two time intervals overlap.
 * Periods that touch at the boundary do not overlap.
 */
const overlaps = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

const toDayName = (code) => DAY_NAMES[code] || code;

const getTimeRange = (start, end) => {
  const startMinutes = toMin(start);
  const endMinutes = toMin(end);

  if (startMinutes >= endMinutes) {
    throw new Error(
      `Invalid period range: ${start} - ${end}. End time must be after start time.`
    );
  }

  return { startMinutes, endMinutes };
};

/**
 * Finds teachers assigned to the requested class/section.
 *
 * AssignTeacher links teachers to a class and section (not to a subject), so
 * the subject argument is accepted for call-site compatibility but the whole
 * teacher list of the class/section is the eligibility scope.
 *
 *
 */
const getEligibleTeachers = async ({
  schoolId,
  classId,
  sectionId,
}) => {
  const assignments = await AssignTeacher.find({
    class: classId,
    section: sectionId,
  })
    .select("teachers teacher")
    .lean();

  const teachers = new Set();

  for (const assignment of assignments) {
    for (const teacher of assignment.teachers || []) {
      if (teacher) teachers.add(String(teacher));
    }
    if (assignment.teacher) teachers.add(String(assignment.teacher));
  }

  return [...teachers];
};

/**
 * Builds a timetable proposal in memory.
 *
 * IMPORTANT:
 * This function does not create, update or delete Timetable records.
 * The controller is responsible for validating and saving the proposal.
 */
const generateTimetable = async ({ header, schoolId }) => {
  if (!header?._id || !schoolId) {
    throw new Error("A timetable header and school ID are required.");
  }

  if (!Array.isArray(header.periods) || header.periods.length === 0) {
    throw new Error("No periods are configured for this timetable.");
  }

  const requirements = await TimetableRequirement.find({
    schoolId,
    timetableHeader: header._id,
  })
    .populate({
      path: "subject",
      match: { schoolId },
    })
    .populate({
      path: "teacher",
      match: { schoolId },
    });

  if (requirements.length === 0) {
    throw new Error("No subject requirements found.");
  }

  const workingDays =
    Array.isArray(header.workingDays) && header.workingDays.length > 0
      ? header.workingDays
      : ["MON", "TUE", "WED", "THU", "FRI"];

  const periods = header.periods.filter(
    (period) => period.type !== "LUNCH"
  );

  if (periods.length === 0) {
    throw new Error("No teaching periods are configured.");
  }

  // Validate period times and build available slots.
  const slots = [];

  for (const dayCode of workingDays) {
    if (!DAY_NAMES[dayCode]) {
      throw new Error(`Invalid working day: ${dayCode}`);
    }

    for (const period of periods) {
      if (!period.periodId) {
        throw new Error("Every teaching period must have a periodId.");
      }

      if (!period.startTime || !period.endTime) {
        throw new Error(
          `Period ${period.periodId} is missing its start or end time.`
        );
      }

      const range = getTimeRange(period.startTime, period.endTime);

      slots.push({
        dayCode,
        day: toDayName(dayCode),
        periodId: period.periodId,
        timeFrom: period.startTime,
        timeTo: period.endTime,
        startMinutes: range.startMinutes,
        endMinutes: range.endMinutes,
        roomNo: header.defaultRoom || "",
      });
    }
  }

  // Prevent overlapping configured periods on the same day.
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const first = slots[i];
      const second = slots[j];

      if (
        first.dayCode === second.dayCode &&
        overlaps(
          first.startMinutes,
          first.endMinutes,
          second.startMinutes,
          second.endMinutes
        )
      ) {
        throw new Error(
          `Configured periods overlap on ${first.day}: ` +
            `${first.timeFrom}-${first.timeTo} and ` +
            `${second.timeFrom}-${second.timeTo}.`
        );
      }
    }
  }

  const workingDaySet = new Set(workingDays);
  const periodById = new Map(
    periods.map((period) => [period.periodId, period])
  );

  const normalizeDayName = (value) => {
    if (!value) return null;
    const str = String(value).trim();
    if (DAY_NAMES[str.toUpperCase()]) return DAY_NAMES[str.toUpperCase()];
    return (
      Object.values(DAY_NAMES).find(
        (name) => name.toLowerCase() === str.toLowerCase()
      ) || null
    );
  };

  const dayCodeOf = (value) => {
    const name = normalizeDayName(value);
    if (!name) return null;
    return (
      Object.keys(DAY_NAMES).find((code) => DAY_NAMES[code] === name) || null
    );
  };

  /*
   * Assignments already linked to this header are preserved. Generation only
   * fills empty slots; it never overwrites or deletes an existing assignment.
   */
  const existingHeaderAssignments = await Timetable.find({
    timetableHeader: header._id,
  }).lean();

  const preserved = [];
  const invalidExisting = [];

  for (const entry of existingHeaderAssignments) {
    const entryDay = normalizeDayName(entry.day);
    const entryDayCode = dayCodeOf(entry.day);
    const period = entry.periodId ? periodById.get(entry.periodId) : null;

    if (!entryDay || !entryDayCode || !workingDaySet.has(entryDayCode)) {
      invalidExisting.push({
        assignmentId: entry._id,
        day: entry.day,
        periodId: entry.periodId,
        reason: "INVALID_DAY",
        message: `${entry.day || "An assignment"} is not a working day for this timetable.`,
      });
      continue;
    }

    if (!period) {
      invalidExisting.push({
        assignmentId: entry._id,
        day: entryDay,
        periodId: entry.periodId,
        reason: "INVALID_PERIOD",
        message: `Period ${entry.periodId || "(missing)"} is not part of the configured schedule.`,
      });
      continue;
    }

    if (!entry.subject || !entry.teacher) {
      invalidExisting.push({
        assignmentId: entry._id,
        day: entryDay,
        periodId: entry.periodId,
        reason: entry.subject ? "MISSING_TEACHER" : "MISSING_SUBJECT",
        message: `The ${entryDay} ${entry.periodId} assignment is missing its ${
          entry.subject ? "teacher" : "subject"
        }.`,
      });
      continue;
    }

    preserved.push({ entry, day: entryDay, period });
  }

  const existingClassAssignments = await Timetable.find({
    class: header.class,
    section: header.section,
    timetableHeader: { $ne: header._id },
  }).lean();

  const existingTeacherAssignments = await Timetable.find({
    teacher: { $exists: true, $ne: null },
    timetableHeader: { $ne: header._id },
  })
    .select("teacher day timeFrom timeTo")
    .lean();

  const assignments = [];
  const unscheduled = [];
  const conflicts = [];

  /*
   * In-memory schedules allow each proposed assignment to reserve
   * its class and teacher time slot immediately. Preserved assignments are
   * reserved first so generated rows cannot take their slots.
   */
  const classSchedule = existingClassAssignments.map((entry) => ({
    classId: entry.class?.toString(),
    sectionId: entry.section?.toString(),
    teacherId: entry.teacher?.toString(),
    day: normalizeDayName(entry.day) || entry.day,
    timeFrom: entry.timeFrom,
    timeTo: entry.timeTo,
    roomNo: entry.roomNo || "",
  }));

  const teacherSchedule = existingTeacherAssignments.map((entry) => ({
    teacherId: entry.teacher?.toString(),
    day: normalizeDayName(entry.day) || entry.day,
    timeFrom: entry.timeFrom,
    timeTo: entry.timeTo,
  }));

  for (const current of preserved) {
    classSchedule.push({
      classId: header.class.toString(),
      sectionId: header.section.toString(),
      teacherId: current.entry.teacher.toString(),
      day: current.day,
      timeFrom: current.period.startTime,
      timeTo: current.period.endTime,
      roomNo: current.entry.roomNo || "",
    });

    teacherSchedule.push({
      teacherId: current.entry.teacher.toString(),
      day: current.day,
      timeFrom: current.period.startTime,
      timeTo: current.period.endTime,
    });
  }

  const existingCountBySubject = new Map();
  for (const current of preserved) {
    const subjectKey = current.entry.subject.toString();
    existingCountBySubject.set(
      subjectKey,
      (existingCountBySubject.get(subjectKey) || 0) + 1
    );
  }

  const sameId = (left, right) =>
    left != null &&
    right != null &&
    left.toString() === right.toString();

  const hasClassConflict = (slot) =>
    classSchedule.some(
      (entry) =>
        sameId(entry.classId, header.class) &&
        sameId(entry.sectionId, header.section) &&
        entry.day === slot.day &&
        overlaps(
          slot.startMinutes,
          slot.endMinutes,
          toMin(entry.timeFrom),
          toMin(entry.timeTo)
        )
    );

  const hasTeacherConflict = (teacherId, slot) =>
    teacherSchedule.some(
      (entry) =>
        sameId(entry.teacherId, teacherId) &&
        entry.day === slot.day &&
        overlaps(
          slot.startMinutes,
          slot.endMinutes,
          toMin(entry.timeFrom),
          toMin(entry.timeTo)
        )
    );

  for (const requirement of requirements) {
    const subjectId = requirement.subject?._id || requirement.subject || null;
    const teacherId = requirement.teacher?._id || requirement.teacher || null;
    const subjectLabel =
      requirement.subject?.subjectName ||
      requirement.subject?.name ||
      "This subject";
    const teacherLabel =
      requirement.teacher?.personalInfo?.name ||
      requirement.teacher?.name ||
      "This teacher";

    if (!subjectId || !teacherId) {
      unscheduled.push({
        requirementId: requirement._id,
        subjectId: subjectId || null,
        teacherId: teacherId || null,
        subjectName: subjectLabel,
        teacherName: teacherLabel,
        reason: "INVALID_SUBJECT_OR_TEACHER",
        message: `${
          subjectId ? teacherLabel : subjectLabel
        } is missing from this requirement.`,
      });

      continue;
    }

    const eligibleTeachers = await getEligibleTeachers({
      schoolId,
      classId: header.class,
      sectionId: header.section,
      subjectId,
    });

    /*
     * If the class/section has teachers configured, the requested teacher
     * must be one of them.
     *
     * If no teacher assignment exists, preserve the previous behavior and do
     * not reject solely for a missing assignment.
     */
    if (
      eligibleTeachers.length > 0 &&
      !eligibleTeachers.some((id) => sameId(id, teacherId))
    ) {
      unscheduled.push({
        requirementId: requirement._id,
        subjectId,
        teacherId,
        subjectName: subjectLabel,
        teacherName: teacherLabel,
        reason: "TEACHER_NOT_ASSIGNED_TO_CLASS",
        message: `${teacherLabel} is not assigned to this class/section.`,
      });

      continue;
    }

    const required = Number(requirement.periodsPerWeek);

    if (!Number.isInteger(required) || required < 0) {
      unscheduled.push({
        requirementId: requirement._id,
        subjectId,
        teacherId,
        subjectName: subjectLabel,
        teacherName: teacherLabel,
        reason: "INVALID_PERIODS_PER_WEEK",
        message: `${subjectLabel} has an invalid periods-per-week value.`,
      });

      continue;
    }

    // Existing valid assignments count towards the requirement. They are
    // preserved, so only the remaining periods are generated.
    const alreadyScheduled =
      existingCountBySubject.get(subjectId.toString()) || 0;
    const needed = Math.max(0, required - alreadyScheduled);

    if (needed === 0) {
      continue;
    }

    const allowedDays =
      Array.isArray(requirement.days) && requirement.days.length > 0
        ? requirement.days
        : workingDays;

    const allowedDaySet = new Set(allowedDays);

    const daySlots = slots.filter((slot) =>
      allowedDaySet.has(slot.dayCode)
    );

    const preferredSlots = requirement.preferredPeriodId
      ? daySlots.filter(
          (slot) => slot.periodId === requirement.preferredPeriodId
        )
      : [];

    const otherSlots = daySlots.filter(
      (slot) =>
        !requirement.preferredPeriodId ||
        slot.periodId !== requirement.preferredPeriodId
    );

    // Try the preferred period first, then the remaining periods.
    const tryOrder = [...preferredSlots, ...otherSlots];

    let placed = 0;

    for (const slot of tryOrder) {
      if (placed >= needed) {
        break;
      }

      if (hasClassConflict(slot)) {
        continue;
      }

      if (hasTeacherConflict(teacherId, slot)) {
        conflicts.push({
          type: "TEACHER_CONFLICT",
          teacherId,
          teacherName: teacherLabel,
          subjectId,
          day: slot.day,
          periodId: slot.periodId,
          timeFrom: slot.timeFrom,
          timeTo: slot.timeTo,
          message: `${teacherLabel} is already teaching during ${slot.day} ${slot.periodId}.`,
        });

        continue;
      }

      /*
       * Build a document-shaped object only.
       * Do not call Timetable.create() here.
       */
      const assignment = {
        class: header.class,
        section: header.section,
        day: slot.day,
        subject: subjectId,
        teacher: teacherId,
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
        roomNo: slot.roomNo,
        timetableHeader: header._id,
        periodId: slot.periodId,
        academicYear: header.academicYear,
      };

      assignments.push(assignment);

      // Reserve this proposed slot for subsequent requirements.
      classSchedule.push({
        classId: header.class.toString(),
        sectionId: header.section.toString(),
        teacherId: teacherId.toString(),
        day: slot.day,
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
        roomNo: slot.roomNo,
      });

      teacherSchedule.push({
        teacherId: teacherId.toString(),
        day: slot.day,
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
      });

      placed += 1;
    }

    if (placed < needed) {
      unscheduled.push({
        requirementId: requirement._id,
        subjectId,
        teacherId,
        subjectName: subjectLabel,
        teacherName: teacherLabel,
        required,
        alreadyScheduled,
        needed,
        placed,
        reason:
          placed === 0
            ? "NO_AVAILABLE_SLOT"
            : "PARTIALLY_SCHEDULED",
        message:
          placed === 0
            ? `No free slot could be found for ${subjectLabel} (${teacherLabel}).`
            : `${subjectLabel} (${teacherLabel}) was scheduled ${placed} of ${needed} remaining period(s).`,
      });
    }
  }

  const required = requirements.reduce(
    (sum, requirement) =>
      sum + Math.max(0, Number(requirement.periodsPerWeek) || 0),
    0
  );

  return {
    success: unscheduled.length === 0,
    headerId: header._id,
    required,
    assigned: assignments.length,
    preserved: preserved.length,
    total: assignments.length + preserved.length,
    invalidExisting,
    unscheduled,
    unassigned: unscheduled,
    conflicts,
    assignments,
  };
};

module.exports = {
  generateTimetable,
  toMin,
  overlaps,
};