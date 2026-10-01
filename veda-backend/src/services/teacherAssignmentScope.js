const mongoose = require("mongoose");
const Staff = require("../modules/staff/staffModels");
const Class = require("../modules/class/classSchema");
const AssignTeacher = require("../modules/assignTeachersToClass/assignTeacherSchema");

/**
 * Resolves which class/section pairs the authenticated teacher owns, scoped to
 * the caller's school.
 *
 * AssignTeacher has no schoolId field of its own, so it is anchored through its
 * Class ref: only classes belonging to the authenticated school are ever
 * considered. A teacher who is not a Staff record of that school resolves to no
 * pairs at all, so a manipulated refId can never surface another school's
 * students.
 *
 * This mirrors the lookup already used by activityController and
 * staffControllers so every teacher-scoped query agrees on one definition.
 *
 * @param {*} teacherStaffId Staff._id carried on req.user.refId
 * @param {string} schoolId   authoritative tenant from req.user.schoolId
 * @returns {Promise<{teacherFound: boolean, pairs: Array<{class:*, section:*}>}>}
 */
const getTeacherRosterScope = async (teacherStaffId, schoolId) => {
  const empty = { teacherFound: false, pairs: [] };

  if (
    !teacherStaffId ||
    !schoolId ||
    !mongoose.isValidObjectId(String(schoolId))
  ) {
    return empty;
  }

  // Prove the teacher belongs to this school before trusting their refId.
  const teacher = await Staff.findOne({ _id: teacherStaffId, schoolId })
    .select("_id")
    .lean();
  if (!teacher) {
    return empty;
  }

  const classIds = (await Class.find({ schoolId }).select("_id").lean()).map(
    (c) => c._id
  );
  if (!classIds.length) {
    return { teacherFound: true, pairs: [] };
  }
    
  const assignments = await AssignTeacher.find({
    class: { $in: classIds },
    $or: [{ teachers: teacherStaffId }, { classTeacher: teacherStaffId }],
  })
    .select("class section")
    .lean();

  return {
    teacherFound: true,
    pairs: assignments
      .filter((a) => a.class && a.section)
      .map((a) => ({ class: a.class, section: a.section })),
  };
};

module.exports = { getTeacherRosterScope };