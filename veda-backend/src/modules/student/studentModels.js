const mongoose = require("mongoose");
const { Schema } = mongoose;

const StudentSchema = new Schema(
  {
    personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      stdId: {
        type: String,
        required: true
      },
      username: {
        type: String,
        unique: true,
        trim: true,
      },
      DOB: {
        type: String,
      },
      gender: {
        type: String,
        // required: true,
      },
      bloodGroup: {
        type: String
      },
      age: {
        type: String,
      },
      class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
      },
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: true,
      },
      rollNo: {
        type: String,
        required: true
      },
      admissionDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
      },
      contactDetails: {
        mobileNumber: {
          type: String,
          // required: true,
        },
        countryCode: { type: String, default: "" },
        alternatePhone: { type: String, default: "" },
        email: String,
      },
      address: {
        type: String
      },
      image: {
        type: String,
        url: String,
      },
      password: {
        type: String,
        required: true,
      },
      fees: {
        required: true,
        type: String,
        enum: ["Paid", "Due"],
        default: "Paid"
      }
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent"
    },

    /** Admin SIS / StudentProfile — used for teacher health & emergency display */
    emergencyContact: {
      name: { type: String, default: "" },
      relation: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    //Curriculum
    curriculum: {
      academicYear: {
        type: String
      },
      admissionType: {
        type: String
      }
    },
    // curriculum: { // future 
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Curriculum",
    // },
    //Assignments
    assignments: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    //exams & reports
    exams: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    reports: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    health: {
      height: Number,
      weight: Number,
      bloodGroup: String, // Overrides personalInfo if needed, or syncs
      allergies: { type: String, default: "None" },
      chronic: { type: String, default: "None" },
      medication: { type: String, default: "None" },
      vaccination: { type: String, default: "Up to Date" },
      notes: { type: String, default: "" },
      lastReportDate: { type: String, default: "" },
      parentVisible: {
        type: String,
        enum: ["Yes", "No"],
        default: "Yes",
      },
      teacherGeneralHealth: { type: String, default: "" },
      teacherFollowUp: { type: String, default: "" },
      history: [
        {
          date: String,
          issue: String,
          action: String,
          updateType: { type: String, default: "" },
          updatedBy: { type: String, default: "" },
        },
      ],
      campReport: {
        bp: { type: String, default: "" },
        hb: { type: String, default: "" },
        eye: { type: String, default: "" },
        dental: { type: String, default: "" },
        notes: { type: String, default: "" },
      },
    },
    documents: [
      {
        name: String,
        path: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
const Student = mongoose.model("Student", StudentSchema);
module.exports = Student;
