const ParentIdCounter = require("../models/ParentIdCounter");
const Parent = require("../modules/parents/parentModel");
const AdmissionApplication = require("../modules/admission/admissionApplicationModel");

const yearPattern = (year) => new RegExp(`^PRN-?${year}-?(\\d+)$`, 'i');

async function ensureCounterInitialized(year) {
  const existing = await ParentIdCounter.findOne({ year });
  if (existing) return;

  const pattern = yearPattern(year);
  let maxSeq = 0;

  // Find max sequence from existing parents
  const parents = await Parent.find({ "parentId": { $regex: `^PRN-?${year}-?` } })
    .select("parentId")
    .lean();
    
  for (const p of parents) {
    if (p.parentId) {
      const match = p.parentId.match(pattern);
      if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
    }
  }

  // Also check admission applications (canonical parents.parentId)
  const applications = await AdmissionApplication.find({ "parents.parentId": { $regex: `^PRN-?${year}-?` } })
    .select("parents.parentId")
    .lean();

  for (const a of applications) {
    if (a.parents?.parentId) {
      const match = a.parents.parentId.match(pattern);
      if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
    }
  }

  try {
    await ParentIdCounter.create({ year, seq: maxSeq });
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

/**
 * Generates the next Parent ID robustly across the entire system.
 * Format: PRN-YYYY-NNNN (e.g. PRN-2026-0001)
 */
async function generateNextParentId() {
  const year = new Date().getFullYear();
  await ensureCounterInitialized(year);
  
  // Atomic increment operation ensures no duplicates
  const doc = await ParentIdCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  const seq = doc.seq;
  return `PRN-${year}-${String(seq).padStart(4, "0")}`;
}

async function peekNextParentId() {
  const year = new Date().getFullYear();
  await ensureCounterInitialized(year);
  const doc = await ParentIdCounter.findOne({ year }).select("seq").lean();
  const nextSeq = (doc?.seq || 0) + 1;
  return `PRN-${year}-${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Generates a contiguous block of Parent IDs atomically in one update.
 * Eliminates N round-trips to MongoDB during bulk imports.
 */
async function generateNextParentIdBlock(count) {
  if (!count || count <= 0) return [];
  const year = new Date().getFullYear();
  await ensureCounterInitialized(year);

  const doc = await ParentIdCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: count } },
    { new: true, upsert: true }
  );

  const endSeq = doc.seq;
  const startSeq = endSeq - count + 1;
  const ids = [];
  for (let s = startSeq; s <= endSeq; s++) {
    ids.push(`PRN-${year}-${String(s).padStart(4, "0")}`);
  }
  return ids;
}

module.exports = { generateNextParentId, peekNextParentId, generateNextParentIdBlock };
