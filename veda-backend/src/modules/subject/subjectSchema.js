const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  // Tenant ownership. The authoritative value is assigned server-side from the
  // authenticated user; it is never accepted from the client.
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true
  },
  subjectCode: { 
    type: String, 
  },
  subjectName: { 
    type: String, 
    required: true // e.g., "Mathematics"
  },
  // teachers: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Teacher", // teachers assigned to subject
  //   }
  // ],
  type: {
  type: String,
  enum: ["Theory", "Practical"],
  default: "Theory",
  required: true
},
}, { timestamps: true });

// A subject code is generated per school (prefix + counter from 101), so two
// schools legitimately both own SCI101. Uniqueness must therefore be scoped to
// the school. `unique: true` on subjectCode alone would have been global and
// rejected every school's second SCI101; that stale index is removed by
// scripts/subject-code-index-migration.js.
subjectSchema.index({ schoolId: 1, subjectCode: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
