const mongoose = require('mongoose');
const AdmissionEnquiry = require('./admissionEnquiryModel');

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

// Create a new enquiry
exports.createEnquiry = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const newEnquiry = new AdmissionEnquiry({ ...req.body, schoolId });
        const payload = { ...req.body };
        if (req.user?.schoolId) {
            payload.schoolId = req.user.schoolId;
        }
        const newEnquiry = new AdmissionEnquiry(payload);
        const savedEnquiry = await newEnquiry.save();
        res.status(201).json(savedEnquiry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all enquiries for the caller's school
exports.getEnquiries = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const enquiries = await AdmissionEnquiry.find({ schoolId }).sort({ createdAt: -1 });
        const filter = req.user?.schoolId
            ? { $or: [{ schoolId: req.user.schoolId }, { schoolId: { $exists: false } }] }
            : {};
        const enquiries = await AdmissionEnquiry.find(filter).sort({ createdAt: -1 });
        res.status(200).json(enquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an enquiry
exports.updateEnquiry = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        // Scoped lookup: an enquiry owned by another school is indistinguishable
        // from one that does not exist, so a caller cannot probe or write onto a
        // foreign enquiry by ObjectId.
        const updatedEnquiry = await AdmissionEnquiry.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            { $set: { ...req.body, schoolId } },
            { new: true, runValidators: true }
        );
        if (!updatedEnquiry) return res.status(404).json({ message: 'Enquiry not found' });
        res.status(200).json(updatedEnquiry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete an enquiry
exports.deleteEnquiry = async (req, res) => {
    const schoolId = requireSchool(req, res);
    if (!schoolId) return;
    try {
        const deletedEnquiry = await AdmissionEnquiry.findOneAndDelete({ _id: req.params.id, schoolId });
        if (!deletedEnquiry) return res.status(404).json({ message: 'Enquiry not found' });
        res.status(200).json({ message: 'Enquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
