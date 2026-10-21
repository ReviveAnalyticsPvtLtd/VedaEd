const mongoose = require("mongoose");

// Sequence for support staff IDs (SS-YYYY-NNN).
// The Staff schema enforces a GLOBAL unique index on personalInfo.staffId,
// so this sequence is keyed by year only (mirroring the shared StaffIdCounter
// used for TCH- ids) — a per-school sequence would collide across tenants.
const supportStaffIdCounterSchema = new mongoose.Schema({
    year: { type: Number, required: true, unique: true },
    seq: { type: Number, default: 0 },
});

const formatSupportStaffId = (year, seq) =>
    `SS-${year}-${String(seq).padStart(3, "0")}`;

// Atomically reserves the next number for the current year.
const generateNextSupportStaffId = async () => {
    const year = new Date().getFullYear();
    const counter = await SupportStaffIdCounter.findOneAndUpdate(
        { year },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return formatSupportStaffId(year, counter.seq);
};

// Reads the next number without consuming it (form preview only).
const peekNextSupportStaffId = async () => {
    const year = new Date().getFullYear();
    const counter = await SupportStaffIdCounter.findOne({ year });
    return formatSupportStaffId(year, (counter?.seq || 0) + 1);
};

const SupportStaffIdCounter = mongoose.model(
    "SupportStaffIdCounter",
    supportStaffIdCounterSchema
);

module.exports = SupportStaffIdCounter;
module.exports.generateNextSupportStaffId = generateNextSupportStaffId;
module.exports.peekNextSupportStaffId = peekNextSupportStaffId;
module.exports.formatSupportStaffId = formatSupportStaffId;
