const mongoose = require('mongoose');

const admissionEnquirySchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
        immutable: true,
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
        enum: ['pending', 'reviewed', 'contacted', 'closed'],
    }
}, { timestamps: true });

module.exports = mongoose.model('AdmissionEnquiry', admissionEnquirySchema);