const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.db_Connect_String);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err);
        throw err;
    }
}

module.exports = main;