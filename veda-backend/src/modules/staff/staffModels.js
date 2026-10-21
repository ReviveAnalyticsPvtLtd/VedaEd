const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  // Tenant ownership. The authoritative value is assigned server-side from the
  // authenticated user; it is never accepted from the client.
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true
  },
  personalInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      staffId:{
        type:String,
        required:true,
        unique: true
      },
      username: {
        type: String,
        unique: true,
        // required: true,
        trim: true,
      },
      gender: { 
        type: String, 
        enum: ["Male", "Female", "Other"] 
      },
      role: {
        type: String,
        enum: ["Teacher", "Principal", "Accountant", "Admin","HR", "Other"],
        required: true,
      },
      // Free-text job title (e.g. "Guard", "Sweeper"). Present only on
      // support-staff records; also used to tell them apart from other
      // role="Other" staff (HR-converted non-teaching employees have no designation).
      designation: { type: String, trim: true },
      department: {
        type: String,
        required: true,
      },
      // Support staff have no login account, so email/password are optional.
      // Loginable staff (create, import, HR convert) still always supply them.
      email: {
        type: String,
      },
      mobileNumber:{
        type: String
      },
      emergencyContact:{
        type:String
      },
      dob: { type: String },
      bloodGroup: { type: String },
      aadhaar: { type: String },
      profession: { type: String },
      permanentAddress: { type: String },
      currentAddress: { type: String },
      image: {
        type: String,
      },
      address: { type: String },
      password: { type: String },
  },

  joiningDate: { type: Date, default: Date.now },
  qualification: { type: String }, // e.g. "M.Sc. Mathematics, B.Ed."
  experience: { type: Number, default: 0 }, // in years

  classesAssigned: [ // will apply after teacher Schema is ready  
    {
      type: String,
    }
  ],
  salaryDetails: {
      salary:{
        type:String
      },
      lastPayment:{
        type:String
      },
      paymentStatus: {
        type: String,
        enum: ["Paid", "Pending", "Unpaid"],
        default: "Pending",
      }
  },
  //---- future me when Slaray and pyroll module is made toh reference kara do ----
  
  // Assignments
  
  // subjectsAssigned: [ // subjects handled by teacher
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Subject" 
  //   }
  // ],
  // classTeacherOf: { // if teacher is class teacher of a particular class
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Class" 
  // },

  status: {
    type: String,
    enum: ["Active", "On Leave"],
    default: "Active"
  },
  
  documents: [{
    name: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;


  // assignedClasses: [
  //       {
  //         type: String,
  //         // required: true
  //       }
  //     ],