const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobVacancySchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true,
            immutable: true,
        },
        vacancyId: { type: String, required: true },
        department: { type: String, required: true },
        jobTitle: { type: String, required: true },
        requiredSkills: { type: [String], default: [] },
        experienceRequired: { type: String },
        salaryRange: { type: String },
        openings: { type: Number, required: true, default: 1 },
        lastDateToApply: { type: Date },
        status: { type: String, enum: ["Draft", "Published", "Closed"], default: "Draft" },
        roleType: { type: String, enum: ["Teaching", "Non-Teaching", "Support Staff"], required: true },
    },
    { timestamps: true }
);

JobVacancySchema.index({ schoolId: 1, vacancyId: 1 }, { unique: true });

const JobVacancy = mongoose.model("JobVacancy", JobVacancySchema);

const dropLegacyGlobalUniqueIndex = () => {
    JobVacancy.collection.dropIndex("vacancyId_1").catch(() => {});
};
if (mongoose.connection.readyState === 1) dropLegacyGlobalUniqueIndex();
else mongoose.connection.once("open", dropLegacyGlobalUniqueIndex);

module.exports = JobVacancy;
