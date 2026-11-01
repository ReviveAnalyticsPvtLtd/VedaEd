const Timetable = require("./timeTableSchema");
const TimetableHeader = require("./timetableHeaderSchema");
const { validateTimetableConflicts } = require("./timetableConflictService");

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

const slotKey = (day, periodId) => `${day}::${periodId}`;

const slotOf = (period, day) => ({
  day,
  periodId: period.periodId,
  timeFrom: period.startTime,
  timeTo: period.endTime,
});

const teachingPeriod = (header, periodId) =>
  (header.periods || []).find(
    (period) => period.periodId === periodId && period.type !== "LUNCH"
  ) || null;

const workingDaySet = (header) => {
  const fromHeader = (header.workingDays || [])
    .map((day) => dayName(day))
    .filter(Boolean);
  return new Set(fromHeader);
};

// Same validation the entries save endpoint runs: in-memory check of the whole
// proposed timetable plus cross-timetable teacher/room/class checks.
const findConflicts = async ({ header, schoolId, proposedAssignments }) => {
  const conflicts = [];

  const internal = await validateTimetableConflicts({
    schoolId,
    proposedAssignments,
  });
  conflicts.push(...(internal.conflicts || []));

  const legacyRows = await Timetable.find({
    class: header.class,
    section: header.section,
    $or: [{ timetableHeader: { $exists: false } }, { timetableHeader: null }],
  })
    .select("_id")
    .lean();

  const excludeAssignmentIds = legacyRows.map((row) => row._id);

  for (const proposal of proposedAssignments) {
    const result = await validateTimetableConflicts({
      schoolId,
      classId: header.class,
      sectionId: header.section,
      teacherId: proposal.teacherId,
      roomNo: proposal.roomNo,
      day: proposal.day,
      timeFrom: proposal.timeFrom,
      timeTo: proposal.timeTo,
      academicYearId: header.academicYear,
      excludeHeaderId: header._id,
      excludeAssignmentIds,
    });

    conflicts.push(...(result.conflicts || []));
  }

  return conflicts;
};

const proposalOf = (entry, overrides = {}) => ({
  assignmentId: String(entry._id),
  classId: entry.class,
  sectionId: entry.section,
  subjectId: entry.subject,
  teacherId: entry.teacher,
  roomNo: entry.roomNo || "",
  day: entry.day,
  timeFrom: entry.timeFrom,
  timeTo: entry.timeTo,
  ...overrides,
});

const applyUpdates = async (updates) => {
  // Both rows move as one bulk command. If it fails we restore the originals
  // so a partial move cannot leave the timetable corrupted.
  const operations = updates.map(({ filter, set }) => ({
    updateOne: { filter, update: { $set: set } },
  }));

  try {
    await Timetable.bulkWrite(operations);
  } catch (error) {
    await Promise.all(
      updates.map(({ filter, restore }) =>
        Timetable.updateOne(filter, { $set: restore }).catch(() => null)
      )
    );
    throw error;
  }
};

const bumpHeaderVersion = (header, schoolId, userId) =>
  TimetableHeader.updateOne(
    { _id: header._id, schoolId },
    {
      $set: { updatedBy: userId || null },
      $inc: { version: 1 },
    }
  );

const loadOwnEntries = (header) =>
  Timetable.find({ timetableHeader: header._id }).lean();

const resolveSource = (entries, body) => {
  if (body.assignmentId) {
    return (
      entries.find(
        (entry) => String(entry._id) === String(body.assignmentId)
      ) || null
    );
  }

  const day = dayName(body.from?.day || body.day);
  const periodId = body.from?.periodId || body.fromPeriodId || body.periodId;

  if (!day || !periodId) return null;

  return entries.find((entry) => slotKey(entry.day, entry.periodId) === slotKey(day, periodId)) || null;
};

const missingSource = () => ({
  status: 404,
  message: "Timetable assignment not found",
  conflicts: [
    {
      type: "PERIOD_ALREADY_ASSIGNED",
      message: "There is no assignment in the source slot",
    },
  ],
});

const badRequest = (message, type = "INVALID_INPUT") => ({
  status: 400,
  message,
  conflicts: [{ type, message }],
});

const conflictResponse = (conflicts) => ({
  status: 409,
  message:
    conflicts[0]?.message || "This move creates a timetable conflict",
  conflicts,
});

// Move a single occurrence to another slot. When the target is occupied the
// two assignments swap, unless the caller passes swap: false.
const moveAssignment = async ({ header, schoolId, body = {}, userId }) => {
  const entries = await loadOwnEntries(header);
  const source = resolveSource(entries, body);

  if (!source) return { error: missingSource() };

  const targetDay = dayName(body.to?.day || body.toDay || source.day);
  const targetPeriodId = body.to?.periodId || body.toPeriodId;
  const targetPeriod = teachingPeriod(header, targetPeriodId);

  if (!targetDay) {
    return { error: badRequest("The target day is not a valid working day", "INVALID_DAY") };
  }

  if (header.workingDays?.length && !workingDaySet(header).has(targetDay)) {
    return {
      error: badRequest(
        `${targetDay} is not a working day for this timetable`,
        "INVALID_DAY"
      ),
    };
  }

  if (!targetPeriod) {
    return {
      error: badRequest(
        `Period ${targetPeriodId || "(missing)"} is not part of the configured schedule`,
        "INVALID_PERIOD"
      ),
    };
  }

  if (
    slotKey(source.day, source.periodId) === slotKey(targetDay, targetPeriod.periodId)
  ) {
    return {
      data: {
        from: { day: source.day, periodId: source.periodId },
        to: { day: targetDay, periodId: targetPeriod.periodId },
        swapped: false,
        moved: 1,
      },
    };
  }

  const target =
    entries.find(
      (entry) =>
        slotKey(entry.day, entry.periodId) ===
        slotKey(targetDay, targetPeriod.periodId)
    ) || null;

  if (target && body.swap === false) {
    return {
      error: conflictResponse([
        {
          type: "PERIOD_ALREADY_ASSIGNED",
          day: targetDay,
          periodId: targetPeriod.periodId,
          message: `${targetDay} ${targetPeriod.periodId} is already assigned`,
        },
      ]),
    };
  }

  const targetSlot = slotOf(targetPeriod, targetDay);
  const sourceSlot = {
    day: source.day,
    periodId: source.periodId,
    timeFrom: source.timeFrom,
    timeTo: source.timeTo,
  };

  const proposedAssignments = entries.map((entry) => {
    if (String(entry._id) === String(source._id)) {
      return proposalOf(entry, targetSlot);
    }
    if (target && String(entry._id) === String(target._id)) {
      return proposalOf(entry, sourceSlot);
    }
    return proposalOf(entry);
  });

  const conflicts = await findConflicts({
    header,
    schoolId,
    proposedAssignments,
  });

  if (conflicts.length > 0) return { error: conflictResponse(conflicts) };

  const updates = [
    {
      filter: { _id: source._id },
      set: targetSlot,
      restore: sourceSlot,
    },
  ];

  if (target) {
    updates.push({
      filter: { _id: target._id },
      set: sourceSlot,
      restore: targetSlot,
    });
  }

  await applyUpdates(updates);
  await bumpHeaderVersion(header, schoolId, userId);

  return {
    data: {
      from: { day: source.day, periodId: source.periodId },
      to: { day: targetDay, periodId: targetPeriod.periodId },
      swapped: Boolean(target),
      moved: 1,
    },
  };
};

// Move every occurrence of a subject from one period to another across the
// selected weekdays. All moves are validated together and applied together.
const moveSeries = async ({ header, schoolId, body = {}, userId }) => {
  const entries = await loadOwnEntries(header);
  const anchor = resolveSource(entries, body);

  if (!anchor) return { error: missingSource() };

  const fromPeriodId = body.from?.periodId || body.fromPeriodId || anchor.periodId;
  const toPeriodId = body.to?.periodId || body.toPeriodId;
  const toPeriod = teachingPeriod(header, toPeriodId);

  if (!toPeriod) {
    return {
      error: badRequest(
        `Period ${toPeriodId || "(missing)"} is not part of the configured schedule`,
        "INVALID_PERIOD"
      ),
    };
  }

  if (fromPeriodId === toPeriod.periodId) {
    return { error: badRequest("Source and target period are the same", "INVALID_PERIOD") };
  }

  const requestedDays = (body.days || []).map((day) => dayName(day)).filter(Boolean);
  const dayFilter = new Set(requestedDays.length ? requestedDays : workingDaySet(header));

  const moving = entries.filter(
    (entry) =>
      entry.periodId === fromPeriodId &&
      (dayFilter.size === 0 || dayFilter.has(entry.day)) &&
      String(entry.subject) === String(anchor.subject) &&
      String(entry.teacher) === String(anchor.teacher)
  );

  if (moving.length === 0) {
    return {
      error: {
        status: 404,
        message: "No matching assignments to move",
        conflicts: [
          {
            type: "INVALID_PERIOD",
            message: `No assignments in ${fromPeriodId} match this move`,
          },
        ],
      },
    };
  }

  const movingIds = new Set(moving.map((entry) => String(entry._id)));
  const targetSlotByEntry = new Map();
  const occupied = [];

  for (const entry of moving) {
    const occupant = entries.find(
      (candidate) =>
        slotKey(candidate.day, candidate.periodId) ===
        slotKey(entry.day, toPeriod.periodId)
    );

    if (occupant && !movingIds.has(String(occupant._id))) {
      occupied.push({
        type: "PERIOD_ALREADY_ASSIGNED",
        day: entry.day,
        periodId: toPeriod.periodId,
        message: `${entry.day} ${toPeriod.periodId} is already assigned`,
      });
      continue;
    }

    targetSlotByEntry.set(String(entry._id), slotOf(toPeriod, entry.day));
  }

  if (occupied.length > 0) {
    return {
      error: {
        status: 409,
        message: `Unable to move across the week. ${occupied[0].message}.`,
        conflicts: occupied,
      },
    };
  }

  const proposedAssignments = entries.map((entry) => {
    const targetSlot = targetSlotByEntry.get(String(entry._id));
    return targetSlot ? proposalOf(entry, targetSlot) : proposalOf(entry);
  });

  const conflicts = await findConflicts({
    header,
    schoolId,
    proposedAssignments,
  });

  if (conflicts.length > 0) {
    return {
      error: {
        status: 409,
        message: `Unable to move across the week. ${
          conflicts[0]?.message || "A conflict was found."
        }`,
        conflicts,
      },
    };
  }

  const updates = moving.map((entry) => ({
    filter: { _id: entry._id },
    set: targetSlotByEntry.get(String(entry._id)),
    restore: {
      day: entry.day,
      periodId: entry.periodId,
      timeFrom: entry.timeFrom,
      timeTo: entry.timeTo,
    },
  }));

  await applyUpdates(updates);
  await bumpHeaderVersion(header, schoolId, userId);

  return {
    data: {
      from: { periodId: fromPeriodId },
      to: { periodId: toPeriod.periodId },
      moved: moving.length,
      days: moving.map((entry) => entry.day),
    },
  };
};

module.exports = { moveAssignment, moveSeries };
