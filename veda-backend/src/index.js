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
        await ensureDefaultRoles();
        console.log("default roles ensured");

        const port = process.env.PORT || 5000;
        app.listen(port, () => {
                console.log("Server Listening at Port: " + port);
        });
})
.catch(err => console.log("DB Connection Error: ", err));

