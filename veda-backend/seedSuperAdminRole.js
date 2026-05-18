require("dotenv").config();
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Role = require("./src/models/Role");
const Permission = require("./src/models/Permission");
const RolePermission = require("./src/models/RolePermission");

const SUPERADMIN_EMAIL = "superadmin@veda.com";
const SUPERADMIN_PASSWORD = "password123";

async function seedSuperAdmin() {
  await connectDB();

  try {
    let superadminRole = await Role.findOne({ name: "superadmin" });
    if (!superadminRole) {
      superadminRole = await Role.create({ name: "superadmin" });
      console.log("Created superadmin role");
    } else {
      console.log("Superadmin role already exists");
    }

    const superadminPermissions = [
      { name: "view_dashboard", module: "Dashboard" },
      { name: "manage_schools", module: "SuperAdmin" },
      { name: "manage_admins", module: "SuperAdmin" },
      { name: "manage_platform_settings", module: "SuperAdmin" },
    ];

    for (const perm of superadminPermissions) {
      let permission = await Permission.findOne({ name: perm.name });
      if (!permission) {
        permission = await Permission.create(perm);
      }

      const exists = await RolePermission.findOne({
        roleId: superadminRole._id,
        permissionId: permission._id,
      });

      if (!exists) {
        await RolePermission.create({
          roleId: superadminRole._id,
          permissionId: permission._id,
        });
      }
    }

    let superadminUser = await User.findOne({ email: SUPERADMIN_EMAIL });
    if (!superadminUser) {
      superadminUser = await User.create({
        name: "Platform Super Admin",
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        roleId: superadminRole._id,
        status: "active",
      });
      console.log(`Created SuperAdmin user: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
    } else {
      superadminUser.roleId = superadminRole._id;
      superadminUser.status = "active";
      if (!superadminUser.password.startsWith("$2")) {
        superadminUser.password = SUPERADMIN_PASSWORD;
      }
      await superadminUser.save();
      console.log(`Updated SuperAdmin user: ${SUPERADMIN_EMAIL}`);
    }

    console.log("SuperAdmin seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("SuperAdmin seed failed:", error);
    process.exit(1);
  }
}

seedSuperAdmin();
