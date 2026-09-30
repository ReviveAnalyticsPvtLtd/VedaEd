const mongoose = require("mongoose");
const Vacancy = require("./vacancyModel");

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

exports.createVacancy = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // Tenant ownership is server-assigned. req.body.schoolId has already been
        // stripped by requireSchoolContext and is never persisted.
        const newVacancy = new Vacancy({ ...req.body, schoolId });
        await newVacancy.save();
        res.status(201).json({ success: true, data: newVacancy, message: "Vacancy created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllVacancies = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const vacancies = await Vacancy.find({ schoolId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: vacancies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateVacancy = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // Scoped lookup: a vacancy owned by another school is indistinguishable
        // from one that does not exist.
        const vacancy = await Vacancy.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            { $set: { ...req.body, schoolId } },
            { new: true }
        );
        if (!vacancy) return res.status(404).json({ success: false, message: "Vacancy not found" });
        res.status(200).json({ success: true, data: vacancy, message: "Vacancy updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteVacancy = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const vacancy = await Vacancy.findOneAndDelete({ _id: req.params.id, schoolId });
        if (!vacancy) return res.status(404).json({ success: false, message: "Vacancy not found" });
        res.status(200).json({ success: true, message: "Vacancy deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
