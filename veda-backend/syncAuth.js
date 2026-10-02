const mongoose = require("mongoose");
const connectDB = require("./src/config/db");

const User = require("./src/models/User");
const Role = require("./src/models/Role");
const Student = require("./src/modules/student/studentModels");
const Parent = require("./src/modules/parents/parentModel");
const Staff = require("./src/modules/staff/staffModels");

async function syncAuth() {
  await connectDB();

  try {
    console.log("Starting Auth Sync...");

    const roles = ['admin', 'teacher', 'parent', 'staff', 'student'];
    const roleDocs = {};
    for (const r of roles) {
      roleDocs[r] = await Role.findOne({ name: r });
    }

    // 1. Sync Students
    const students = await Student.find();
    console.log(`Checking ${students.length} students...`);
    for (const s of students) {
      const email = s.personalInfo.contactDetails?.email || s.personalInfo.username || `student_${s.personalInfo.stdId}@veda.com`;
      const exists = await User.findOne({ $or: [{ refId: s._id }, { email: email }] });
      if (!exists) {
        try {
          await User.create({
            name: s.personalInfo.name,
            email: email,
            password: s.personalInfo.password || "password123",
            roleId: roleDocs['student']._id,
            refId: s._id,
            status: 'active'
          });
        } catch (e) { console.warn(`Skipping student ${s._id}: ${e.message}`); }
      }
    }

    // 2. Sync Parents
    const parents = await Parent.find();
    console.log(`Checking ${parents.length} parents...`);
    for (const p of parents) {
      const exists = await User.findOne({ $or: [{ refId: p._id }, { email: p.email }] });
      if (!exists) {
        try {
          await User.create({
            name: p.name,
            email: p.email,
            password: p.password || "password123",
            roleId: roleDocs['parent']._id,
            refId: p._id,
            status: 'active'
          });
        } catch (e) { console.warn(`Skipping parent ${p._id}: ${e.message}`); }
      }
    }

    // 3. Sync Staff
    const staffs = await Staff.find();
    console.log(`Checking ${staffs.length} staff records...`);
    for (const st of staffs) {
      const email = st.personalInfo.email || st.personalInfo.username;
      const exists = await User.findOne({ $or: [{ refId: st._id }, { email: email }] });
      if (!exists) {
        try {
          let rName = 'staff';
          if (st.personalInfo.role === 'Teacher') rName = 'teacher';
          if (st.personalInfo.role === 'Admin') rName = 'admin';

          await User.create({
            name: st.personalInfo.name,
            email: email,
            password: st.personalInfo.password || "password123",
            roleId: roleDocs[rName]._id,
            refId: st._id,
            schoolId: st.schoolId,
            status: 'active'
          });
        } catch (e) { console.warn(`Skipping staff ${st._id}: ${e.message}`); }
      }
    }

    console.log("Auth Sync completed successfully!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

syncAuth();
