const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const Role = require("./src/models/Role");

mongoose
  .connect(process.env.db_Connect_String, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    
    const allRoles = await Role.find({});
    console.log("Roles in DB:", allRoles.map(r => r.name));

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
