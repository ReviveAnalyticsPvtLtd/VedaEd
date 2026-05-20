const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobVacancySchema = new Schema(
    {
        vacancyId: { type: String, required: true, unique: true },
        department: { type: String, required: true },
        jobTitle: { type: String, required: true },
        requiredSkills: { type: [String], default: [] },
        experienceRequired: { type: String },
        salaryRange: { type: String },
        openings: { type: Number, required: true, default: 1 },
        lastDateToApply: { type: Date },
        status: { type: String, enum: ["Draft", "Published", "Closed"], default: "Draft" },
        roleType: { type: String, enum: ["Teaching", "Non-Teaching"], required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("JobVacancy", JobVacancySchema);
