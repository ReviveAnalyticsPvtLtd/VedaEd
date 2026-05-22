// Future Update:
// Replace static rule engine with AI-based recommendation engine
// using institution analytics and setup patterns.

const {
  RECOMMENDATION_RULES,
  SMART_CHECK_RULES,
} = require("./recommendationRules.config");
const {
  formatGradeRange,
  getGradeRangeCategory,
  includesSeniorGrades,
  isValidGradeRange,
} = require("./gradeUtils");

const BOARD_ALIASES = {
  "AMERICAN CURRICULUM": "American",
  "AMERICAN": "American",
  "COMMON CORE": "Common Core",
  "STATE STANDARDS": "State Standards",
  "NATIONAL CURRICULUM": "National Curriculum",
  "STATE BOARD": "State Board",
  "MOE UAE": "MOE UAE",
  "BRITISH": "British",
};

function normalizeBoard(board) {
  const trimmed = String(board || "").trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  return BOARD_ALIASES[upper] || trimmed;
}

function normalizeCountry(country) {
  return String(country || "").trim();
}

function ruleMatches(rule, ctx) {
  const { match } = rule;

  if (
    match.institutionTypes &&
    !match.institutionTypes.includes(ctx.institutionType)
  ) {
    return false;
  }

  if (match.countries && !match.countries.includes(ctx.country)) {
    return false;
  }

  if (match.boards && !match.boards.includes(ctx.normalizedBoard)) {
    return false;
  }

  if (match.gradeRanges && match.gradeRanges.length > 0) {
    const hasOverlap = match.gradeRanges.some((g) =>
      ctx.gradeCategories.includes(g)
    );
    if (!hasOverlap) return false;
  }

  return true;
}

function buildFeatures(output, ctx) {
  const features = [];
  const appliedRules = [];

  if (output.examStructure) {
    features.push(output.examStructure);
    appliedRules.push("exam_structure");
  }
  if (output.resultFormat) {
    features.push(output.resultFormat);
    appliedRules.push("result_format");
  }

  if (ctx.includesSenior && output.streamConfiguration) {
    features.push(output.streamConfiguration);
    appliedRules.push("stream_senior_grades");
  } else if (!ctx.includesSenior && output.streamConfiguration === "Not required") {
    /* skip stream line for primary */
  } else if (output.streamConfiguration && output.streamConfiguration !== "Not applicable") {
    if (!ctx.includesSenior && output.streamConfiguration.includes("Grade 11")) {
      /* skip */
    } else {
      features.push(output.streamConfiguration);
    }
  }

  if (output.subjectFramework) {
    features.push(output.subjectFramework);
    appliedRules.push("subject_framework");
  }

  if (output.extraFeatures) {
    output.extraFeatures.forEach((f) => features.push(f));
  }

  if (features.length < 3 && output.gradeSystem) {
    features.push(output.gradeSystem);
  }

  return { features: [...new Set(features)], appliedRules };
}

function computeConfidence(base, ctx, ruleId) {
  let score = base;

  if (ctx.isComplete) score += 2;
  if (ctx.includesSenior && ruleId.includes("k12")) score += 2;
  if (!ctx.country || !ctx.normalizedBoard) score -= 15;
  if (!ctx.isValidGrades) score -= 10;
  if (ruleId === "fallback_generic") score = Math.min(score, 75);

  return Math.min(99, Math.max(50, Math.round(score)));
}

function buildReason(ctx, output) {
  const range = formatGradeRange(ctx.gradeFrom, ctx.gradeTo);
  const instLabel =
    ctx.institutionType === "k12_school"
      ? "K12 School"
      : ctx.institutionType === "preschool"
        ? "Preschool"
        : ctx.institutionType === "higher_secondary"
          ? "Higher Secondary"
          : "your institution";

  if (!ctx.isComplete) {
    return "Choose institution type, country, and board to see a tailored template.";
  }

  return `Recommended because you selected ${ctx.country}, ${ctx.normalizedBoard}, ${instLabel}, and ${range || "your grade range"}.`;
}

/**
 * Core rule engine — analyzes inputs and returns recommendation payload.
 */
function generateRecommendation(input = {}) {
  const institutionType = String(input.institutionType || "").trim();
  const country = normalizeCountry(input.country || input.curriculumCountry);
  const normalizedBoard = normalizeBoard(
    input.curriculumBoard || input.selectedBoard
  );
  const gradeFrom = String(input.gradeFrom || "").trim();
  const gradeTo = String(input.gradeTo || "").trim();

  const gradeCategories = getGradeRangeCategory(gradeFrom, gradeTo);
  const includesSenior = includesSeniorGrades(gradeFrom, gradeTo);
  const isValidGrades = isValidGradeRange(gradeFrom, gradeTo);
  const isComplete = Boolean(
    institutionType && country && normalizedBoard && gradeFrom && gradeTo && isValidGrades
  );

  const ctx = {
    institutionType,
    country,
    normalizedBoard,
    gradeFrom,
    gradeTo,
    gradeCategories,
    includesSenior,
    isValidGrades,
    isComplete,
  };

  const sortedRules = [...RECOMMENDATION_RULES].sort(
    (a, b) => b.priority - a.priority
  );

  let matchedRule = sortedRules.find((rule) => ruleMatches(rule, ctx));
  if (!matchedRule) {
    matchedRule = sortedRules.find((r) => r.id === "fallback_generic");
  }

  const { output } = matchedRule;
  const { features, appliedRules } = buildFeatures(output, ctx);
  const confidence = isComplete
    ? computeConfidence(output.baseConfidence, ctx, matchedRule.id)
    : null;

  const recommendationRules = [
    `rule:${matchedRule.id}`,
    ...appliedRules,
  ];

  return {
    recommendationType: output.recommendationType,
    title: output.title,
    confidence,
    reason: buildReason(ctx, output),
    features,
    recommendationRules,
    matchedRuleId: matchedRule.id,
    institutionType: institutionType || null,
    selectedBoard: normalizedBoard || null,
    config: {
      examStructure: output.examStructure,
      resultFormat: output.resultFormat,
      subjectFramework: output.subjectFramework,
      gradeSystem: output.gradeSystem,
      streamConfiguration: ctx.includesSenior
        ? output.streamConfiguration
        : output.streamConfiguration === "Not applicable"
          ? "Not applicable"
          : "Optional for your grade range",
      attendanceSetup: output.attendanceSetup,
    },
    gradeRangeLabel: formatGradeRange(gradeFrom, gradeTo),
    gradeCategories,
  };
}

function getSmartCheckMessages(input = {}) {
  const institutionType = String(input.institutionType || "").trim();
  const country = normalizeCountry(input.country || input.curriculumCountry);
  const normalizedBoard = normalizeBoard(input.curriculumBoard);
  const gradeFrom = String(input.gradeFrom || "").trim();
  const gradeTo = String(input.gradeTo || "").trim();
  const gradeCategories = getGradeRangeCategory(gradeFrom, gradeTo);
  const includesSenior = includesSeniorGrades(gradeFrom, gradeTo);
  const isComplete = Boolean(
    institutionType &&
      country &&
      normalizedBoard &&
      gradeFrom &&
      gradeTo &&
      isValidGradeRange(gradeFrom, gradeTo)
  );

  const ctx = {
    institutionType,
    country,
    normalizedBoard,
    gradeCategories,
    includesSenior,
    isComplete,
  };

  const seen = new Set();
  const messages = [];

  for (const rule of SMART_CHECK_RULES) {
    if (rule.when(ctx) && !seen.has(rule.message)) {
      seen.add(rule.message);
      messages.push(rule.message);
    }
  }

  return messages.slice(0, 4);
}

function recommendationToStoredFields(recommendation) {
  if (!recommendation) return {};
  return {
    recommendationType: recommendation.recommendationType || "",
    recommendationConfidence: recommendation.confidence ?? null,
    recommendationRules: recommendation.recommendationRules || [],
  };
}

module.exports = {
  generateRecommendation,
  getSmartCheckMessages,
  recommendationToStoredFields,
  normalizeBoard,
  normalizeCountry,
};
