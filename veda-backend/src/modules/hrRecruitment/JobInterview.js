const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobInterviewSchema = new Schema(
    {
        application: { type: Schema.Types.ObjectId, ref: "JobApplication", required: true },
        interviewerName: { type: String, required: true }, // Or ObjectId ref to User/Staff
        interviewDate: { type: Date, required: true },
        mode: { type: String, enum: ["Online", "Offline"], default: "Offline" },
        notes: { type: String },
        scorecard: {
            communication: { type: Number, min: 1, max: 5 },
            subjectKnowledge: { type: Number, min: 1, max: 5 },
            confidence: { type: Number, min: 1, max: 5 },
            behavior: { type: Number, min: 1, max: 5 }
        },
        overallRating: { type: Number, min: 1, max: 5 },
        status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("JobInterview", JobInterviewSchema);
