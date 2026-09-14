const Class = require("../classSchema");
const Section = require("../../section/sectionSchema");

const CANONICAL_GRADES = [
  "Nursery",
  "LKG",
  "UKG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

const GRADE_ORDER_MAP = {
  nursery: 0,
  lkg: 1,
  ukg: 2,
  kg: 1,
  kindergarten: 1,
  "grade 1": 3,
  "class 1": 3,
  "1st grade": 3,
  "1": 3,
  "grade 2": 4,
  "class 2": 4,
  "2nd grade": 4,
  "2": 4,
  "grade 3": 5,
  "class 3": 5,
  "3rd grade": 5,
  "3": 5,
  "grade 4": 6,
  "class 4": 6,
  "4th grade": 6,
  "4": 6,
  "grade 5": 7,
  "class 5": 7,
  "5th grade": 7,
  "5": 7,
  "grade 6": 8,
  "class 6": 8,
  "6th grade": 8,
  "6": 8,
  "grade 7": 9,
  "class 7": 9,
  "7th grade": 9,
  "7": 9,
  "grade 8": 10,
  "class 8": 10,
  "8th grade": 10,
  "8": 10,
  "grade 9": 11,
  "class 9": 11,
  "9th grade": 11,
  "9": 11,
  "grade 10": 12,
  "class 10": 12,
  "10th grade": 12,
  "10": 12,
  "grade 11": 13,
  "class 11": 13,
  "11th grade": 13,
  "11": 13,
  "grade 12": 14,
  "class 12": 14,
  "12th grade": 14,
  "12": 14,
};

const escapeRegex = (str) =>
  String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Get numerical index for a grade label.
 */
function getGradeIndex(gradeLabel) {
  if (!gradeLabel) return -1;
  const key = String(gradeLabel).trim().toLowerCase();
  return GRADE_ORDER_MAP[key] ?? -1;
}

/**
 * Normalizes any class name to canonical standard:
 * - "Class 1", "class 1 ", "1st grade" -> "Grade 1"
 * - "Class 10" -> "Grade 10"
 * - "Nursery", "nursery" -> "Nursery"
 * - "LKG", "lkg" -> "LKG"
 * - "UKG", "ukg" -> "UKG"
 * - "Grade 5" -> "Grade 5"
 */
function normalizeClassName(inputName) {
  if (!inputName) return "";
  const raw = String(inputName).trim();
  const lower = raw.toLowerCase();

  if (lower === "nursery") return "Nursery";
  if (lower === "lkg") return "LKG";
  if (lower === "ukg") return "UKG";
  if (lower === "kg") return "KG";
  if (lower === "kindergarten") return "Kindergarten";

  const numMatch = raw.match(/\d{1,2}/);
  if (
    numMatch &&
    (lower.includes("class") ||
      lower.includes("grade") ||
      /^\d{1,2}(st|nd|rd|th)?$/i.test(lower))
  ) {
    return `Grade ${Number(numMatch[0])}`;
  }

  return raw.replace(/\s+/g, " ");
}

/**
 * Returns numerical weight for sorting classes in canonical academic order:
 * Nursery (0) -> LKG (1) -> UKG (2) -> KG (2.5) -> Grade 1 (4) -> ... -> Grade 12 (15)
 */
function getGradeSortOrder(name) {
  const lower = String(name || "").trim().toLowerCase();
  if (lower === "nursery") return 0;
  if (lower === "lkg") return 1;
  if (lower === "ukg") return 2;
  if (lower === "kg" || lower === "kindergarten") return 2.5;

  const numMatch = lower.match(/\d{1,2}/);
  if (numMatch) {
    return 3 + Number(numMatch[0]);
  }
  return 100; // other custom classes at end
}

/**
 * Sorts an array of class objects or class name strings in academic order.
 */
function sortClasses(classes = []) {
  return [...classes].sort((a, b) => {
    const nameA = typeof a === "string" ? a : a?.name || "";
    const nameB = typeof b === "string" ? b : b?.name || "";
    return getGradeSortOrder(nameA) - getGradeSortOrder(nameB);
  });
}

/**
 * Resolves an ordered array of grade strings based on gradeFrom, gradeTo, and institutionType.
 */
function resolveGradeList({ gradeFrom, gradeTo, institutionType } = {}) {
  const fromTrimmed = String(gradeFrom || "").trim();
  const toTrimmed = String(gradeTo || "").trim();

  if (fromTrimmed && toTrimmed) {
    const fromIdx = getGradeIndex(fromTrimmed);
    const toIdx = getGradeIndex(toTrimmed);

    if (fromIdx >= 0 && toIdx >= 0 && toIdx >= fromIdx) {
      // Special handling if explicitly passed "KG"
      const isFromKg = fromTrimmed.toUpperCase() === "KG";
      const isToKg = toTrimmed.toUpperCase() === "KG";

      if (isFromKg && isToKg) {
        return ["KG"];
      }
      if (fromTrimmed.toLowerCase() === "nursery" && isToKg) {
        return ["Nursery", "KG"];
      }

      const list = CANONICAL_GRADES.slice(fromIdx, toIdx + 1);
      return list.length > 0 ? list : [normalizeClassName(fromTrimmed)];
    }
  }

  // Fallbacks by institutionType
  const instType = String(institutionType || "").trim().toLowerCase();
  if (instType === "preschool") {
    return ["Nursery", "LKG", "UKG"];
  }
  if (instType === "higher_secondary") {
    return ["Grade 11", "Grade 12"];
  }
  if (instType === "k12_school") {
    return [...CANONICAL_GRADES];
  }

  return [...CANONICAL_GRADES];
}

/**
 * Determine default section names from setup configuration.
 * An explicit `sections` count (per class) takes precedence over the
 * auto-calculated estimate derived from expectedStudents/maxStudentsPerSection.
 */
function resolveSectionNames({
  sectionMode,
  expectedStudents,
  maxStudentsPerSection,
  sections,
} = {}) {
  const explicitCount = Number(sections);
  if (Number.isFinite(explicitCount) && explicitCount >= 1) {
    const razorCount = Math.min(26, Math.floor(explicitCount));
    return Array.from({ length: razorCount }, (_, i) =>
      String.fromCharCode(65 + i)
    );
  }

  const mode = String(sectionMode || "auto").trim().toLowerCase();
  const expected = Number(expectedStudents);
  const max = Number(maxStudentsPerSection);

  if (mode === "auto" && Number.isFinite(expected) && expected > 0 && Number.isFinite(max) && max > 0) {
    const sectionCount = Math.min(26, Math.max(1, Math.ceil(expected / max)));
    const sections = [];
    for (let i = 0; i < sectionCount; i++) {
      sections.push(String.fromCharCode(65 + i)); // 'A', 'B', 'C', ...
    }
    return sections;
  }

  return ["A"];
}

/**
 * Fetch or create Section documents for the given section names and capacity.
 * Updates capacity for existing sections if a new valid capacity is specified.
 */
async function getOrCreateSections(sectionNames = ["A"], capacity = 40) {
  const sectionIds = [];
  const parsedCap = Number.isFinite(Number(capacity)) && Number(capacity) > 0
    ? Number(capacity)
    : 40;

  for (const name of sectionNames) {
    const trimmed = String(name || "").trim();
    if (!trimmed) continue;

    let secDoc = await Section.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
    });

    if (!secDoc) {
      secDoc = await Section.create({ name: trimmed, capacity: parsedCap });
    } else {
      if (secDoc.capacity !== parsedCap) {
        secDoc.capacity = parsedCap;
        await secDoc.save();
      }
    }
    sectionIds.push(secDoc._id);
  }
  return sectionIds;
}

/**
 * Checks if an existing class matches a given target grade name.
 */
function matchesGrade(existingClassName, targetGradeName) {
  const existing = String(existingClassName || "").trim().toLowerCase();
  const target = String(targetGradeName || "").trim().toLowerCase();

  if (existing === target) return true;

  // Extract digits (e.g., "10" from "Grade 10", "Class 10", "10th Grade")
  const targetNumMatch = target.match(/\d{1,2}/);
  const existingNumMatch = existing.match(/\d{1,2}/);
  if (targetNumMatch && existingNumMatch && targetNumMatch[0] === existingNumMatch[0]) {
    const isTargetGradeOrClass =
      target.includes("grade") ||
      target.includes("class") ||
      /^\d{1,2}(st|nd|rd|th)?$/.test(target);
    const isExistingGradeOrClass =
      existing.includes("grade") ||
      existing.includes("class") ||
      /^\d{1,2}(st|nd|rd|th)?$/.test(existing);
    if (isTargetGradeOrClass && isExistingGradeOrClass) {
      return true;
    }
  }

  // Pre-primary aliases
  if (
    (target === "nursery" && existing === "nursery") ||
    (target === "lkg" && existing === "lkg") ||
    (target === "ukg" && existing === "ukg") ||
    ((target === "kg" || target === "kindergarten") &&
      (existing === "kg" || existing === "kindergarten"))
  ) {
    return true;
  }

  return false;
}

/**
 * Safely normalizes all existing Class documents in MongoDB in-place.
 * Preserves all ObjectIds and references.
 */
async function normalizeExistingClassesInDb() {
  const existingClasses = await Class.find({});
  const updated = [];

  for (const cls of existingClasses) {
    const canonicalName = normalizeClassName(cls.name);
    if (cls.name !== canonicalName) {
      const duplicate = existingClasses.find(
        (c) => c._id.toString() !== cls._id.toString() && c.name === canonicalName
      );

      if (!duplicate) {
        const oldName = cls.name;
        cls.name = canonicalName;
        await cls.save();
        updated.push({ id: cls._id, oldName, newName: canonicalName });
      }
    }
  }

  return {
    success: true,
    updatedCount: updated.length,
    updated,
  };
}

/**
 * Automate Class and Section creation/fetching based on academic configuration.
 * Idempotent: Never creates duplicates. Reuses existing classes and sections.
 * Normalizes existing class names in-place to the canonical Grade standard.
 * Updates section and class capacity safely.
 *
 * @param {Object} academicConfig - { gradeFrom, gradeTo, institutionType, expectedStudents, maxStudentsPerSection, capacity, sections, sectionMode }
 * @returns {Promise<Object>} Automation summary
 */
async function syncClassesAndSections(academicConfig = {}) {
  try {
    const gradeList = resolveGradeList(academicConfig);
    if (!gradeList || gradeList.length === 0) {
      return {
        success: false,
        message: "No grades could be resolved from academic configuration",
        classesCreated: [],
        classesReused: [],
      };
    }

    const rawCap = academicConfig.capacity ?? academicConfig.maxStudentsPerSection;
    const targetCapacity = Number.isFinite(Number(rawCap)) && Number(rawCap) > 0
      ? Number(rawCap)
      : 40;
    const targetCapacityStr = String(targetCapacity);

    const sectionNames = resolveSectionNames(academicConfig);
    const sectionIds = await getOrCreateSections(sectionNames, targetCapacity);

    const existingClasses = await Class.find({});
    const createdClasses = [];
    const reusedClasses = [];

    for (const rawGradeName of gradeList) {
      const canonicalGradeName = normalizeClassName(rawGradeName);
      const existing = existingClasses.find((cls) =>
        matchesGrade(cls.name, canonicalGradeName)
      );

      if (existing) {
        let changed = false;

        // In-place normalize name if legacy (e.g. "Class 1 " -> "Grade 1")
        if (existing.name !== canonicalGradeName) {
          existing.name = canonicalGradeName;
          changed = true;
        }

        // Update class capacity if different
        if (existing.capacity !== targetCapacityStr) {
          existing.capacity = targetCapacityStr;
          changed = true;
        }

        // If class has no sections, ensure sectionIds are linked
        if (!existing.sections || existing.sections.length === 0) {
          existing.sections = sectionIds;
          changed = true;
        } else {
          // Reconcile count increases: append any section that is missing.
          // Never removes existing sections to avoid orphaning students/data.
          const currentIds = new Set(existing.sections.map((s) => String(s)));
          const missing = sectionIds.filter((id) => !currentIds.has(String(id)));
          if (missing.length > 0) {
            existing.sections = [...existing.sections, ...missing];
            changed = true;
          }
        }

        if (changed) {
          await existing.save();
        }

        reusedClasses.push({
          _id: existing._id,
          name: existing.name,
          capacity: existing.capacity,
          sections: existing.sections,
        });
      } else {
        const newClass = await Class.create({
          name: canonicalGradeName,
          sections: sectionIds,
          capacity: targetCapacityStr,
        });
        createdClasses.push({
          _id: newClass._id,
          name: newClass.name,
          capacity: newClass.capacity,
          sections: newClass.sections,
        });
        existingClasses.push(newClass);
      }
    }

    return {
      success: true,
      gradeList,
      sectionNames,
      capacity: targetCapacity,
      classesCreated: createdClasses,
      classesReused: reusedClasses,
      totalClasses: createdClasses.length + reusedClasses.length,
      message: `Successfully synchronized ${createdClasses.length} new and ${reusedClasses.length} existing classes with ${sectionNames.length} sections (Capacity: ${targetCapacity}).`,
    };
  } catch (error) {
    console.error("syncClassesAndSections error:", error);
    return {
      success: false,
      error: error.message,
      classesCreated: [],
      classesReused: [],
    };
  }
}

module.exports = {
  CANONICAL_GRADES,
  GRADE_ORDER_MAP,
  getGradeIndex,
  normalizeClassName,
  getGradeSortOrder,
  sortClasses,
  resolveGradeList,
  resolveSectionNames,
  getOrCreateSections,
  matchesGrade,
  normalizeExistingClassesInDb,
  syncClassesAndSections,
};
