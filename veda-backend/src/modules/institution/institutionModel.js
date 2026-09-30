const mongoose = require("mongoose");
const { Schema } = mongoose;

const InstitutionSchema = new Schema(
    {
        // Tenant ownership. Assigned server-side; never accepted from the client.
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: "School",
            required: true,
            unique: true,
            index: true,
            immutable: true,
        },
        identity: {
            schoolName: { type: String, trim: true },
            shortName: { type: String, trim: true },
            registrationNo: { type: String, trim: true },
            supportEmail: { type: String, trim: true },
            tagline: { type: String, trim: true },
        },
        branding: {
            logo: { type: String }, // Path to logo file
            coverImage: { type: String }, // Path to cover image file
            themeType: { type: String },
            primaryColor: { type: String },
            secondaryColor: { type: String },
            accentColor: { type: String },
            backgroundStyle: { type: String },
            backgroundPreset: { type: String },
            font: { type: String },
            buttonStyle: { type: String },
            darkMode: { type: Boolean },
            backgroundTextColor: { type: String },
        },
        domain: {
            headDomain: { type: String, trim: true },
            appSubDomain: { type: String, trim: true },
            sslEnabled: { type: Boolean, default: true },
        },
        modules: {
            sis: { type: Boolean, default: true },
            transport: { type: Boolean, default: true },
            fees: { type: Boolean, default: false },
            exams: { type: Boolean, default: true },
            hr: { type: Boolean, default: true },
            communication: { type: Boolean, default: true },
        },
        contact: {
            phone: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
        },
        status: {
            type: String,
            enum: ["Draft", "Published"],
            default: "Draft",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Institution", InstitutionSchema);
