const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdmissionApplicationSchema = new Schema(
    {
        applicationId: {
            type: String,
            unique: true,
            // We can generate this automatically or let it be flexible
        },
        personalInfo: {
            name: { type: String, required: true, trim: true },
            stdId: { type: String, trim: true, default: "" },
            classApplied: { type: String },
            section: { type: String, default: "" },
            rollNo: { type: String, default: "" },
            dateOfBirth: { type: String },
            age: { type: String, default: "" },
            gender: { type: String },
            bloodGroup: { type: String },
            nationality: { type: String },
            religion: { type: String },
            fees: { type: String, default: "Due" },
        },
        contactInfo: {
            email: { type: String },
            phone: { type: String },
            alternatePhone: { type: String },
            address: { type: String },
            city: { type: String, default: "" },
            state: { type: String, default: "" },
            zipCode: { type: String, default: "" },
        },
        earlierAcademic: {
            schoolName: { type: String },
            board: { type: String },
            lastClass: { type: String },
            academicYear: { type: String },
        },
        parents: {
            parentId: { type: String, default: "" },
            /** Which parent/guardian row uses parents.parentId for login & SIS listing */
            parentIdAccountHolder: {
                type: String,
                enum: ["father", "mother", "guardian"],
                default: "father",
            },
            father: {
                name: String,
                occupation: String,
                phone: String,
                email: String,
            },
            mother: {
                name: String,
                occupation: String,
                phone: String,
                email: String,
            },
            guardian: {
                name: String,
                relation: String,
                phone: String,
                email: String,
            },
        },
        emergencyContact: {
            name: String,
            relation: String,
            phone: String,
        },
        transportRequired: { type: String },
        medicalConditions: { type: String },
        specialNeeds: { type: String },
        /** Parent portal / admin profile image for admission-linked parent (overrides student passport in listings). */
        parentProfilePhoto: { type: String, default: "" },
        admissionFee: {
            status: { type: String, default: "Due" },
            amount: { type: Number, default: 0 },
            paymentMode: { type: String, default: "" },
            receiptNumber: { type: String, default: "" },
            paymentDate: { type: String, default: "" },
            remarks: { type: String, default: "" },
        },

        // Application Status
        applicationStatus: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "pending", "approved", "rejected"],
            default: "Pending",
        },
        // Document Verification Status
        documentVerificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected", "pending", "verified", "rejected"],
            default: "Pending",
        },
        offerStatus: {
            type: String,
            enum: ["pending", "offer_sent"],
            default: "pending",
        },
        offerSentAt: { type: Date, default: null },
        offerSubject: { type: String, default: "" },
        offerContent: { type: String, default: "" },
        documents: [
            {
                name: String,
                type: { type: String }, // e.g., 'Passport Size Photo'
                path: String,
                size: Number,
                fileType: String,
                /** True only when uploaded from Admin/Parent profile document API — hide student application docs there */
                parentProfileUpload: { type: Boolean, default: false },
                uploadedAt: { type: Date, default: Date.now },
                verificationStatus: { type: String, enum: ["Pending", "Verified", "Rejected", "pending", "verified", "rejected"], default: "Pending" },
                verifiedAt: { type: Date },
                verifiedBy: { type: String },
                comment: { type: String }
            },
        ],
    },
    { timestamps: true }
);

// Auto-generate applicationId
AdmissionApplicationSchema.pre("save", function (next) {
    if (!this.applicationId) {
        this.applicationId = "APP" + Date.now();
    }
    next();
});

module.exports = mongoose.model("AdmissionApplication", AdmissionApplicationSchema);
