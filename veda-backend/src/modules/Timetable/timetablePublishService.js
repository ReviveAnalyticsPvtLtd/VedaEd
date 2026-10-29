const Timetable = require("./timeTableSchema");
const TimetableRequirement = require("./timetableRequirementSchema");
const TimetableHeader = require("./timetableHeaderSchema");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Subject = require("../subject/subjectSchema");
const Staff = require("../staff/staffModels");

const DAY_NAMES = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const dayName = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const byCode = DAY_NAMES[str.toUpperCase()];
  if (byCode) return byCode;
  return (
    Object.values(DAY_NAMES).find(
      (name) => name.toLowerCase() === str.toLowerCase()
    ) || null
  );
};

const toMin = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && bStart < aEnd;

const staffName = (staff) =>
  staff?.personalInfo?.name || staff?.name || "This teacher";

const subjectName = (subject) =>
  subject?.subjectName || subject?.name || "This subject";

const classLabel = (cls, section) =>
  [cls?.name, section?.name].filter(Boolean).join("-") || "another class";

const uniqueIds = (values) => [
  ...new Set(values.filter(Boolean).map((value) => String(value))),
];

const loadNameMaps = async ({ classIds, sectionIds, subjectIds, teacherIds }) => {
  const [classes, sections, subjects, teachers] = await Promise.all([
    classIds.length
      ? Class.find({ _id: { $in: classIds } }).select("name").lean()
      : [],
    sectionIds.length
      ? Section.find({ _id: { $in: sectionIds } }).select("name").lean()
      : [],
    subjectIds.length
      ? Subject.find({ _id: { $in: subjectIds } })
          .select("subjectName name")
          .lean()
      : [],
    teacherIds.length
      ? Staff.find({ _id: { $in: teacherIds } })
          .select("personalInfo.name name")
          .lean()
      : [],
  ]);

  return {
    classById: new Map(classes.map((item) => [String(item._id), item])),
    sectionById: new Map(sections.map((item) => [String(item._id), item])),
    subjectById: new Map(subjects.map((item) => [String(item._id), item])),
    teacherById: new Map(teachers.map((item) => [String(item._id), item])),
  };
};

// Full server-side validation for publishing. Returns hard conflicts (which
// block publishing) and warnings (which are informational only).
const validateTimetableForHeader = async ({ header, schoolId }) => {
  const hardConflicts = [];
  const warnings = [];

  const workingDays = (header.workingDays || [])
    .map((day) => dayName(day))
    .filter(Boolean);
  const workingDaySet = new Set(workingDays);

  const periods = header.periods || [];
  const teachingPeriods = periods.filter((period) => period.type !== "LUNCH");
  const periodById = new Map(
    teachingPeriods.map((period) => [period.periodId, period])
  );

  if (workingDaySet.size === 0) {
    hardConflicts.push({
      type: "INVALID_DAY",
      message: "This timetable has no working days configured.",
    });
  }

  if (teachingPeriods.length === 0) {
    hardConflicts.push({
      type: "INVALID_PERIOD",
      message: "This timetable has no teaching periods configured.",
    });
  }

  const entries = await Timetable.find({ timetableHeader: header._id }).lean();

  const slotKeys = new Set();
  const teacherSlotKeys = new Set();
  const normalizedEntries = [];

  for (const entry of entries) {
    const entryDay = dayName(entry.day);
    const period = periodById.get(entry.periodId);

    if (!entryDay || (workingDaySet.size > 0 && !workingDaySet.has(entryDay))) {
      hardConflicts.push({
        type: "INVALID_DAY",
        day: entry.day,
        periodId: entry.periodId,
        message: `${entry.day || "An assignment"} is not a working day for this timetable.`,
      });
    }

    if (!period) {
      hardConflicts.push({
        type: "INVALID_PERIOD",
        day: entryDay,
        periodId: entry.periodId,
        message: `Period ${entry.periodId || "(missing)"} is not part of the configured schedule.`,
      });
      continue;
    }

    const slotKey = `${entryDay}::${entry.periodId}`;
    if (slotKeys.has(slotKey)) {
      hardConflicts.push({
        type: "PERIOD_ALREADY_ASSIGNED",
        day: entryDay,
        periodId: entry.periodId,
        message: `More than one subject is assigned to ${entryDay} ${entry.periodId}.`,
      });
    }
    slotKeys.add(slotKey);

    const teacherKey = `${entryDay}::${entry.periodId}::${entry.teacher}`;
    if (entry.teacher && teacherSlotKeys.has(teacherKey)) {
      hardConflicts.push({
        type: "TEACHER_CONFLICT",
        day: entryDay,
        periodId: entry.periodId,
        teacherId: entry.teacher,
        message: "The same teacher is assigned twice to this period.",
      });
    }
    teacherSlotKeys.add(teacherKey);

    if (!entry.subject) {
      hardConflicts.push({
        type: "MISSING_SUBJECT",
        day: entryDay,
        periodId: entry.periodId,
        message: `The ${entryDay} ${entry.periodId} assignment has no subject.`,
      });
    }

    if (!entry.teacher) {
      hardConflicts.push({
        type: "MISSING_TEACHER",
        day: entryDay,
        periodId: entry.periodId,
        message: `The ${entryDay} ${entry.periodId} assignment has no teacher.`,
      });
    }

    normalizedEntries.push({
      entry,
      day: entryDay,
      period,
      start: toMin(period.startTime || entry.timeFrom),
      end: toMin(period.endTime || entry.timeTo),
    });
  }

  // Conflicts with timetables of other classes/sections in the same school.
  // Timetable rows are not school-scoped directly, so scope them through the
  // school's headers (new flow) or the school's classes (legacy rows).
  let otherEntries = [];

  if (workingDays.length > 0) {
    const [schoolHeaders, schoolClasses] = await Promise.all([
      TimetableHeader.find({ schoolId }).select("_id").lean(),
      Class.find({ schoolId }).select("_id").lean(),
    ]);

    otherEntries = await Timetable.find({
      day: { $in: workingDays },
      timetableHeader: { $ne: header._id },
      $or: [
        { timetableHeader: { $in: schoolHeaders.map((item) => item._id) } },
        { class: { $in: schoolClasses.map((item) => item._id) } },
      ],
    })
      .select("_id day timeFrom timeTo teacher roomNo class section academicYear timetableHeader")
      .lean();
  }

  const sameAcademicYear = (row) =>
    !header.academicYear ||
    !row.academicYear ||
    String(row.academicYear) === String(header.academicYear);

  const replaceableLegacyRow = (row) =>
    !row.timetableHeader &&
    String(row.class) === String(header.class) &&
    String(row.section) === String(header.section);

  otherEntries = otherEntries.filter(
    (row) => sameAcademicYear(row) && !replaceableLegacyRow(row)
  );

  const classIds = uniqueIds([
    ...entries.map((entry) => entry.class),
    ...otherEntries.map((row) => row.class),
  ]);
  const sectionIds = uniqueIds([
    ...entries.map((entry) => entry.section),
    ...otherEntries.map((row) => row.section),
  ]);
  const subjectIds = uniqueIds([
    ...entries.map((entry) => entry.subject),
    ...otherEntries.map((row) => row.subject),
  ]);
  const teacherIds = uniqueIds([
    ...entries.map((entry) => entry.teacher),
    ...otherEntries.map((row) => row.teacher),
  ]);

  const names = await loadNameMaps({
    classIds,
    sectionIds,
    subjectIds,
    teacherIds,
  });

  const nameOfClassSection = (clsId, sectionId) =>
    classLabel(
      names.classById.get(String(clsId)),
      names.sectionById.get(String(sectionId))
    );

  const seenConflicts = new Set();
  const addConflict = (conflict) => {
    const key = [
      conflict.type,
      conflict.day,
      conflict.periodId,
      conflict.teacherId,
      conflict.roomNo,
      conflict.conflictingClass,
    ].join("::");
    if (seenConflicts.has(key)) return;
    seenConflicts.add(key);
    hardConflicts.push(conflict);
  };

  for (const current of normalizedEntries) {
    const { entry, day, period, start, end } = current;

    if (!day || Number.isNaN(start) || Number.isNaN(end)) continue;

    for (const other of otherEntries) {
      if (dayName(other.day) !== day) continue;

      const otherStart = toMin(other.timeFrom);
      const otherEnd = toMin(other.timeTo);
      if (Number.isNaN(otherStart) || Number.isNaN(otherEnd)) continue;
      if (!overlaps(start, end, otherStart, otherEnd)) continue;

      const conflictClass = nameOfClassSection(other.class, other.section);

      if (
        entry.teacher &&
        other.teacher &&
        String(entry.teacher) === String(other.teacher)
      ) {
        const teacher = names.teacherById.get(String(entry.teacher));
        addConflict({
          type: "TEACHER_CONFLICT",
          day,
          periodId: period.periodId,
          timeFrom: period.startTime,
          timeTo: period.endTime,
          teacherId: String(entry.teacher),
          teacherName: staffName(teacher),
          conflictingClass: conflictClass,
          conflictingAssignmentId: String(other._id),
          message: `${staffName(teacher)} is already teaching ${conflictClass} on ${day} ${period.periodId}.`,
        });
      }

      const room = String(entry.roomNo || "").trim();
      const otherRoom = String(other.roomNo || "").trim();

      if (room && otherRoom && room === otherRoom) {
        addConflict({
          type: "ROOM_CONFLICT",
          day,
          periodId: period.periodId,
          timeFrom: period.startTime,
          timeTo: period.endTime,
          roomNo: room,
          conflictingClass: conflictClass,
          conflictingAssignmentId: String(other._id),
          message: `Room ${room} is already used by ${conflictClass} on ${day} ${period.periodId}.`,
        });
      }
    }
  }

  // Warnings: these never block publishing.
  const assignmentsBySubject = new Map();
  const assignmentsByDaySubject = new Map();

  for (const entry of entries) {
    const subjectId = String(entry.subject || "");
    if (!subjectId) continue;

    assignmentsBySubject.set(
      subjectId,
      (assignmentsBySubject.get(subjectId) || 0) + 1
    );

    const dayKey = `${dayName(entry.day) || entry.day}::${subjectId}`;
    assignmentsByDaySubject.set(
      dayKey,
      (assignmentsByDaySubject.get(dayKey) || 0) + 1
    );
  }

  for (const [dayKey, count] of assignmentsByDaySubject.entries()) {
    if (count < 2) continue;
    const [day, subjectId] = dayKey.split("::");
    warnings.push({
      type: "SUBJECT_REPEATED",
      day,
      subjectId,
      message: `${subjectName(names.subjectById.get(subjectId))} appears ${count} times on ${day}.`,
    });
  }

  // Teachers running a long block of back-to-back periods in this timetable.
  const CONSECUTIVE_PERIOD_WARNING = 4;
  const teacherDaySlots = new Map();

  for (const current of normalizedEntries) {
    if (!current.entry.teacher || !current.day) continue;
    const key = `${current.entry.teacher}::${current.day}`;
    if (!teacherDaySlots.has(key)) teacherDaySlots.set(key, []);
    teacherDaySlots.get(key).push(current);
  }

  for (const [key, slots] of teacherDaySlots.entries()) {
    const [teacherId, day] = key.split("::");
    const sorted = [...slots].sort((a, b) => a.start - b.start);
    let run = 1;
    let longest = 1;

    for (let i = 1; i < sorted.length; i += 1) {
      run = sorted[i].start === sorted[i - 1].end ? run + 1 : 1;
      if (run > longest) longest = run;
    }

    if (longest >= CONSECUTIVE_PERIOD_WARNING) {
      const teacher = names.teacherById.get(String(teacherId));
      warnings.push({
        type: "TEACHER_CONSECUTIVE_PERIODS",
        day,
        teacherId: String(teacherId),
        teacherName: staffName(teacher),
        message: `${staffName(teacher)} has ${longest} consecutive periods on ${day}.`,
      });
    }
  }

  const requirements = await TimetableRequirement.find({
    timetableHeader: header._id,
  }).lean();

  for (const requirement of requirements) {
    if (!requirement.subject) continue;

    const scheduled = assignmentsBySubject.get(String(requirement.subject)) || 0;
    const required = Number(requirement.periodsPerWeek) || 0;
    const name = subjectName(names.subjectById.get(String(requirement.subject)));

    if (!requirement.teacher) {
      warnings.push({
        type: "REQUIREMENT_WITHOUT_TEACHER",
        subjectId: String(requirement.subject),
        message: `${name} has no teacher assigned.`,
      });
    }

    if (scheduled < required) {
      warnings.push({
        type: "WEEKLY_COUNT",
        subjectId: String(requirement.subject),
        message: `${name} is scheduled ${scheduled} time(s) but requires ${required}.`,
      });
    } else if (scheduled > required) {
      warnings.push({
        type: "WEEKLY_COUNT",
        subjectId: String(requirement.subject),
        message: `${name} is scheduled ${scheduled} times but only ${required} are required.`,
      });
    }
  }

  const blankRooms = entries.filter(
    (entry) => !String(entry.roomNo || "").trim()
  ).length;

  if (blankRooms > 0) {
    warnings.push({
      type: "MISSING_ROOM",
      message: `${blankRooms} assignment(s) have no room assigned.`,
    });
  }

  if (entries.length === 0) {
    warnings.push({
      type: "EMPTY_TIMETABLE",
      message: "This timetable has no assignments yet.",
    });
  }

  return {
    canPublish: hardConflicts.length === 0,
    version: header.version || 1,
    hardConflicts,
    conflicts: hardConflicts,
    warnings,
    summary: {
      assignments: entries.length,
      workingDays: workingDaySet.size,
      periods: teachingPeriods.length,
      conflicts: hardConflicts.length,
      warnings: warnings.length,
    },
  };
};

module.exports = { validateTimetableForHeader };
