const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./src/config/db");

const User = require("./src/models/User");
const Role = require("./src/models/Role");
const Permission = require("./src/models/Permission");
const RolePermission = require("./src/models/RolePermission");

async function seedDatabase() {
  await connectDB();

  try {
    console.log("Seeding database...");

    // Clear existing
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await RolePermission.deleteMany({});

    // 1. Create Roles
    const roles = ['superadmin', 'admin', 'teacher', 'parent', 'staff', 'student'];
    const createdRoles = {};
    for (const roleName of roles) {
      createdRoles[roleName] = await Role.create({ name: roleName });
    }
    console.log("Roles created");

    // 2. Create Permissions
    const permissions = [
      { name: 'view_dashboard', module: 'Dashboard' },
      { name: 'manage_students', module: 'Student' },
      { name: 'view_student', module: 'Student' },
      { name: 'create_student', module: 'Student' },
      { name: 'edit_student', module: 'Student' },
      { name: 'delete_student', module: 'Student' },
      { name: 'mark_attendance', module: 'Attendance' },
      { name: 'view_attendance', module: 'Attendance' },
      { name: 'manage_fees', module: 'Fees' },
      { name: 'view_fees', module: 'Fees' },
      { name: 'manage_transport', module: 'Transport' },
      { name: 'view_transport', module: 'Transport' },
      { name: 'manage_staff', module: 'Staff' },
      { name: 'view_staff', module: 'Staff' },
    ];
    const createdPermissions = {};
    for (const p of permissions) {
      createdPermissions[p.name] = await Permission.create(p);
    }
    console.log("Permissions created");

    // 3. Map Permissions to Roles
    const roleMap = {
      superadmin: ['view_dashboard', 'manage_students', 'manage_staff', 'manage_fees', 'manage_transport'],
      admin: permissions.map(p => p.name),
      teacher: ['view_dashboard', 'view_student', 'edit_student', 'mark_attendance', 'view_attendance'],
      parent: ['view_dashboard', 'view_student', 'view_fees', 'view_transport', 'view_attendance'],
      student: ['view_dashboard', 'view_student', 'view_attendance', 'view_transport'],
      staff: ['view_dashboard', 'view_student', 'manage_transport', 'view_transport', 'view_attendance']
    };

    for (const [roleName, pNames] of Object.entries(roleMap)) {
      const rId = createdRoles[roleName]._id;
      for (const pName of pNames) {
        await RolePermission.create({
          roleId: rId,
          permissionId: createdPermissions[pName]._id
        });
      }
    }
    console.log("Role-Permissions mapped");

    // 4. Create Initial SuperAdmin User
    await User.create({
      name: "Platform Super Admin",
      email: "superadmin@veda.com",
      password: "password123",
      roleId: createdRoles['superadmin']._id,
      status: 'active'
    });
    console.log("Initial SuperAdmin user created: superadmin@veda.com / superadmin123");

    // 5. Create Initial School Admin User
    await User.create({
      name: "School Admin",
      email: "admin@veda.com",
      password: "password123", // Hashes via pre-save hook
      roleId: createdRoles['admin']._id,
      status: 'active'
    });
    console.log("Initial Admin user created: admin@veda.com / password123");

    // Create a dummy Teacher for testing
    await User.create({
      name: "Teresa Teacher",
      email: "teacher@veda.com",
      password: "password123",
      roleId: createdRoles['teacher']._id,
      status: 'active'
    });
    console.log("Initial Teacher user created: teacher@veda.com / password123");

    console.log("Seed completed successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();