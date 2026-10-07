const mongoose = require('mongoose');

const admissionEnquirySchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
<<<<<<< HEAD
        ref: "School",
        required: true,
        index: true,
        immutable: true,
=======
        ref: 'School',
>>>>>>> 171eda7 (done)
    },
    studentName: {
        type: String,
        required: true,
    },
    guardianName: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    whatsapp: {
        type: String,
    },
    email: {
        type: String,
    },
    enquiryClass: {
        type: String,
        required: true,
    },
    date: {
        type: String,
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'reviewed', 'contacted', 'closed'] // Optional: limit values if needed, but 'pending' and 'reviewed' are the main ones currently used
    }
}, { timestamps: true });

module.exports = mongoose.model('AdmissionEnquiry', admissionEnquirySchema);
