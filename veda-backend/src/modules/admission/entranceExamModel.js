const mongoose = require("mongoose");
const { Schema } = mongoose;

const EntranceExamSchema = new Schema(
    {
        /**
         * Authoritative tenant ownership. Assigned server-side from the
         * authenticated session (req.user.schoolId) on creation and never
         * accepted from the request body. Immutable so no later update path can
         * move an exam to another school.
         */
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true,
            immutable: true,
        },
        applicationId: {
            type: Schema.Types.ObjectId,
            ref: "AdmissionApplication",
            required: true,
        },
        examDate: {
            type: Date,
        },
        examTime: {
            type: String,
        },
        duration: {
            type: String,
        },
        examiner: {
            type: String,
        },
        venue: {
            type: String,
        },
        type: {
            type: String,
            enum: ["Oral", "Theory", "Written", "Direct Entry"],
            default: "Written",
        },
        status: {
            type: String,
            enum: ["Pending", "Scheduled", "Completed"],
            default: "Pending",
        },
        attendance: {
            type: String,
            enum: ["Pending", "Present", "Absent", "Late"],
            default: "Pending",
        },
        result: {
            type: String,
            enum: ["Not Declared", "Qualified", "Disqualified"],
            default: "Not Declared",
        },
        remarks: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EntranceExam", EntranceExamSchema);
