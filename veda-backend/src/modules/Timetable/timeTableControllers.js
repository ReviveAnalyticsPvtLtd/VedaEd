const Timetable = require("./timeTableSchema");
const TimetableHeader = require("./timetableHeaderSchema");
const TimetableRequirement = require("./timetableRequirementSchema");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const SubjectGroup = require("../subGroup/subGroupSchema");
const Staff = require("../staff/staffModels");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Subject = require("../subject/subjectSchema");
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
const { AcademicYear } = require("../fees/feeModels");
const { generateTimetable } = require("./timetableGeneratorService");
const {
  validateTimetableConflicts,
  validateTimetableConflictsBulk,
  validateOwnership,
} = require("./timetableConflictService");
const { validateTimetableForHeader } = require("./timetablePublishService");
const { moveAssignment, moveSeries } = require("./timetableMoveService");
const { copyFromHeader } = require("./timetableCopyService");
const { buildTimetableExport } = require("./timetableExportService");
const {
  TimetableAudit,
  recordTimetableAudit,
} = require("./timetableAuditSchema");
const mongoose = require("mongoose");

// authMiddleware exposes the authenticated account as `req.user.userId`, not
// `req.user._id`. Tests drive the controllers directly and pass `_id`, so both
// are accepted; without this, createdBy/updatedBy were silently undefined.
const currentUserId = (req) => req.user?.userId || req.user?._id || null;

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

// Timetable has no schoolId of its own, so every lookup is anchored to the
// Class/Section/Subject/Staff documents it references.
const findOwnedClass = (classId, schoolId) =>
  Class.findOne({ _id: classId, schoolId }).select("_id");

const findOwnedSection = (sectionId, schoolId) =>
  Section.findOne({ _id: sectionId, schoolId }).select("_id");

const findOwnedSubject = (subjectId, schoolId) =>
  Subject.findOne({ _id: subjectId, schoolId }).select("_id");

const findOwnedStaff = (staffId, schoolId) =>
  Staff.findOne({ _id: staffId, schoolId }).select("_id");

// Bulk variants used by timetable saves: one query per collection instead of
// one query per entry.
const findOwnedSubjectIds = async (subjectIds, schoolId) => {
  if (!subjectIds.length) return new Set();
  const docs = await Subject.find({ _id: { $in: subjectIds }, schoolId })
    .select("_id")
    .lean();
  return new Set(docs.map((doc) => String(doc._id)));
};

const findOwnedStaffIds = async (staffIds, schoolId) => {
  if (!staffIds.length) return new Set();
  const docs = await Staff.find({ _id: { $in: staffIds }, schoolId })
    .select("_id")
    .lean();
  return new Set(docs.map((doc) => String(doc._id)));
};

const getSchoolClassIds = async (schoolId) =>
  (await Class.find({ schoolId }).select("_id")).map((c) => c._id);

const getSchoolSectionIds = async (schoolId) =>
  (await Section.find({ schoolId }).select("_id")).map((s) => s._id);

// helpers
const toMin = (hhmm) => {
  const [h, m] = (hhmm || "").split(":").map(Number);
  return h * 60 + m;
};

const DAY_NAMES = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const normalizeDay = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const byCode = DAY_NAMES[str.toUpperCase()];
  if (byCode) return byCode;
  const match = Object.values(DAY_NAMES).find(
    (name) => name.toLowerCase() === str.toLowerCase()
  );
  return match || null;
};

const dayCode = (value) => {
  const name = normalizeDay(value);
  if (!name) return null;
  return (
    Object.keys(DAY_NAMES).find((code) => DAY_NAMES[code] === name) || null
  );
};

const isValidObjectId = (id) => mongoose.isValidObjectId(String(id));

const populateTimetableBySchool = (query, schoolId) =>
  query
    .populate({ path: "class", match: { schoolId }, select: "name" })
    .populate({ path: "section", match: { schoolId }, select: "name" })
    .populate({ path: "subject", match: { schoolId }, select: "subjectName subjectCode type" })
    .populate({
      path: "teacher",
      match: { schoolId },
      select: "personalInfo.name personalInfo.staffId personalInfo.department",
    });

const handleControllerError = (res, error, label) => {
  console.error(`Error ${label}:`, error);

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid timetable entry",
      errors: Object.values(error.errors || {}).map((e) => e.message),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server error",
    error: error.message,
  });
};

// Headers
exports.getTimetableHeaders = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { academicYearId, classId, sectionId } = req.query;
    const filter = { schoolId };

    if (academicYearId && isValidObjectId(academicYearId)) {
      filter.academicYear = academicYearId;
    }

    if (classId && isValidObjectId(classId)) {
      if (!(await findOwnedClass(classId, schoolId))) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.class = classId;
    }

    if (sectionId && isValidObjectId(sectionId)) {
      if (!(await findOwnedSection(sectionId, schoolId))) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.section = sectionId;
    }

    const headers = await TimetableHeader.find(filter)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("academicYear", "label startDate endDate isActive")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: headers });
  } catch (error) {
    console.error("Error fetching timetable headers:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.createTimetableHeader = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { academicYearId, classId, sectionId } = req.body;

    if (!classId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "classId and sectionId are required",
      });
    }

    if (!isValidObjectId(classId) || !isValidObjectId(sectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId or sectionId",
      });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    let academicYear = undefined;

    if (academicYearId) {
      if (!isValidObjectId(academicYearId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid academicYearId",
        });
      }

      const ay = await AcademicYear.findById(academicYearId);

      if (!ay) {
        return res.status(404).json({
          success: false,
          message: "Academic year not found",
        });
      }

      academicYear = ay._id;
    }

    const existing = await TimetableHeader.findOne({
      schoolId,
      academicYear: academicYear || null,
      class: classId,
      section: sectionId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Timetable header already exists for this class/section/academic year",
      });
    }

    const header = await TimetableHeader.create({
      schoolId,
      academicYear,
      class: classId,
      section: sectionId,
      status: "DRAFT",
      workingDays: [],
      periods: [],
      version: 1,
      createdBy: currentUserId(req),
      updatedBy: currentUserId(req),
    });

    const populated = await TimetableHeader.findById(header._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("academicYear", "label startDate endDate isActive");

    await recordTimetableAudit({
      header,
      schoolId,
      action: "HEADER_CREATED",
      userId: currentUserId(req),
      details: {
        classId: header.class,
        sectionId: header.section,
        academicYearId: header.academicYear || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Timetable header created",
      data: populated,
    });
  } catch (error) {
    console.error("Error creating timetable header:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Not used by the current timetable UI. Kept commented for reference.
/*
exports.getTimetableHeaderById = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid header id",
      });
    }

    const header = await TimetableHeader.findOne({
      _id: id,
      schoolId,
    })
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("academicYear", "label startDate endDate isActive");

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Timetable header not found",
      });
    }

    res.status(200).json({ success: true, data: header });
  } catch (error) {
    console.error("Error fetching timetable header:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
*/

exports.updateTimetableHeaderSchedule = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid header id",
      });
    }

    const header = await TimetableHeader.findOne({
      _id: id,
      schoolId,
    });

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Timetable header not found",
      });
    }
    const {
      workingDays,
      startTime,
      defaultDurationMinutes,
      defaultRoom,
      lunch,
      periods,
    } = req.body;

    const previousWorkingDays = [...(header.workingDays || [])];
    const previousPeriods = (header.periods || []).map((period) => ({
      periodId: period.periodId,
      type: period.type,
    }));

    if (workingDays) {
      if (!Array.isArray(workingDays)) {
        return res.status(400).json({
          success: false,
          message: "workingDays must be an array",
        });
      }

      const allowed = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

      for (const d of workingDays) {
        if (!allowed.includes(d)) {
          return res.status(400).json({
            success: false,
            message: `Invalid working day: ${d}`,
          });
        }
      }

      header.workingDays = workingDays;
    }

    if (startTime !== undefined) header.startTime = startTime;

    if (defaultDurationMinutes !== undefined) {
      if (
        typeof defaultDurationMinutes !== "number" ||
        defaultDurationMinutes < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid defaultDurationMinutes",
        });
      }

      header.defaultDurationMinutes = defaultDurationMinutes;
    }

    if (defaultRoom !== undefined) header.defaultRoom = defaultRoom;
    if (lunch !== undefined) header.lunch = lunch;

    if (periods !== undefined) {
      if (!Array.isArray(periods)) {
        return res.status(400).json({
          success: false,
          message: "periods must be an array",
        });
      }

      header.periods = periods;
    }

    // Removing a period or a working day must not silently orphan or delete
    // assignments. Report exactly which rows would be lost and require an
    // explicit confirmation before touching them.
    const nextWorkingDaySet = new Set(header.workingDays || []);
    const previousPeriodIds = new Set(
      previousPeriods
        .filter((period) => period.type !== "LUNCH")
        .map((period) => period.periodId)
    );
    const nextPeriodIds = new Set(
      (header.periods || [])
        .filter((period) => period.type !== "LUNCH")
        .map((period) => period.periodId)
    );

    const removedWorkingDays = previousWorkingDays.filter(
      (day) => !nextWorkingDaySet.has(day)
    );
    const removedPeriodIds = [...previousPeriodIds].filter(
      (periodId) => !nextPeriodIds.has(periodId)
    );

    let affectedEntries = [];

    if (removedWorkingDays.length > 0 || removedPeriodIds.length > 0) {
      const rows = await Timetable.find({
        class: header.class,
        section: header.section,
        $or: [
          { timetableHeader: header._id },
          // `{ timetableHeader: null }` already matches rows where the field
          // is missing, so the `$exists` clause is redundant.
          // { timetableHeader: { $exists: false } },
          { timetableHeader: null },
        ],
      })
        .select("_id day periodId")
        .lean();

      affectedEntries = rows.filter((row) => {
        const code = dayCode(row.day);
        return (
          (code && removedWorkingDays.includes(code)) ||
          (row.periodId && removedPeriodIds.includes(row.periodId))
        );
      });
    }

    const confirmsRemoval =
      req.body.confirmRemoveAssignments === true ||
      req.body.confirm === true ||
      req.query?.confirmRemoveAssignments === "true";

    if (affectedEntries.length > 0 && !confirmsRemoval) {
      const conflicts = [
        ...removedWorkingDays.map((day) => ({
          type: "INVALID_DAY",
          day,
          message: `${day} is no longer a working day but still has assignments.`,
        })),
        ...removedPeriodIds.map((periodId) => ({
          type: "INVALID_PERIOD",
          periodId,
          message: `Period ${periodId} is being removed but still has assignments.`,
        })),
      ];

      return res.status(409).json({
        success: false,
        code: "TIMETABLE_SCHEDULE_HAS_ASSIGNMENTS",
        message: `This change would remove ${affectedEntries.length} assignment(s). Confirm to remove them.`,
        requiresConfirmation: true,
        affectedAssignments: affectedEntries.length,
        removedWorkingDays,
        removedPeriodIds,
        conflicts,
      });
    }

    header.updatedBy = currentUserId(req);
    header.version = (header.version || 1) + 1;
    if (affectedEntries.length > 0) header.needsRebuild = true;
    await header.save();

    let removedAssignments = 0;

    if (affectedEntries.length > 0) {
      const deleted = await Timetable.deleteMany({
        _id: { $in: affectedEntries.map((entry) => entry._id) },
      });
      removedAssignments = deleted.deletedCount || 0;
    }

    await recordTimetableAudit({
      header,
      schoolId,
      action: "SCHEDULE_UPDATED",
      userId: currentUserId(req),
      details: {
        changed: [
          "workingDays",
          "startTime",
          "defaultDurationMinutes",
          "defaultRoom",
          "lunch",
          "periods",
        ].filter((key) => req.body[key] !== undefined),
        removedWorkingDays,
        removedPeriodIds,
        removedAssignments,
      },
    });

    const populated = await TimetableHeader.findById(header._id)
      .populate({ path: "class", match: { schoolId }, select: "name" })
      .populate({ path: "section", match: { schoolId }, select: "name" })
      .populate("academicYear", "label startDate endDate isActive");

    res.status(200).json({
      success: true,
      message: "Schedule updated",
      data: populated,
    });
  } catch (error) {
    console.error("Error updating timetable header schedule:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getTimetableRequirements = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid header id",
      });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Timetable header not found",
      });
    }

    const requirements = await TimetableRequirement.find({
      schoolId,
      timetableHeader: id,
    })
      .populate({
        path: "subject",
        match: { schoolId },
        select: "subjectName subjectCode type",
      })
      .populate({
        path: "teacher",
        match: { schoolId },
        select:
          "personalInfo.name personalInfo.staffId personalInfo.department",
      })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    console.error("Error fetching timetable requirements:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateTimetableRequirements = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid header id",
      });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Timetable header not found",
      });
    }

    const { requirements } = req.body;

    if (!Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        message: "requirements must be an array",
      });
    }

    const allowedDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const validated = [];

    for (const reqItem of requirements) {
      const {
        subjectId,
        teacherId,
        periodsPerWeek,
        days,
        preferredPeriodId,
      } = reqItem;

      if (
        !subjectId ||
        !teacherId ||
        periodsPerWeek === undefined ||
        !Array.isArray(days)
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields in requirement",
        });
      }

      if (!isValidObjectId(subjectId) || !isValidObjectId(teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId or teacherId",
        });
      }

      if (typeof periodsPerWeek !== "number" || periodsPerWeek < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid periodsPerWeek",
        });
      }

      for (const d of days) {
        if (!allowedDays.includes(d)) {
          return res.status(400).json({
            success: false,
            message: `Invalid day: ${d}`,
          });
        }
      }

      if (!(await findOwnedSubject(subjectId, schoolId))) {
        return res.status(404).json({
          success: false,
          message: "Subject not found",
        });
      }

      // Duplicate ownership lookup commented out: the Staff.findOne below is
      // already scoped to schoolId and is needed for the role check.
      // if (!(await findOwnedStaff(teacherId, schoolId))) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Teacher not found",
      //   });
      // }

      // Basic eligibility check - teacher must exist and be teacher role if possible
      const teacher = await Staff.findOne({ _id: teacherId, schoolId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
        });
      }

      if (
        teacher &&
        teacher.personalInfo?.role &&
        teacher.personalInfo.role !== "Teacher"
      ) {
        return res.status(400).json({
          success: false,
          message: "Selected staff is not a Teacher",
        });
      }

      validated.push({
        schoolId,
        timetableHeader: id,
        subject: subjectId,
        teacher: teacherId,
        periodsPerWeek,
        days,
        preferredPeriodId: preferredPeriodId || null,
      });
    }

    // The client sends the full requirement list, so replace the previous
    // set atomically after every row has been validated.
    await TimetableRequirement.deleteMany({
      schoolId,
      timetableHeader: id,
    });

    if (validated.length > 0) {
      await TimetableRequirement.insertMany(validated);
    }

    const populated = await TimetableRequirement.find({
      schoolId,
      timetableHeader: id,
    })
      .populate({
        path: "subject",
        match: { schoolId },
        select: "subjectName subjectCode type",
      })
      .populate({
        path: "teacher",
        match: { schoolId },
        select:
          "personalInfo.name personalInfo.staffId personalInfo.department",
      })
      .sort({ createdAt: 1 });

    header.updatedBy = currentUserId(req);
    header.version = (header.version || 1) + 1;
    // Requirement changes invalidate the current assignment plan; the client
    // can surface this and offer to regenerate or re-save assignments.
    header.needsRebuild = true;
    await header.save();

    await recordTimetableAudit({
      header,
      schoolId,
      action: "REQUIREMENTS_UPDATED",
      userId: currentUserId(req),
      version: header.version,
      details: {
        requirements: validated.length,
        needsRebuild: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Requirements updated",
      data: populated,
      needsRebuild: true,
    });
  } catch (error) {
    console.error("Error updating timetable requirements:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Not used by the current timetable UI. Kept commented for reference.
/*
exports.generateTimetableForHeader = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid header id",
      });
    }

    const header = await TimetableHeader.findOne({
      _id: id,
      schoolId,
    });

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Timetable header not found",
      });
    }

    if (!header.periods || header.periods.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Schedule not configured",
      });
    }

    const requirements = await TimetableRequirement.find({
      schoolId,
      timetableHeader: id,
    });

    if (requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subject requirements found",
      });
    }

    const existingAssignments = await Timetable.find({
      timetableHeader: id,
    }).select("_id");

    // Existing assignments are preserved. Generation only adds rows to free
    // slots and reports anything it could not place instead of overwriting.
    const result = await generateTimetable({
      header,
      schoolId,
      userId: currentUserId(req),
    });

    let saved = [];

    if (Array.isArray(result.assignments) && result.assignments.length > 0) {
      saved = await Timetable.insertMany(result.assignments);
    }

    header.version = (header.version || 1) + 1;
    header.updatedBy = currentUserId(req);
    header.needsRebuild =
      result.unassigned.length > 0 || result.invalidExisting.length > 0;
    await header.save();

    await recordTimetableAudit({
      header,
      schoolId,
      action: "GENERATED",
      userId: currentUserId(req),
      details: {
        assigned: saved.length,
        preserved: result.preserved,
        unassigned: result.unassigned.length,
        invalidExisting: result.invalidExisting.length,
        existingAssignments: existingAssignments.length,
      },
    });

    res.status(200).json({
      success: true,
      message:
        result.unassigned.length > 0
          ? "Timetable generated with unassigned requirements"
          : "Timetable generated",
      data: { ...result, saved: saved.length },
    });
  } catch (error) {
    console.error("Error generating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
*/
exports.copyTimetableSetup = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const result = await copyFromHeader({
      targetHeader: header,
      schoolId,
      body: req.body || {},
      userId: currentUserId(req),
    });

    if (result.error) {
      return res.status(result.error.status || 400).json({
        success: false,
        message: result.error.message,
      });
    }

    const populated = await populateHeaderById(header._id, schoolId);

    return res.status(200).json({
      success: true,
      message: "Timetable setup copied",
      data: { header: populated, ...result.data },
    });
  } catch (error) {
    return handleControllerError(res, error, "copying timetable setup");
  }
};

// Not used by the current timetable UI. Kept commented for reference.
/*
exports.getTimetableAuditTrail = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId }).select(
      "_id"
    );

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const requestedLimit = Number.parseInt(req.query?.limit, 10);
    const limit = Math.min(
      200,
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 50
    );

    const records = await TimetableAudit.find({
      schoolId,
      timetableHeader: header._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    return handleControllerError(res, error, "loading timetable audit trail");
  }
};
*/

exports.exportTimetableHeader = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;
    const format = String(
      req.params.format || req.query?.format || "xlsx"
    ).toLowerCase();

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    if (!["xlsx", "excel", "pdf", "png"].includes(format)) {
      return res.status(400).json({
        success: false,
        message: "format must be one of xlsx, pdf or png",
      });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const file = await buildTimetableExport({ header, format });

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported export format" });
    }

    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(file.buffer);
  } catch (error) {
    return handleControllerError(res, error, "exporting timetable");
  }
};

// Legacy CRUD entry flow; not used by the current timetable UI.
// Kept commented for reference.
/*
exports.createTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const body = req.body || {};
    const classId = body.class || body.classId;
    const sectionId = body.section || body.sectionId;
    const subjectId = body.subject || body.subjectId;
    const teacherId = body.teacher || body.teacherId;
    const day = normalizeDay(body.day);
    const { timeFrom, timeTo } = body;
    const roomNo = body.roomNo || "";
    const subjectGroupId = body.subjectGroupId || body.subjectGroup || null;
    const headerId = body.timetableHeaderId || body.timetableHeader || null;
    const periodId = body.periodId || null;
    const academicYearId = body.academicYearId || body.academicYear || null;

    if (
      !classId ||
      !sectionId ||
      !subjectId ||
      !teacherId ||
      !day ||
      !timeFrom ||
      !timeTo
    ) {
      return res.status(400).json({
        success: false,
        message:
          "class, section, subject, teacher, day, timeFrom and timeTo are required",
      });
    }

    if (
      ![classId, sectionId, subjectId, teacherId].every(isValidObjectId) ||
      (headerId && !isValidObjectId(headerId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class, section, subject, teacher or header id",
      });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    if (!(await findOwnedSubject(subjectId, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (!(await findOwnedStaff(teacherId, schoolId))) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    let header = null;

    if (headerId) {
      header = await TimetableHeader.findOne({ _id: headerId, schoolId });

      if (!header) {
        return res
          .status(404)
          .json({ success: false, message: "Timetable header not found" });
      }

      if (
        String(header.class) !== String(classId) ||
        String(header.section) !== String(sectionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Timetable header does not belong to this class and section",
        });
      }
    }

    const validation = await validateTimetableConflicts({
      schoolId,
      timetableHeaderId: headerId,
      classId,
      sectionId,
      teacherId,
      roomNo,
      day,
      timeFrom,
      timeTo,
    });

    if (validation.hasConflicts) {
      const invalid = validation.conflicts.some((c) =>
        ["INVALID_PERIOD", "INVALID_DAY"].includes(c.type)
      );

      return res.status(invalid ? 400 : 409).json({
        success: false,
        message: validation.conflicts[0]?.message || "Timetable conflict",
        conflicts: validation.conflicts,
      });
    }

    const created = await Timetable.create({
      class: classId,
      section: sectionId,
      subjectGroup: subjectGroupId || undefined,
      day,
      subject: subjectId,
      teacher: teacherId,
      timeFrom,
      timeTo,
      roomNo,
      timetableHeader: headerId || undefined,
      periodId: periodId || undefined,
      academicYear: academicYearId || header?.academicYear || undefined,
    });

    const populated = await populateTimetableBySchool(
      Timetable.findById(created._id),
      schoolId
    );

    return res.status(201).json({
      success: true,
      message: "Timetable entry created",
      data: populated,
    });
  } catch (error) {
    return handleControllerError(res, error, "creating timetable entry");
  }
};
*/

exports.getTimetableEntries = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { classId, sectionId, teacherId } = req.query;
    let filter = {};

    // Teacher timetable
    if (teacherId) {
      if (!(await findOwnedStaff(teacherId, schoolId))) {
        return res.status(200).json({
          success: true,
          message: "Timetable entries fetched successfully",
          data: [],
        });
      }

      filter.teacher = teacherId;
    } else if (req.user && req.user.role === "student") {
      // Fetch the student's class and section
      const student = await Student.findOne({
        _id: req.user.refId,
        schoolId,
      }).select("personalInfo.class personalInfo.section");

      if (student && student.personalInfo) {
        filter.class = student.personalInfo.class;
        filter.section = student.personalInfo.section;
      }
    } else if (req.user && req.user.role === "parent") {
      // Fetch the parent's child or first linked child
      const parent = await Parent.findOne({
        _id: req.user.refId,
        schoolId,
      }).populate({
        path: "children",
        match: { schoolId },
      });

      const childId = req.query.studentId;

      if (parent && childId) {
        const child = parent.children.find(
          (c) => c._id.toString() === childId
        );

        if (child && child.personalInfo) {
          filter.class = child.personalInfo.class;
          filter.section = child.personalInfo.section;
        }
      } else if (
        parent &&
        parent.children &&
        parent.children.length > 0
      ) {
        filter.class = parent.children[0].personalInfo?.class;
        filter.section = parent.children[0].personalInfo?.section;
      }
    } else if (classId && sectionId) {
      // Manual filter for admin/staff
      if (!isValidObjectId(classId) || !isValidObjectId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid classId or sectionId",
        });
      }

      filter.class = classId;
      filter.section = sectionId;
    }

    // Restrict results to this school's classes and sections
    const [schoolClassIds, schoolSectionIds] = await Promise.all([
      getSchoolClassIds(schoolId),
      getSchoolSectionIds(schoolId),
    ]);

    filter.$and = [
      { class: { $in: schoolClassIds } },
      { section: { $in: schoolSectionIds } },
    ];

    const timetables = await Timetable.find(filter)
      .populate({
        path: "class",
        match: { schoolId },
        select: "name",
      })
      .populate({
        path: "section",
        match: { schoolId },
        select: "name",
      })
      .populate("subjectGroup", "name")
      .populate({
        path: "subject",
        match: { schoolId },
        select: "subjectName subjectCode type",
      })
      .populate({
        path: "teacher",
        match: { schoolId },
        select:
          "personalInfo.name personalInfo.staffId personalInfo.department",
      })
      .sort({ day: 1, timeFrom: 1 });

    return res.status(200).json({
      success: true,
      message: "Timetable entries fetched successfully",
      data: timetables,
    });
  } catch (error) {
    return handleControllerError(res, error, "fetching timetable entries");
  }
};

// Debug helper; not used by the current timetable UI.
// Kept commented for reference.
/*
exports.debugTimetableData = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const [classIds, sectionIds] = await Promise.all([
      getSchoolClassIds(schoolId),
      getSchoolSectionIds(schoolId),
    ]);

    const [entries, headers, requirements] = await Promise.all([
      Timetable.countDocuments({
        class: { $in: classIds },
        section: { $in: sectionIds },
      }),
      TimetableHeader.countDocuments({ schoolId }),
      TimetableRequirement.countDocuments({ schoolId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries,
        headers,
        requirements,
        classes: classIds.length,
        sections: sectionIds.length,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, "debugging timetable data");
  }
};
*/

// Legacy CRUD entry flow; not used by the current timetable UI.
// Kept commented for reference.
/*
exports.updateTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await Timetable.findById(id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable entry not found" });
    }

    // Ownership is anchored on the class/section the entry already belongs to.
    if (
      !(await findOwnedClass(existing.class, schoolId)) ||
      !(await findOwnedSection(existing.section, schoolId))
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable entry not found" });
    }

    const body = req.body || {};
    const classId = body.class || body.classId || existing.class;
    const sectionId = body.section || body.sectionId || existing.section;
    const subjectId = body.subject || body.subjectId || existing.subject;
    const teacherId = body.teacher || body.teacherId || existing.teacher;
    const day = body.day !== undefined ? normalizeDay(body.day) : existing.day;
    const timeFrom =
      body.timeFrom !== undefined ? body.timeFrom : existing.timeFrom;
    const timeTo = body.timeTo !== undefined ? body.timeTo : existing.timeTo;
    const roomNo =
      body.roomNo !== undefined ? body.roomNo || "" : existing.roomNo || "";
    const headerId =
      body.timetableHeaderId !== undefined || body.timetableHeader !== undefined
        ? body.timetableHeaderId || body.timetableHeader || null
        : existing.timetableHeader || null;
    const periodId =
      body.periodId !== undefined ? body.periodId || null : existing.periodId || null;
    const academicYearId =
      body.academicYearId !== undefined || body.academicYear !== undefined
        ? body.academicYearId || body.academicYear || null
        : existing.academicYear || null;

    if (!day) {
      return res.status(400).json({ success: false, message: "Invalid day" });
    }

    if (
      !isValidObjectId(classId) ||
      !isValidObjectId(sectionId) ||
      !isValidObjectId(subjectId) ||
      !isValidObjectId(teacherId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid reference id" });
    }

    if (!(await findOwnedClass(classId, schoolId))) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (!(await findOwnedSection(sectionId, schoolId))) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    if (!(await findOwnedSubject(subjectId, schoolId))) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (!(await findOwnedStaff(teacherId, schoolId))) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (headerId) {
      const header = await TimetableHeader.findOne({ _id: headerId, schoolId });

      if (!header) {
        return res
          .status(404)
          .json({ success: false, message: "Timetable header not found" });
      }

      if (
        String(header.class) !== String(classId) ||
        String(header.section) !== String(sectionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Timetable header does not belong to this class and section",
        });
      }
    }

    const validation = await validateTimetableConflicts({
      schoolId,
      timetableHeaderId: headerId,
      classId,
      sectionId,
      teacherId,
      roomNo,
      day,
      timeFrom,
      timeTo,
      excludeAssignmentId: existing._id,
    });

    if (validation.hasConflicts) {
      const invalid = validation.conflicts.some((c) =>
        ["INVALID_PERIOD", "INVALID_DAY"].includes(c.type)
      );

      return res.status(invalid ? 400 : 409).json({
        success: false,
        message: validation.conflicts[0]?.message || "Timetable conflict",
        conflicts: validation.conflicts,
      });
    }

    existing.class = classId;
    existing.section = sectionId;
    existing.subject = subjectId;
    existing.teacher = teacherId;
    existing.day = day;
    existing.timeFrom = timeFrom;
    existing.timeTo = timeTo;
    existing.roomNo = roomNo;
    existing.timetableHeader = headerId || undefined;
    existing.periodId = periodId || undefined;
    existing.academicYear = academicYearId || undefined;

    if (body.subjectGroupId !== undefined || body.subjectGroup !== undefined) {
      existing.subjectGroup =
        body.subjectGroupId || body.subjectGroup || undefined;
    }

    await existing.save();

    const populated = await populateTimetableBySchool(
      Timetable.findById(existing._id),
      schoolId
    );

    return res.status(200).json({
      success: true,
      message: "Timetable entry updated",
      data: populated,
    });
  } catch (error) {
    return handleControllerError(res, error, "updating timetable entry");
  }
};
*/

// Legacy CRUD entry flow; not used by the current timetable UI.
// Kept commented for reference.
/*
exports.deleteTimetableEntry = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await Timetable.findById(id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable entry not found" });
    }

    if (
      !(await findOwnedClass(existing.class, schoolId)) ||
      !(await findOwnedSection(existing.section, schoolId))
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable entry not found" });
    }

    await Timetable.deleteOne({ _id: existing._id });

    return res.status(200).json({
      success: true,
      message: "Timetable entry deleted",
    });
  } catch (error) {
    return handleControllerError(res, error, "deleting timetable entry");
  }
};
*/

// ---------------------------------------------------------------------------
// Header-linked timetable entries (bulk read/write used by the builder UI)
// ---------------------------------------------------------------------------

exports.getTimetableHeaderEntries = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const entries = await populateTimetableBySchool(
      Timetable.find({ timetableHeader: header._id }).sort({
        day: 1,
        timeFrom: 1,
      }),
      schoolId
    );

    return res.status(200).json({ success: true, data: entries });
  } catch (error) {
    return handleControllerError(res, error, "fetching timetable header entries");
  }
};

exports.replaceTimetableHeaderEntries = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const entries = Array.isArray(req.body?.entries) ? req.body.entries : null;

    if (!entries) {
      return res
        .status(400)
        .json({ success: false, message: "entries must be an array" });
    }

    // Set by publish flows that immediately run the full publish validation.
    const skipConflictValidation =
      req.body?.skipConflictValidation === true;

    const periods = header.periods || [];
    const periodById = new Map(periods.map((p) => [p.periodId, p]));

    const docs = [];
    const proposedAssignments = [];
    const seenSlots = new Set();

    // Resolve subject/teacher ownership for the whole submission in two
    // queries instead of two queries per entry.
    const subjectIds = [
      ...new Set(
        entries
          .map((item) => item.subjectId || item.subject)
          .filter((id) => isValidObjectId(id))
          .map((id) => String(id))
      ),
    ];
    const teacherIds = [
      ...new Set(
        entries
          .map((item) => item.teacherId || item.teacher)
          .filter((id) => isValidObjectId(id))
          .map((id) => String(id))
      ),
    ];

    const [ownedSubjectIds, ownedTeacherIds] = await Promise.all([
      findOwnedSubjectIds(subjectIds, schoolId),
      findOwnedStaffIds(teacherIds, schoolId),
    ]);

    for (const item of entries) {
      const subjectId = item.subjectId || item.subject;
      const teacherId = item.teacherId || item.teacher;
      const day = normalizeDay(item.day);
      const periodId = item.periodId;

      if (!subjectId || !teacherId || !day || !periodId) {
        const missing = [];
        if (!subjectId) missing.push({ type: "MISSING_SUBJECT", message: "Entry has no subject" });
        if (!teacherId) missing.push({ type: "MISSING_TEACHER", message: "Entry has no teacher" });
        if (!day) missing.push({ type: "INVALID_DAY", message: `Entry has an invalid day: ${item.day}` });
        if (!periodId) missing.push({ type: "INVALID_PERIOD", message: "Entry has no periodId" });

        return res.status(400).json({
          success: false,
          message:
            "Every entry needs subjectId, teacherId, day and periodId",
          conflicts: missing,
        });
      }

      if (
        !isValidObjectId(subjectId) ||
        !isValidObjectId(teacherId)
      ) {
        const invalid = [];
        if (!isValidObjectId(subjectId)) {
          invalid.push({ type: "INVALID_SUBJECT", message: "Invalid subjectId" });
        }
        if (!isValidObjectId(teacherId)) {
          invalid.push({ type: "INVALID_TEACHER", message: "Invalid teacherId" });
        }

        return res.status(400).json({
          success: false,
          message: "Invalid subjectId or teacherId",
          conflicts: invalid,
        });
      }

      const period = periodById.get(periodId);

      if (!period || period.type === "LUNCH") {
        return res.status(400).json({
          success: false,
          message: `Period ${periodId} is not part of the configured schedule`,
          conflicts: [
            {
              type: "INVALID_PERIOD",
              day,
              periodId,
              message: `Period ${periodId} is not part of the configured schedule`,
            },
          ],
        });
      }

      const slotKey = `${day}::${periodId}`;
      if (seenSlots.has(slotKey)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate entry for ${day} ${periodId}`,
          conflicts: [
            {
              type: "PERIOD_ALREADY_ASSIGNED",
              day,
              periodId,
              message: `More than one entry for ${day} ${periodId}`,
            },
          ],
        });
      }
      seenSlots.add(slotKey);

      if (!ownedSubjectIds.has(String(subjectId))) {
        return res.status(404).json({
          success: false,
          message: "Subject not found",
          conflicts: [
            { type: "INVALID_SUBJECT", message: "Subject not found" },
          ],
        });
      }

      if (!ownedTeacherIds.has(String(teacherId))) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found",
          conflicts: [
            { type: "INVALID_TEACHER", message: "Teacher not found" },
          ],
        });
      }

      const roomNo = item.roomNo || "";

      docs.push({
        class: header.class,
        section: header.section,
        subjectGroup: item.subjectGroupId || undefined,
        day,
        subject: subjectId,
        teacher: teacherId,
        timeFrom: period.startTime,
        timeTo: period.endTime,
        roomNo,
        timetableHeader: header._id,
        periodId,
        academicYear: header.academicYear || undefined,
      });

      proposedAssignments.push({
        classId: header.class,
        sectionId: header.section,
        teacherId,
        roomNo,
        day,
        timeFrom: period.startTime,
        timeTo: period.endTime,
      });
    }

    // Rows for the same class/section that predate the header-based flow
    // (legacy rows with no timetableHeader) are replaced by this save. They
    // are ignored by the conflict checks below and removed once it succeeds.
    const legacyAssignments = await Timetable.find({
      class: header.class,
      section: header.section,
      // `{ timetableHeader: null }` already matches rows where the field is
      // missing, so the `$exists` clause is redundant.
      // $or: [{ timetableHeader: { $exists: false } }, { timetableHeader: null }],
      $or: [{ timetableHeader: null }],
    })
      .select("_id")
      .lean();

    const replaceableAssignmentIds = legacyAssignments.map((entry) => entry._id);

    const conflicts = [];

    if (proposedAssignments.length > 0) {
      // Conflicts between the submitted rows themselves.
      const internal = await validateTimetableConflicts({
        schoolId,
        proposedAssignments,
      });

      conflicts.push(...(internal.conflicts || []));

      // Conflicts against timetables of other classes/sections. Entries that
      // belong to this same header (or replaceable legacy rows of this
      // class/section) are excluded because they are replaced.
      //
      // When the caller is about to publish, this external pass is skipped
      // because POST /headers/:id/publish performs the same checks (and more)
      // as part of its full validation. That avoids validating twice.
      if (!skipConflictValidation) {
        const external = await validateTimetableConflictsBulk({
          schoolId,
          classId: header.class,
          sectionId: header.section,
          academicYearId: header.academicYear,
          excludeHeaderId: header._id,
          excludeAssignmentIds: replaceableAssignmentIds,
          proposedAssignments,
        });

        conflicts.push(...(external.conflicts || []));
      }
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: conflicts[0]?.message || "Timetable conflict",
        conflicts,
      });
    }

    // Reserve a new revision before touching assignments. A concurrent publish
    // validates against a specific revision, so bumping here makes its
    // conditional status write fail instead of publishing these new rows.
    await TimetableHeader.updateOne(
      { _id: header._id, schoolId },
      {
        $set: {
          updatedBy: currentUserId(req) || null,
          needsRebuild: false,
        },
        $inc: { version: 1 },
      }
    );

    // Replace this header's entries plus any stale legacy rows for the same
    // class/section in one pass.
    const deleted = await Timetable.deleteMany({
      class: header.class,
      section: header.section,
      $or: [{ timetableHeader: header._id }, { timetableHeader: null }],
    });

    let saved = 0;

    if (docs.length > 0) {
      const inserted = await Timetable.insertMany(docs);
      saved = inserted.length;
    }

    await recordTimetableAudit({
      header,
      schoolId,
      action: "ENTRIES_SAVED",
      userId: currentUserId(req),
      version: (header.version || 1) + 1,
      details: {
        saved,
        replaced: deleted.deletedCount || 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timetable entries saved",
      data: { saved, replaced: deleted.deletedCount || 0, needsRebuild: false },
    });
  } catch (error) {
    return handleControllerError(res, error, "saving timetable header entries");
  }
};

const populateHeaderById = (id, schoolId) =>
  TimetableHeader.findById(id)
    .populate({ path: "class", match: { schoolId }, select: "name" })
    .populate({ path: "section", match: { schoolId }, select: "name" })
    .populate("academicYear", "label startDate endDate isActive");

// Publish is a validate-then-write operation guarded by the header revision.
// Every mutation of the timetable bumps `version`, so if the timetable changes
// between validation and the status write the conditional update fails and the
// caller gets a retryable 409 instead of publishing unvalidated content.
const publishValidatedHeader = async ({ header, schoolId, userId }) => {
  const validation = await validateTimetableForHeader({ header, schoolId });

  if (!validation.canPublish) {
    return { validation, published: null, stale: false };
  }

  const expectedVersion = header.version || 1;

  // Legacy headers may not have a persisted version yet.
  if (header.version === undefined || header.version === null) {
    await TimetableHeader.updateOne(
      { _id: header._id, version: { $exists: false } },
      { $set: { version: expectedVersion } }
    );
  }

  const published = await TimetableHeader.findOneAndUpdate(
    { _id: header._id, schoolId, version: expectedVersion },
    {
      $set: { status: "PUBLISHED", updatedBy: userId || null },
      $inc: { version: 1 },
    },
    { new: true }
  );

  if (published) {
    await recordTimetableAudit({
      header: published,
      schoolId,
      action: "PUBLISHED",
      userId,
      version: published.version,
      details: {
        summary: validation.summary,
        warnings: validation.warnings,
      },
    });
  }

  return { validation, published, stale: !published };
};

const conflictPublishResponse = (res, validation) =>
  res.status(409).json({
    success: false,
    code: "TIMETABLE_HAS_CONFLICTS",
    message:
      validation.conflicts[0]?.message ||
      "This timetable has conflicts and cannot be published.",
    canPublish: false,
    conflicts: validation.conflicts,
    hardConflicts: validation.hardConflicts,
    warnings: validation.warnings,
    summary: validation.summary,
  });

const stalePublishResponse = (res) =>
  res.status(409).json({
    success: false,
    code: "TIMETABLE_CHANGED",
    message:
      "This timetable changed while it was being published. Reload and try again.",
    canPublish: false,
  });

const moveErrorResponse = (res, error) =>
  res.status(error.status || 400).json({
    success: false,
    message: error.message,
    conflicts: error.conflicts || [],
  });

exports.moveTimetableAssignment = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const result = await moveAssignment({
      header,
      schoolId,
      body: req.body || {},
      userId: currentUserId(req),
    });

    if (result.error) return moveErrorResponse(res, result.error);

    await recordTimetableAudit({
      header,
      schoolId,
      action: result.data?.swapped ? "ASSIGNMENT_SWAPPED" : "ASSIGNMENT_MOVED",
      userId: currentUserId(req),
      version: (header.version || 1) + 1,
      details: result.data,
    });

    return res.status(200).json({
      success: true,
      message: "Timetable assignment moved",
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(res, error, "moving timetable assignment");
  }
};

exports.moveTimetableSeries = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const result = await moveSeries({
      header,
      schoolId,
      body: req.body || {},
      userId: currentUserId(req),
    });

    if (result.error) return moveErrorResponse(res, result.error);

    await recordTimetableAudit({
      header,
      schoolId,
      action: "ASSIGNMENTS_MOVED_SERIES",
      userId: currentUserId(req),
      version: (header.version || 1) + 1,
      details: result.data,
    });

    return res.status(200).json({
      success: true,
      message: "Timetable moved across the selected weekdays",
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "moving timetable across weekdays"
    );
  }
};

// Validate-only helper; the builder publishes through POST /headers/:id/publish.
// Kept commented for reference.
/*
exports.validateTimetableHeader = async (req, res) => {  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const validation = await validateTimetableForHeader({ header, schoolId });

    return res.status(200).json({
      success: true,
      message: validation.canPublish
        ? "Timetable is ready to publish"
        : "Timetable has conflicts that block publishing",
      ...validation,
    });
  } catch (error) {
    return handleControllerError(res, error, "validating timetable");
  }
};
*/

exports.publishTimetableHeader = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid header id" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    const { validation, published } = await publishValidatedHeader({
      header,
      schoolId,
      userId: currentUserId(req),
    });

    if (!published) {
      if (!validation.canPublish) return conflictPublishResponse(res, validation);
      return stalePublishResponse(res);
    }

    const populated = await populateHeaderById(published._id, schoolId);

    return res.status(200).json({
      success: true,
      message: "Timetable published",
      data: populated,
      canPublish: true,
      warnings: validation.warnings,
      summary: validation.summary,
    });
  } catch (error) {
    return handleControllerError(res, error, "publishing timetable");
  }
};

exports.updateTimetableHeaderStatus = async (req, res) => {
  const schoolId = requireSchool(req, res);
  if (!schoolId) return;

  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid header id" });
    }

    if (!["DRAFT", "PUBLISHED"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status must be DRAFT or PUBLISHED" });
    }

    const header = await TimetableHeader.findOne({ _id: id, schoolId });

    if (!header) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable header not found" });
    }

    // Publishing is handled by POST /headers/:id/publish. Kept commented for
    // backwards reference instead of removed.
    /*
    if (status === "PUBLISHED") {
      const { validation, published } = await publishValidatedHeader({
        header,
        schoolId,
        userId: currentUserId(req),
      });

      if (!published) {
        if (!validation.canPublish) {
          return conflictPublishResponse(res, validation);
        }
        return stalePublishResponse(res);
      }

      const populated = await populateHeaderById(published._id, schoolId);

      return res.status(200).json({
        success: true,
        message: "Timetable published",
        data: populated,
        canPublish: true,
        warnings: validation.warnings,
        summary: validation.summary,
      });
    }
    */

    // The publish branch above is disabled, so refuse PUBLISHED here instead of
    // silently falling through and saving the timetable as a draft.
    if (status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "status must be DRAFT. Use POST /headers/:id/publish to publish.",
      });
    }

    const updated = await TimetableHeader.findOneAndUpdate(
      { _id: header._id, schoolId },
      {
        $set: { status: "DRAFT", updatedBy: currentUserId(req) || null },
        $inc: { version: 1 },
      },
      { new: true }
    );

    await recordTimetableAudit({
      header: updated,
      schoolId,
      action: "UNPUBLISHED",
      userId: currentUserId(req),
      version: updated.version,
    });

    const populated = await populateHeaderById(updated._id, schoolId);

    return res.status(200).json({
      success: true,
      message: "Timetable saved as draft",
      data: populated,
    });
  } catch (error) {
    return handleControllerError(res, error, "updating timetable status");
  }
};