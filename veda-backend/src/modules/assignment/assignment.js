const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
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
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  assignmentType: {
    type: String,
    enum: ["Homework", "Project", "Quiz", "Other"],
    default: "Homework",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  document: {
    type: String, // file path or cloud URL
  },
  status: {
    type: String,
    enum: ["Active", "Pending Review", "Late Submission"],
    default: "Active",
  },
  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      file: String, // uploaded solution file
      submittedAt: Date,
      status: {
        type: String,
        enum: ["Submitted", "Late", "Pending"],
        default: "Pending",
      },
      marks: Number,
      grade: String,
      feedback: String,
    },
  ],
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
module.exports = Assignment;