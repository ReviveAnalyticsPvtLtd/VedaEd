const mongoose = require("mongoose");
const { Schema } = mongoose;

const SyllabusSchema = new Schema({
  class: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Draft", "Published"],
    default: "Draft",
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const Syllabus = mongoose.model("Syllabus", SyllabusSchema);
module.exports = Syllabus;
