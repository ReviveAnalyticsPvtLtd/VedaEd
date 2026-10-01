const mongoose = require("mongoose");
const Interview = require("./interviewModel");
const AdmissionApplication = require("./admissionApplicationModel");
const EntranceExam = require("./entranceExamModel");

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

const isDeclaredResult = (value) =>
    value === "Qualified" || value === "Disqualified";

const resolveInterviewOutcome = ({ currentAttendance, currentResult, nextAttendance, nextResult }) => {
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

// Get all candidates (Applications merged with Interview details)
exports.getInterviewCandidates = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // 1. Fetch only applications with a Qualified entrance result
        const qualifiedExamRecords = await EntranceExam.find(
            { result: "Qualified", schoolId },
            { applicationId: 1 }
        );
        const qualifiedApplicationIds = qualifiedExamRecords.map((exam) => exam.applicationId);

        const applications = await AdmissionApplication.find({
            _id: { $in: qualifiedApplicationIds },
            schoolId
        }).sort({ createdAt: -1 });

        // 2. Get all scheduled interviews
        const interviews = await Interview.find({ schoolId });

        // 3. Map by applicationId
        const interviewMap = {};
        interviews.forEach(int => {
            interviewMap[int.applicationId.toString()] = int;
        });

        // 4. Merge
        const candidates = applications.map(app => {
            const interview = interviewMap[app._id.toString()];
            return {
                _id: interview ? interview._id : null,
                applicationIdRef: app._id,
                applicationId: app.applicationId,
                name: app.personalInfo?.name || "Unknown",
                guardianName: app.parents?.father?.name || app.parents?.mother?.name || "",
                mobile: app.contactInfo?.phone,
                email: app.contactInfo?.email,
                classApplied: app.personalInfo?.classApplied
                    ? `Class ${app.personalInfo.classApplied}`
                    : app.earlierAcademic?.lastClass
                        ? `Class ${app.earlierAcademic.lastClass}`
                        : "Unknown",

                interviewDateTime: interview ? (interview.interviewDate ? new Date(interview.interviewDate).toISOString().split('T')[0] + ' ' + (interview.interviewTime || '') : "") : "",
                interviewer: interview?.interviewer || "",
                venue: interview?.venue || "",
                attendance: interview?.attendance || "Pending",
                status: interview?.status || "Pending",
                result: interview?.result || "Not Declared",
                interviewType: interview?.type || "",
            };
        });

        res.status(200).json(candidates);
    } catch (error) {
        console.error("Error fetching interview candidates:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Schedule or Update Interview
exports.scheduleInterview = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { applicationIdRef, date, time, duration, teacher, venue, type, sms, whatsapp, email } = req.body;

        // The applicant must belong to this school, otherwise the caller could
        // schedule an interview onto another school's application.
        const application = await findOwnApplication(applicationIdRef, schoolId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        let interview = await Interview.findOne({ applicationId: applicationIdRef, schoolId });

        if (interview) {
            interview.interviewDate = date;
            interview.interviewTime = time;
            interview.duration = duration;
            interview.interviewer = teacher;
            interview.venue = venue;
            interview.type = type;
            interview.status = "Scheduled";
            await interview.save();
        } else {
            interview = new Interview({
                applicationId: applicationIdRef,
                schoolId,
                interviewDate: date,
                interviewTime: time,
                duration,
                interviewer: teacher,
                venue,
                type,
                status: "Scheduled"
            });
            await interview.save();
        }

        res.status(200).json({ message: "Interview scheduled successfully", interview });
    } catch (error) {
        console.error("Error scheduling interview:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Result
exports.updateInterviewResult = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const { id } = req.params;
        const { result, attendance } = req.body;

        // Scoped lookup: an interview owned by another school is
        // indistinguishable from one that does not exist.
        const interview = await Interview.findOne({ _id: id, schoolId });
        if (!interview) {
            return res.status(404).json({ message: "Interview record not found. Please schedule first." });
        }

        const outcome = resolveInterviewOutcome({
            currentAttendance: interview.attendance,
            currentResult: interview.result,
            nextAttendance: attendance,
            nextResult: result,
        });

        interview.attendance = outcome.attendance;
        interview.result = outcome.result;
        interview.status = outcome.status;

        await interview.save();
        res.status(200).json({ message: "Updated successfully", interview });
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

        // The applicant must belong to this school.
        const application = await findOwnApplication(applicationId, schoolId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        let interview = await Interview.findOne({ applicationId, schoolId });

        const outcome = resolveInterviewOutcome({
            currentAttendance: interview?.attendance,
            currentResult: interview?.result,
            nextAttendance: attendance,
            nextResult: result,
        });

        if (!interview) {
            interview = new Interview({
                applicationId,
                schoolId,
                status: outcome.status,
                result: outcome.result,
                attendance: outcome.attendance,
                interviewDate: new Date(),
                type: "Direct Entry"
            });
        } else {
            interview.result = outcome.result;
            interview.attendance = outcome.attendance;
            interview.status = outcome.status;
        }

        await interview.save();
        res.status(200).json({ message: "Result updated successfully", interview });

    } catch (error) {
        console.error("Error declaring result:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
