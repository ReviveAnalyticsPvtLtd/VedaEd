const JobVacancy = require("./JobVacancy");
const JobApplication = require("./JobApplication");
const JobInterview = require("./JobInterview");
const User = require("../../models/User");
const Staff = require("../staff/staffModels");

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const totalVacancies = await JobVacancy.countDocuments({ schoolId, status: { $ne: "Closed" } });
        const applications = await JobApplication.countDocuments({ schoolId });
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const interviewToday = await JobInterview.countDocuments({
            schoolId,
            interviewDate: { $gte: startOfDay, $lte: endOfDay }
        });
        const selectedCandidates = await JobApplication.countDocuments({ schoolId, status: "Selected" });
        const trainingPending = await JobApplication.countDocuments({ schoolId, trainingStatus: "Pending" });
        const joinedStaff = await JobApplication.countDocuments({ schoolId, status: "Joined" });

        res.status(200).json({
            success: true,
            data: { totalVacancies, applications, interviewToday, selectedCandidates, trainingPending, joinedStaff }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Vacancy Controllers
exports.createVacancy = async (req, res) => {
    try {
        const vacancy = new JobVacancy({ ...req.body, schoolId: req.user.schoolId });
        await vacancy.save();
        res.status(201).json({ success: true, data: vacancy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getJoinedCountByVacancy = async (schoolId, vacancyIds) => {
    if (!vacancyIds.length) return {};
    const joined = await JobApplication.find({
        schoolId,
        status: "Joined",
        vacancy: { $in: vacancyIds }
    }).select("vacancy");
    const counts = {};
    joined.forEach((app) => {
        const key = String(app.vacancy);
        counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
};

exports.getVacancies = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const vacancies = await JobVacancy.find({ schoolId }).sort({ createdAt: -1 });
        const joinedCounts = await getJoinedCountByVacancy(schoolId, vacancies.map((v) => v._id));
        const data = vacancies.map((v) => {
            const filled = joinedCounts[String(v._id)] || 0;
            const remaining = Math.max((v.openings || 1) - filled, 0);
            return { ...v.toObject(), filled, remaining, isFilled: remaining <= 0 };
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateVacancy = async (req, res) => {
    try {
        const vacancy = await JobVacancy.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            req.body,
            { new: true }
        );
        if (!vacancy) return res.status(404).json({ success: false, message: "Vacancy not found" });
        res.status(200).json({ success: true, data: vacancy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Application Controllers
exports.createApplication = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const vacancy = await JobVacancy.findOne({ _id: req.body.vacancy, schoolId });
        if (!vacancy) return res.status(404).json({ success: false, message: "Vacancy not found" });
        const application = new JobApplication({ ...req.body, schoolId });
        await application.save();
        res.status(201).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find({ schoolId: req.user.schoolId })
            .populate("vacancy")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await JobApplication.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { status },
            { new: true }
        );
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateTrainingStatus = async (req, res) => {
    try {
        const { trainingStatus, trainingChecklist } = req.body;
        const application = await JobApplication.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { trainingStatus, trainingChecklist },
            { new: true }
        );
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Interview Controllers
exports.scheduleInterview = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const application = await JobApplication.findOne({ _id: req.params.applicationId, schoolId });
        if (!application) return res.status(404).json({ success: false, message: "Application not found" });
        const interview = new JobInterview({ ...req.body, application: application._id, schoolId });
        await interview.save();
        await JobApplication.findOneAndUpdate({ _id: application._id, schoolId }, { status: "Interview Round 1" });
        res.status(201).json({ success: true, data: interview });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getInterviews = async (req, res) => {
    try {
        const interviews = await JobInterview.find({ schoolId: req.user.schoolId }).populate({
            path: 'application',
            populate: { path: 'vacancy' }
        }).sort({ interviewDate: 1 });
        res.status(200).json({ success: true, data: interviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitInterviewScore = async (req, res) => {
    try {
        const { scorecard, overallRating, status } = req.body;
        const interview = await JobInterview.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.user.schoolId },
            { scorecard, overallRating, status },
            { new: true }
        );
        if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });
        res.status(200).json({ success: true, data: interview });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Final Conversion
exports.convertToEmployee = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const application = await JobApplication.findOne({ _id: req.params.id, schoolId }).populate("vacancy");
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        if (application.status === "Joined") {
            return res.status(409).json({ success: false, message: "Already converted to staff" });
        }

        const existing = await User.findOne({ email: application.email });
        if (existing) {
            return res.status(409).json({ success: false, message: "An account with this email already exists" });
        }

        if (application.vacancy) {
            const filled = await JobApplication.countDocuments({
                schoolId,
                status: "Joined",
                vacancy: application.vacancy._id
            });
            if (filled >= (application.vacancy.openings || 1)) {
                return res.status(409).json({ success: false, message: "Vacancy is already filled" });
            }
        }

        const roleName = application.roleType === "Teaching" ? "teacher" : "staff";
        const roleDoc = await require("../../models/Role").findOne({ name: roleName });
        if (!roleDoc) {
            return res.status(500).json({ success: false, message: `Role "${roleName}" is not seeded` });
        }

        // Support Staff conversions (guard, cleaner, sweeper...) produce a
        // login-less Staff record whose designation is the vacancy's job
        // title, so the person shows up in the Support Staff module.
        const isSupportRole = application.roleType === "Support Staff";
        const staffRole = application.roleType === "Teaching" ? "Teacher" : "Other";
        const staffId = await require("../staff/staffControllers").generateStaffId(schoolId);

        const newStaff = await Staff.create({
            schoolId,
            status: "Active",
            joiningDate: new Date(),
            personalInfo: {
                name: application.applicantName,
                staffId,
                username: `${staffRole}_${staffId}`,
                role: staffRole,
                ...(isSupportRole ? { designation: application.vacancy?.jobTitle || "Support Staff" } : {}),
                department: application.vacancy?.department || "General",
                email: application.email,
                password: "password123",
                mobileNumber: application.mobile,
            },
        });

        let newUser = null;
        if (!isSupportRole) {
            newUser = await User.create({
                name: application.applicantName,
                email: application.email,
                password: "password123",
                roleId: roleDoc._id,
                refId: newStaff._id,
                schoolId,
                status: "active",
            });
        }

        application.status = "Joined";
        await application.save();

        if (application.vacancy) {
            const filled = await JobApplication.countDocuments({
                schoolId,
                status: "Joined",
                vacancy: application.vacancy._id
            });
            if (filled >= (application.vacancy.openings || 1)) {
                await JobVacancy.updateOne(
                    { _id: application.vacancy._id, schoolId },
                    { status: "Closed" }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: isSupportRole
                ? "Converted to Support Staff successfully (no login account created)"
                : "Converted to Employee successfully",
            user: newUser,
            staff: newStaff,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
