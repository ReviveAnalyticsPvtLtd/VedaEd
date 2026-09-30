const mongoose = require("mongoose");
const Activity = require("./activityModel");
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");
const Staff = require("../staff/staffModels");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");

const normalizeId = (value) => (value ? value.toString() : "");

/** Admin-owned or legacy (no metadata) — teachers must not change these. */
const isAdminOwnedActivity = (activity) => {
    if (!activity) return true;
    if (!activity.createdBy) return true;
    const r = String(activity.createdBy.role || "").toLowerCase();
    if (!r) return true;
    return r === "admin";
};

const toObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const parseClassIds = (value) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return list
        .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
        .filter(Boolean);
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Tenant context is resolved by authMiddleware from the authenticated User
// document. It is never read from the request payload.
const requireSchool = (req, res) => {
    if (!req.user?.schoolId || !mongoose.isValidObjectId(String(req.user.schoolId))) {
        res.status(403).json({
            success: false,
            message: "Your account is not linked to a school.",
        });
        return null;
    }
    return String(req.user.schoolId);
};

const getSchoolClassIds = async (schoolId) =>
    (await Class.find({ schoolId }).select("_id")).map((c) => c._id);

const activityClassLabels = (activity) => {
    if (Array.isArray(activity.class)) {
        return activity.class.map((c) => String(c).trim()).filter(Boolean);
    }
    if (activity.class != null && activity.class !== "") {
        return [String(activity.class).trim()];
    }
    return [];
};

/**
 * Admin/SIS forms often store class as short numeric labels ("9") while Student.class.name
 * is the canonical Class document name ("Grade 9"). Teacher-created rows use classIds + names from DB.
 */
const isActivityVisibleToStudent = (activity, studentClassId, studentSectionId, studentClassName, studentSectionName) => {
    const classArr = activityClassLabels(activity);
    const classIdMatch =
        Array.isArray(activity.classIds) && activity.classIds.some((id) => normalizeId(id) === studentClassId);
    const classNameMatch =
        Boolean(studentClassName) &&
        classArr.some((c) => c.toLowerCase() === String(studentClassName).trim().toLowerCase());
    const classIdStringMatch = classArr.some(
        (c) => mongoose.Types.ObjectId.isValid(c) && normalizeId(c) === studentClassId
    );
    const numericTokens = studentClassName ? String(studentClassName).match(/\b\d{1,2}\b/g) || [] : [];
    const numericLabelMatch = classArr.some((c) => /^\d{1,2}$/.test(c) && numericTokens.includes(c));

    const classMatch = classIdMatch || classNameMatch || classIdStringMatch || numericLabelMatch;

    const sectionAll = String(activity.section || "").trim().toLowerCase() === "all";
    const sectionIdMatch = activity.sectionId && normalizeId(activity.sectionId) === studentSectionId;
    const sectionNameMatch =
        Boolean(studentSectionName) &&
        String(activity.section || "").trim().toLowerCase() === String(studentSectionName).trim().toLowerCase();
    const sectionMatch = sectionAll || sectionIdMatch || sectionNameMatch;
    return classMatch && sectionMatch;
};

/** Resolve legacy admin class/section strings to ObjectIds when missing (SIS Activity Report uses "6".."10"). */
const normalizeAdminActivityClassSection = async (payload, schoolId) => {
    const labels = Array.isArray(payload.class) ? payload.class.map((x) => String(x).trim()).filter(Boolean) : [];
    if (labels.length && (!payload.classIds || payload.classIds.length === 0)) {
        const allClasses = await Class.find({ schoolId }).select("name");
        const ids = [];
        for (const t of labels) {
            let found = allClasses.find((c) => (c.name || "").trim().toLowerCase() === t.toLowerCase());
            if (!found && /^\d{1,2}$/.test(t)) {
                found = allClasses.find((c) => {
                    const tokens = String(c.name || "").match(/\b\d{1,2}\b/g) || [];
                    return tokens.includes(t);
                });
            }
            if (found) ids.push(found._id);
        }
        if (ids.length) {
            const unique = [...new Set(ids.map((id) => id.toString()))];
            payload.classIds = unique.map((id) => new mongoose.Types.ObjectId(id));
        }
    }

    const secRaw = payload.section != null ? String(payload.section).trim() : "";
    if (secRaw && secRaw.toLowerCase() !== "all" && !payload.sectionId) {
        const sec = await Section.findOne({ name: new RegExp(`^${escapeRegex(secRaw)}$`, "i"), schoolId });
        if (sec) payload.sectionId = sec._id;
    }
};

const getTeacherAssignments = async (teacherId, schoolId) => {
    // AssignTeacher has no schoolId, so it is reached only through Class documents
    // that are proven to belong to the caller's school, and only for a teacher
    // who is themselves in that school.
    const teacher = await Staff.findOne({ _id: teacherId, schoolId }).select("_id");
    if (!teacher) return [];

    const classIds = await getSchoolClassIds(schoolId);
    if (!classIds.length) return [];

    const assignments = await AssignTeacher.find({
        class: { $in: classIds },
        $or: [{ classTeacher: teacherId }, { teachers: teacherId }],
    })
        .populate("class", "name")
        .populate("section", "name")
        .populate("teachers", "personalInfo.name")
        .populate("classTeacher", "personalInfo.name");
    return assignments;
};

exports.getAllActivities = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const user = req.user || {};
        const role = (user.role || "").toLowerCase();
        let activities = [];

        if (role === "teacher") {
            activities = await Activity.find({
                $or: [
                    { "createdBy.role": "admin" },
                    { "createdBy.refId": user.refId || null },
                    { createdBy: { $exists: false } }, // Keep legacy admin-created activities visible
                ],
            }).sort({ createdAt: -1 });
        } else if (role === "student") {
            const student = await Student.findOne({ _id: user.refId, schoolId })
                .populate("personalInfo.class", "name")
                .populate("personalInfo.section", "name");

            if (!student?.personalInfo?.class || !student?.personalInfo?.section) {
                return res.status(200).json([]);
            }

            const studentClassId = normalizeId(student.personalInfo.class._id);
            const studentSectionId = normalizeId(student.personalInfo.section._id);
            const studentClassName = student.personalInfo.class.name;
            const studentSectionName = student.personalInfo.section.name;

            const allActivities = await Activity.find().sort({ createdAt: -1 });
            activities = allActivities.filter((a) =>
                isActivityVisibleToStudent(a, studentClassId, studentSectionId, studentClassName, studentSectionName)
            );
        } else if (role === "parent") {
            const parent = await Parent.findOne({ _id: user.refId, schoolId })
                .populate({
                    path: "children",
                    populate: [
                        { path: "personalInfo.class", select: "name" },
                        { path: "personalInfo.section", select: "name" },
                    ],
                });
            if (!parent?.children?.length) {
                return res.status(200).json([]);
            }

            const targets = parent.children
                .map((child) => ({
                    classId: normalizeId(child.personalInfo?.class?._id),
                    sectionId: normalizeId(child.personalInfo?.section?._id),
                    className: child.personalInfo?.class?.name,
                    sectionName: child.personalInfo?.section?.name,
                }))
                .filter((t) => t.classId && t.sectionId && t.className && t.sectionName);

            const allActivities = await Activity.find().sort({ createdAt: -1 });
            activities = allActivities.filter((a) =>
                targets.some((t) =>
                    isActivityVisibleToStudent(a, t.classId, t.sectionId, t.className, t.sectionName)
                )
            );
        } else {
            activities = await Activity.find().sort({ createdAt: -1 });
        }

        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: "Error fetching activities", error: error.message });
    }
};

exports.createActivity = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const user = req.user || {};
        const role = (user.role || "").toLowerCase();
        const payload = { ...req.body };
        const classIds = parseClassIds(payload.classIds);
        const sectionId = toObjectId(payload.sectionId);

        if (role === "teacher") {
            const teacherAssignments = await getTeacherAssignments(user.refId, schoolId);
            const allowedPairs = teacherAssignments.map((assignment) => ({
                classId: normalizeId(assignment.class?._id),
                sectionId: normalizeId(assignment.section?._id),
                className: assignment.class?.name,
                sectionName: assignment.section?.name,
                teachers: assignment.teachers || [],
                classTeacher: assignment.classTeacher,
            }));

            if (!allowedPairs.length) {
                return res.status(403).json({ message: "Teacher has no assigned class-section" });
            }

            if (classIds.length !== 1 || !sectionId) {
                return res.status(400).json({
                    message: "Teacher must create activity for exactly one assigned class and section",
                });
            }

            const classIdStr = normalizeId(classIds[0]);
            const sectionIdStr = normalizeId(sectionId);
            const matched = allowedPairs.find((pair) => pair.classId === classIdStr && pair.sectionId === sectionIdStr);

            if (!matched) {
                return res.status(403).json({
                    message: "Teacher can create activities only for assigned class and section",
                });
            }

            payload.classIds = [classIds[0]];
            payload.sectionId = sectionId;
            payload.class = [matched.className];
            payload.section = matched.sectionName;
            payload.teachers = (matched.teachers || [])
                .map((teacher) => teacher?.personalInfo?.name)
                .filter(Boolean);
        } else {
            if (classIds.length) payload.classIds = classIds;
            if (sectionId) payload.sectionId = sectionId;
        }

        if (role !== "teacher") {
            await normalizeAdminActivityClassSection(payload, schoolId);
        }

        const creator =
            role === "teacher"
                ? await Staff.findOne({ _id: user.refId, schoolId }).select("personalInfo.name")
                : null;
        payload.createdBy = {
            role: role === "teacher" ? "teacher" : "admin",
            refId: user.refId || null,
            name: creator?.personalInfo?.name || "",
        };

        const newActivity = new Activity(payload);
        // Auto-update status based on winner presence like frontend logic, 
        // or just trust the posted status. Frontend logic: if winner.First.name exists -> Completed.
        // We can handle logic here or let frontend send it.
        // Let's rely on payload but simple check:
        if (newActivity.winner?.First?.name) {
            newActivity.status = "Completed";
        }

        await newActivity.save();
        res.status(201).json(newActivity);
    } catch (error) {
        res.status(500).json({ message: "Error creating activity", error: error.message });
    }
};

exports.updateActivity = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { id } = req.params;
        const user = req.user || {};
        const role = (user.role || "").toLowerCase();

        const existing = await Activity.findById(id).select("createdBy");
        if (!existing) {
            return res.status(404).json({ message: "Activity not found" });
        }

        if (role === "teacher" && isAdminOwnedActivity(existing)) {
            return res.status(403).json({ message: "Teachers cannot modify activities created by admin" });
        }

        const updates = req.body;

        // Logic to update status if winners are added
        if (updates.winner?.First?.name) {
            updates.status = "Completed";
        }

        const updatedActivity = await Activity.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedActivity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        res.status(200).json(updatedActivity);
    } catch (error) {
        res.status(500).json({ message: "Error updating activity", error: error.message });
    }
};

exports.deleteActivity = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { id } = req.params;
        const user = req.user || {};
        const role = (user.role || "").toLowerCase();

        const existing = await Activity.findById(id).select("createdBy");
        if (!existing) {
            return res.status(404).json({ message: "Activity not found" });
        }

        if (role === "teacher" && isAdminOwnedActivity(existing)) {
            return res.status(403).json({ message: "Teachers cannot delete activities created by admin" });
        }

        const deletedActivity = await Activity.findByIdAndDelete(id);

        if (!deletedActivity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting activity", error: error.message });
    }
};

exports.getTeacherActivityScope = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const user = req.user || {};
        if ((user.role || "").toLowerCase() !== "teacher") {
            return res.status(403).json({ message: "Only teacher can access this endpoint" });
        }

        const assignments = await getTeacherAssignments(user.refId, schoolId);
        const classOptionsMap = new Map();
        const sectionOptionsMap = new Map();
        let teachers = [];

        assignments.forEach((assignment) => {
            if (assignment.class?._id) {
                classOptionsMap.set(normalizeId(assignment.class._id), {
                    _id: assignment.class._id,
                    name: assignment.class.name,
                });
            }
            if (assignment.section?._id) {
                sectionOptionsMap.set(normalizeId(assignment.section._id), {
                    _id: assignment.section._id,
                    name: assignment.section.name,
                });
            }
            teachers = teachers.concat(
                (assignment.teachers || []).map((teacher) => teacher?.personalInfo?.name).filter(Boolean)
            );
        });

        // Teacher dropdown should show all teachers in system, not only assigned/class teachers.
        const allTeacherStaff = await Staff.find({ "personalInfo.role": "Teacher", schoolId }).select("personalInfo.name");
        const allTeacherNames = allTeacherStaff
            .map((teacher) => teacher?.personalInfo?.name)
            .filter(Boolean);

        res.status(200).json({
            classOptions: Array.from(classOptionsMap.values()),
            sectionOptions: Array.from(sectionOptionsMap.values()),
            teachers: Array.from(new Set([...teachers, ...allTeacherNames])),
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching teacher activity scope", error: error.message });
    }
};
