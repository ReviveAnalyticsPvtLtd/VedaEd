const express = require('express');
const app = express();
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// const cors = require('cors');

const cors = require("cors");
const cookieParser = require('cookie-parser');
const path = require('path');

const authRouter = require('./routes/authRoutes');
// const vendorRoutes = require('./routes/vendorRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');
const studentRoutes = require("./modules/student/studentRoutes");
const staffRoutes = require("./modules/staff/staffRoutes");
const parentRoutes = require("./modules/parents/parentRoutes");
const sectionRoutes = require('./modules/section/sectionRoutes');
const classRoutes = require('./modules/class/classRoutes');
const subjectRoutes = require("./modules/subject/subjectRoutes");
const subjectGroupRoutes = require("./modules/subGroup/subGroupRoutes");
const assignTeacherRoutes = require("./modules/assignTeachersToClass/assignTeacherRoutes");
const timetableRoutes = require("./modules/Timetable/timeTableRoutes");
const attendanceRoutes = require("./modules/attendence/attendenceRoutes");
const assignmentRoutes = require("./modules/assignment/assignmentRoutes");
const communicationRoutes = require("./modules/communication/communicationRoutes");
const examTimetableRoutes = require("./modules/exam/examTimetableRoutes");
const admissionEnquiryRoutes = require("./modules/admission/admissionEnquiryRoutes");
const admissionApplicationRoutes = require("./modules/admission/admissionApplicationRoutes");
const vacancyRoutes = require("./modules/admission/vacancyRoutes");
const entranceExamRoutes = require("./modules/admission/entranceExamRoutes");
const interviewRoutes = require("./modules/admission/interviewRoutes");
const chatbotRoutes = require("./modules/chatbot/chatbotRoutes");
const superadminLandingRoutes = require("./modules/superadminLanding/superadminLandingRoutes");
const superadminIdentityRoutes = require("./modules/superadminIdentity/superadminIdentityRoutes");


// Middlewares
// 
// const cors = require("cors");



app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://veda-ed.vercel.app",
    "https://veda-ed-git-main-aabhishekdubey007-gmailcoms-projects.vercel.app",
    "https://veda-lfvv29kj6-aabhishekdubey007-gmailcoms-projects.vercel.app"
  ],
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));


app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/parents", parentRoutes);
//class & Schedule
app.use("/api/sections", sectionRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/subGroups", subjectGroupRoutes);
app.use("/api/assignTeachers", assignTeacherRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/exam-timetables", examTimetableRoutes);
app.use("/api/admission-enquiry", admissionEnquiryRoutes);
app.use("/api/admission/application", admissionApplicationRoutes);
app.use("/api/admission/vacancy", vacancyRoutes);
app.use("/api/admission/entrance-exam", entranceExamRoutes);
app.use("/api/admission/interview", interviewRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/superadmin-landing", superadminLandingRoutes);
app.use("/api/superadmin/identity", superadminIdentityRoutes);

app.use("/api/discipline", require("./modules/discipline/disciplineRoutes"));
app.use("/api/activities", require("./modules/activity/activityRoutes"));
app.use("/api/visitor-book", require("./modules/receptionist/visitorBookRoutes"));
app.use("/api/front-office-setup", require("./modules/receptionist/frontOfficeSetupRoutes"));
app.use("/api/calendar", require("./modules/calendar/calendarRoutes"));
app.use("/api/gradebook", require("./modules/gradebook/gradebookRoutes"));
app.use("/api/transport", require("./modules/transport/transportRoutes"));
app.use("/api/institution", require("./modules/institution/institutionRoutes"));
app.use("/api/academic-years", require("./modules/fees/feeRoutes").academicYearRouter);
app.use("/api/fee-categories", require("./modules/fees/feeRoutes").feeCategoryRouter);
app.use("/api/fees", require("./modules/fees/feeRoutes").gradeFeeRouter);
app.use("/api/installments", require("./modules/fees/feeRoutes").installmentPlanRouter);
app.use("/api/late-fee-policies", require("./modules/fees/feeRoutes").lateFeePolicyRouter);
app.use("/api/discount-rules", require("./modules/fees/feeRoutes").discountRuleRouter);
app.use("/api/fees/dashboard", require("./modules/fees/feeRoutes").dashboardRouter);
app.use("/api/fees/collect", require("./modules/fees/feeRoutes").collectionRouter);
app.use("/api/fines", require("./modules/fees/feeRoutes").fineRouter);



// 404 Handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  if (err?.name === "MulterError") {
    return res.status(400).json({
      message: err.message || "File upload validation failed",
    });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
