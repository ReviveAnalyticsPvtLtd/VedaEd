const mongoose = require("mongoose");
const EntranceExam = require("./entranceExamModel");
const AdmissionApplication = require("./admissionApplicationModel");

/**
 * Tenant context is resolved by authMiddleware from the authenticated User
 * document. It is never read from the request payload.
 */
const requireSchool = (req, res) => {
    const schoolId = req.user?.schoolId;
    if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) {
        res.status(403).json({
            success: false,
            code: "NO_SCHOOL_CONTEXT",
            message: "Your account is not linked to a school.",
        });
        return null;
    }
    return String(schoolId);
};

/**
 * Resolve an applicant to this school. An application belonging to another
 * school is deliberately indistinguishable from one that does not exist, so a
 * caller cannot probe for or write onto a foreign application by ObjectId.
 */
const findOwnApplication = (applicationIdRef, schoolId) =>
    AdmissionApplication.findOne({ _id: applicationIdRef, schoolId }).select("_id");

const formatClassLabel = (value) => {
    const normalized = String(value || "")
        .replace(/^(class\s*)+/i, "")
        .trim();

    return normalized ? `Class ${normalized}` : "Unknown";
};

const isDeclaredResult = (value) =>
    value === "Qualified" || value === "Disqualified";

const resolveExamOutcome = ({ currentAttendance, currentResult, nextAttendance, nextResult }) => {
    const attendance = nextAttendance ?? currentAttendance ?? "Pending";
    let result = nextResult ?? currentResult ?? "Not Declared";

    // Result is only applicable when attendance is Present.
    if (attendance !== "Present") {
        result = "Not Declared";
    }

    const status =
        attendance === "Present" && isDeclaredResult(result)
            ? "Completed"
            : "Scheduled";

    return { attendance, result, status };
};

// Get all candidates (Applications merged with Exam details)
exports.getEntranceCandidates = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // 1. Get all applications
        // You might want to filter by status if needed, e.g., only "Pending" or "Document Verified" applications
        const applications = await AdmissionApplication.find({ schoolId }).sort({ createdAt: -1 });

        // 2. Get all scheduled exams
        const exams = await EntranceExam.find({ schoolId });

        // 3. Map exams by applicationId for easy lookup
        const examMap = {};
        exams.forEach(exam => {
            examMap[exam.applicationId.toString()] = exam;
        });

        // 4. Merge data
        const candidates = applications.map(app => {
            const exam = examMap[app._id.toString()];
            return {
                _id: exam ? exam._id : null, // Exam ID if exists
                applicationIdRef: app._id,
                applicationId: app.applicationId, // The readable ID (e.g., APP-2026-001)
                name: app.personalInfo?.name || "Unknown",
                guardianName: app.parents?.father?.name || app.parents?.mother?.name || app.parents?.guardian?.name || "",
                mobile: app.contactInfo?.phone,
                email: app.contactInfo?.email,
                classApplied: formatClassLabel(
                    app.personalInfo?.classApplied || app.earlierAcademic?.lastClass
                ),
                // If we don't have exact 'classApplied' in Application, we might need to rely on what was submitted.
                // Looking at AdmissionApplicationModel, there isn't a direct 'classApplied' field at top level, 
                // but often it's in 'earlierAcademic.lastClass' or implied. 
                // For now, let's assume we might need to add 'classApplied' to AdmissionApplication or infer it.
                // Actually, let's check AdmissionForm frontend or model again if needed. 
                // For now I will use a placeholder or derived value.

                entranceDateTime: exam ? (exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] + ' ' + (exam.examTime || '') : "") : "",
                examiner: exam?.examiner || "",
                venue: exam?.venue || "",
                attendance: exam?.attendance || "Pending",
                status: exam?.status || "Pending",
                result: exam?.result || "Not Declared",
                examType: exam?.type || "",
            };
        });

        res.status(200).json(candidates);
    } catch (error) {
        console.error("Error fetching entrance candidates:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Schedule or Update Exam
exports.scheduleEntranceExam = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { applicationIdRef, date, time, duration, examiner, venue, type, sms, whatsapp, email } = req.body;

        // The applicant must belong to this school, otherwise the caller could
        // schedule an exam onto another school's application.
        const application = await findOwnApplication(applicationIdRef, schoolId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Check if exam exists
        let exam = await EntranceExam.findOne({ applicationId: applicationIdRef, schoolId });

        if (exam) {
            // Update
            exam.examDate = date;
            exam.examTime = time;
            exam.duration = duration;
            exam.examiner = examiner;
            exam.venue = venue;
            exam.type = type;
            exam.status = "Scheduled";
            await exam.save();
        } else {
            // Create
            exam = new EntranceExam({
                applicationId: applicationIdRef,
                schoolId,
                examDate: date,
                examTime: time,
                duration,
                examiner,
                venue,
                type,
                status: "Scheduled"
            });
            await exam.save();
        }

        // TODO: Send Notifications (SMS, WhatsApp, Email) based on flags

        res.status(200).json({ message: "Entrance exam scheduled successfully", exam });
    } catch (error) {
        console.error("Error scheduling exam:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Result/Attendance
exports.updateEntranceResult = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { id } = req.params; // Entrance Exam ID (if we have it) or Application ID?
        // Safer to use Entrance Exam ID if we are editing an arbitrary row that has an ID. 
        // But rows without schedule don't have Exam ID.
        // Let's accept applicationIdRef as primary key if ID is missing.

        // Actually the frontend sends 'id' which might be our constructed ID.
        // If it's a new record (no exam yet), we can't update result usually (must schedule first).
        // But if we want to allow updating result directly, we need to treat it carefully.

        // For now assuming we update by Exam ID.
        const { result, attendance } = req.body;

        // Scoped lookup: an exam owned by another school is indistinguishable
        // from one that does not exist.
        const exam = await EntranceExam.findOne({ _id: id, schoolId });
        if (!exam) {
            return res.status(404).json({ message: "Exam record not found. Please schedule first." });
        }

        const outcome = resolveExamOutcome({
            currentAttendance: exam.attendance,
            currentResult: exam.result,
            nextAttendance: attendance,
            nextResult: result,
        });

        exam.attendance = outcome.attendance;
        exam.result = outcome.result;
        exam.status = outcome.status;

        await exam.save();
        res.status(200).json({ message: "Updated successfully", exam });
    } catch (error) {
        console.error("Error updating result:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.declareResult = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { applicationId, result, attendance } = req.body;

        // Find by applicationId string (which is stored in 'applicationId' field in schema? 
        // No, 'applicationId' in schema is the Ref ObjectId usually? 
        // Let's check schema/previous code.
        // In getEntranceCandidates: `applicationIdRef: app._id` and `applicationId: app.applicationId` (string).
        // schema uses `applicationId` as Ref/ObjectId usually?
        // Checking scheduleEntranceExam: `findOne({ applicationId: applicationIdRef })`
        // So `applicationId` in Schema is the ObjectId ref to Application.
        // The frontend sends `applicationId: student.applicationIdRef` to `declareResult`.
        // So we should search by `applicationId: applicationId`.

        // The applicant must belong to this school.
        const application = await findOwnApplication(applicationId, schoolId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        let exam = await EntranceExam.findOne({ applicationId, schoolId });

        const outcome = resolveExamOutcome({
            currentAttendance: exam?.attendance,
            currentResult: exam?.result,
            nextAttendance: attendance,
            nextResult: result,
        });

        if (!exam) {
            exam = new EntranceExam({
                applicationId,
                schoolId,
                status: outcome.status,
                result: outcome.result,
                attendance: outcome.attendance,
                examDate: new Date(),
                type: "Direct Entry"
            });
        } else {
            exam.result = outcome.result;
            exam.attendance = outcome.attendance;
            exam.status = outcome.status;
        }

        await exam.save();
        res.status(200).json({ message: "Result updated successfully", exam });

    } catch (error) {
        console.error("Error declaring result:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
