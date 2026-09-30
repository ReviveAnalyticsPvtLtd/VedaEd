const Gradebook = require("./gradebookModel");
const Student = require("../student/studentModels");
const Class = require("../class/classSchema");
const Section = require("../section/sectionSchema");
const Subject = require("../subject/subjectSchema");
const mongoose = require("mongoose");

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

// Gradebook has no schoolId of its own, so every lookup is anchored to the
// Class/Section/Subject/Student documents it references.
const findOwnedClass = (classId, schoolId) => Class.findOne({ _id: classId, schoolId }).select("_id");
const findOwnedSection = (sectionId, schoolId) => Section.findOne({ _id: sectionId, schoolId }).select("_id");
const findOwnedSubject = (subjectId, schoolId) => Subject.findOne({ _id: subjectId, schoolId }).select("_id");

// Save or Update Marks for Multiple Students
exports.saveMarks = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const {
            classId,
            sectionId,
            subjectId,
            academicYear,
            term,
            studentMarks, // Array of { studentId, marks: [ { unitIndex, theory, practical } ] }
            isLocked
        } = req.body;

        if (!classId || !sectionId || !subjectId || !academicYear || !term || !studentMarks) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
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

        const studentIds = [...new Set(studentMarks.map((item) => String(item.studentId)))];
        const ownedStudents = await Student.find({ _id: { $in: studentIds }, schoolId }).select("_id");
        if (ownedStudents.length !== studentIds.length) {
            return res.status(404).json({ success: false, message: "Some students not found" });
        }

        const operations = studentMarks.map(item => ({
            updateOne: {
                filter: {
                    student: item.studentId,
                    class: classId,
                    section: sectionId,
                    subject: subjectId,
                    term,
                    academicYear
                },
                update: {
                    $set: {
                        marks: item.marks,
                        isLocked: isLocked || false
                    }
                },
                upsert: true
            }
        }));

        await Gradebook.bulkWrite(operations);

        res.status(200).json({ success: true, message: "Marks saved successfully" });
    } catch (error) {
        console.error("Error saving marks:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get Marks for a Class, Section, Subject, and Term
exports.getMarks = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { classId, sectionId, subjectId, academicYear, term } = req.query;

        if (!classId || !sectionId || !academicYear || !term) {
            return res.status(400).json({ success: false, message: "Missing query parameters" });
        }

        if (!(await findOwnedClass(classId, schoolId))) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        if (!(await findOwnedSection(sectionId, schoolId))) {
            return res.status(404).json({ success: false, message: "Section not found" });
        }

        if (subjectId && !(await findOwnedSubject(subjectId, schoolId))) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        const query = {
            class: classId,
            section: sectionId,
            academicYear,
            term
        };

        if (subjectId) {
            query.subject = subjectId;
        }

        const marks = await Gradebook.find(query)
            .populate({ path: "student", match: { schoolId }, select: "personalInfo.name personalInfo.rollNo" })
            .populate({ path: "subject", match: { schoolId }, select: "subjectName" });

        res.status(200).json({ success: true, marks });
    } catch (error) {
        console.error("Error fetching marks:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get Students for Gradebook Entry (Filtered by Class and Section)
exports.getStudentsForGradebook = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { className, sectionName } = req.query;

        if (!className || !sectionName) {
            return res.status(400).json({ success: false, message: "Class and Section names are required" });
        }

        const existClass = await Class.findOne({ name: className, schoolId });
        const existSection = await Section.findOne({ name: sectionName, schoolId });

        if (!existClass || !existSection) {
            return res.status(404).json({ success: false, message: "Class or Section not found" });
        }

        const students = await Student.find({
            "personalInfo.class": existClass._id,
            "personalInfo.section": existSection._id,
            "personalInfo.status": "Active",
            schoolId,
        }).select("personalInfo.name personalInfo.rollNo _id");

        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error("Error fetching students for gradebook:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
