const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const Role = require("./src/models/Role");
const Permission = require("./src/models/Permission");
const RolePermission = require("./src/models/RolePermission");

mongoose
  .connect(process.env.db_Connect_String, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB for Role Seeding");
    
    const missingRoles = ['hr', 'receptionist', 'admission', 'transport'];
    
    // Create missing roles
    for (const roleName of missingRoles) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({ name: roleName });
        console.log(`Created missing role: ${roleName}`);
      } else {
        console.log(`Role ${roleName} already exists`);
      }
    }
    
    console.log("Role seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
