const mongoose = require("mongoose");
const { Schema } = mongoose;

const JobApplicationSchema = new Schema(
    {
        vacancy: { type: Schema.Types.ObjectId, ref: "JobVacancy", required: true },
        // Personal Info
        applicantName: { type: String, required: true },
        fatherName: { type: String },
        dob: { type: Date },
        gender: { type: String, enum: ["Male", "Female", "Other"] },
        mobile: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String },

        // Professional Info
        qualification: { type: String, required: true },
        experience: { type: String },
        currentSalary: { type: String },
        expectedSalary: { type: String },
        resumeUrl: { type: String },

        // Teacher Specific
        subject: { type: String },
        classesHandled: { type: [String], default: [] },
        demoClassExperience: { type: Boolean, default: false },

        // Documents
        aadhaarUrl: { type: String },
        panUrl: { type: String },
        certificatesUrl: { type: [String], default: [] },
        photoUrl: { type: String },

        // Pipeline Status
        status: { 
            type: String, 
            enum: ["Applied", "Screening", "Interview Round 1", "Interview Round 2", "Selected", "Offer Sent", "Documents Verified", "Training Started", "Joined", "Rejected"], 
            default: "Applied" 
        },

        // Training Status
        trainingStatus: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
        trainingChecklist: {
            erpTraining: { type: Boolean, default: false },
            schoolRules: { type: Boolean, default: false },
            attendanceSystem: { type: Boolean, default: false },
            studentSOP: { type: Boolean, default: false },
            demoClass: { type: Boolean, default: false }
        },

        roleType: { type: String, enum: ["Teaching", "Non-Teaching"], required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("JobApplication", JobApplicationSchema);
