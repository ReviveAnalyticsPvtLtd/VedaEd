const JobVacancy = require("./JobVacancy");
const JobApplication = require("./JobApplication");
const JobInterview = require("./JobInterview");
const User = require("../../models/User");
const Staff = require("../staff/staffModels");
const bcrypt = require("bcrypt");

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalVacancies = await JobVacancy.countDocuments({ status: { $ne: "Closed" } });
        const applications = await JobApplication.countDocuments();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const interviewToday = await JobInterview.countDocuments({
            interviewDate: { $gte: startOfDay, $lte: endOfDay }
        });
        const selectedCandidates = await JobApplication.countDocuments({ status: "Selected" });
        const trainingPending = await JobApplication.countDocuments({ trainingStatus: "Pending" });
        const joinedStaff = await JobApplication.countDocuments({ status: "Joined" });

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
        const vacancy = new JobVacancy(req.body);
        await vacancy.save();
        res.status(201).json({ success: true, data: vacancy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getVacancies = async (req, res) => {
    try {
        const vacancies = await JobVacancy.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: vacancies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateVacancy = async (req, res) => {
    try {
        const vacancy = await JobVacancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: vacancy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Application Controllers
exports.createApplication = async (req, res) => {
    try {
        // Uploads can be handled via multer in routes and paths saved in req.body
        const application = new JobApplication(req.body);
        await application.save();
        res.status(201).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find().populate("vacancy").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await JobApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateTrainingStatus = async (req, res) => {
    try {
        const { trainingStatus, trainingChecklist } = req.body;
        const application = await JobApplication.findByIdAndUpdate(
            req.params.id,
            { trainingStatus, trainingChecklist },
            { new: true }
        );
        res.status(200).json({ success: true, data: application });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Interview Controllers
exports.scheduleInterview = async (req, res) => {
    try {
        const interview = new JobInterview({ ...req.body, application: req.params.applicationId });
        await interview.save();
        // Also update application status
        await JobApplication.findByIdAndUpdate(req.params.applicationId, { status: "Interview Round 1" });
        res.status(201).json({ success: true, data: interview });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getInterviews = async (req, res) => {
    try {
        const interviews = await JobInterview.find().populate({
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
        const interview = await JobInterview.findByIdAndUpdate(
            req.params.id,
            { scorecard, overallRating, status },
            { new: true }
        );
        res.status(200).json({ success: true, data: interview });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Final Conversion
exports.convertToEmployee = async (req, res) => {
    try {
        const application = await JobApplication.findById(req.params.id).populate("vacancy");
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        // This is a simplified employee creation logic. In a real scenario, this would use robust ID generation.
        const username = application.email.split("@")[0] + Math.floor(Math.random() * 1000);
        const passwordHash = await bcrypt.hash("password123", 10);
        
        // 1. Create User
        const newUser = new User({
            name: application.applicantName,
            email: application.email,
            password: passwordHash,
            role: application.roleType === "Teaching" ? "Teacher" : "Staff", // Adjust role as needed
            username: username
        });
        await newUser.save();
        
        // 2. Create Staff profile
        const newStaff = new Staff({
            userId: newUser._id,
            personalDetails: {
                firstName: application.applicantName.split(" ")[0],
                lastName: application.applicantName.split(" ").slice(1).join(" "),
                email: application.email,
                phone: application.mobile,
                dateOfBirth: application.dob,
                gender: application.gender,
                bloodGroup: "Unknown",
                religion: "Unknown",
                nationality: "Unknown",
                maritalStatus: "Single"
            },
            employmentDetails: {
                staffId: "EMP" + Math.floor(Math.random() * 10000),
                role: application.roleType === "Teaching" ? "Teacher" : "Staff",
                department: application.vacancy ? application.vacancy.department : "General",
                joiningDate: new Date(),
                status: "Active"
            }
        });
        await newStaff.save();
        
        // 3. Update application status
        application.status = "Joined";
        await application.save();
        
        res.status(200).json({ success: true, message: "Converted to Employee successfully", user: newUser, staff: newStaff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
