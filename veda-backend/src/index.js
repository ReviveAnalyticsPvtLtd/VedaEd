// CONNECT DB & START SERVER
const express = require('express');
const dotenv = require('dotenv');
require('dotenv').config();

const app = require("./app");
const main = require("./config/db");
const ensureDefaultRoles = require("./utils/ensureDefaultRoles");

main()
  .then(async () => {
    console.log("connected to db");

    if (process.env.ENSURE_DEFAULT_ROLES === "true") {
      await ensureDefaultRoles();
      console.log("default roles ensured");
    }

    if (process.env.SEED_INTEGRATION_PROVIDERS === "true") {
      const seedIntegrationProviders = require("./modules/integrations/seedProviders");
      await seedIntegrationProviders();
    }

    const port = process.env.PORT || 5000;

    const server = app.listen(port, () => {
      console.log("Server Listening at Port: " + port);
    });

    // A second backend instance on the same port must not crash with an
    // unhandled "error" event. Say what is wrong and exit cleanly instead.
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use by another process.\n` +
            `Stop the other backend instance first, e.g.:\n` +
            `  fuser -k ${port}/tcp     (or)     lsof -ti :${port} | xargs kill`
        );
        process.exit(1);
      }

      console.error("Server error:", err);
      process.exit(1);
    });
  })
  .catch(err => console.log("DB Connection Error: ", err));