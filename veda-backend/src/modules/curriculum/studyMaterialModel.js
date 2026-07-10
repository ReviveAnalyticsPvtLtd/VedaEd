const mongoose = require("mongoose");
const { Schema } = mongoose;

const StudyMaterialSchema = new Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  files: [
    {
      fileName: {
        type: String,
        required: true,
      },
      fileUrl: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
      },
    },
  ],
  visibleToStudents: {
    type: Boolean,
    default: false,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const StudyMaterial = mongoose.model("StudyMaterial", StudyMaterialSchema);
module.exports = StudyMaterial;
