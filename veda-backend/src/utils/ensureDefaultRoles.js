const Role = require("../models/Role");

const DEFAULT_ROLES = [
  "superadmin",
  "admin",
  "teacher",
  "parent",
  "staff",
  "student",
  "hr",
  "receptionist",
  "admission",
];

async function ensureDefaultRoles() {
  for (const name of DEFAULT_ROLES) {
    await Role.findOneAndUpdate(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, new: true }
    );
  }
}

module.exports = ensureDefaultRoles;
