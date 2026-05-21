import {
  INSTITUTION_TYPES,
  GRADE_OPTIONS,
  CURRICULUM_BOARDS_BY_COUNTRY,
} from "../constants/schoolTypeCurriculum";

export function getGradeOrder(gradeLabel) {
  if (!gradeLabel) return -1;
  const found = GRADE_OPTIONS.find((g) => g.value === gradeLabel);
  return found ? found.order : -1;
}

export function getGradeSelectOptions() {
  return GRADE_OPTIONS.map((g) => ({ value: g.value, label: g.label }));
}

export function getBoardOptionsForCountry(countryName) {
  if (!countryName) return [];
  const boards = CURRICULUM_BOARDS_BY_COUNTRY[countryName] || [];
  return boards.map((b) => ({ value: b, label: b }));
}

function formatGradeRange(gradeFrom, gradeTo) {
  if (!gradeFrom && !gradeTo) return "";
  if (gradeFrom === gradeTo) return gradeFrom;
  return `${gradeFrom}–${gradeTo}`;
}

function includesSeniorGrades(gradeFrom, gradeTo) {
  const fromOrder = getGradeOrder(gradeFrom);
  const toOrder = getGradeOrder(gradeTo);
  return toOrder >= getGradeOrder("Grade 11") && fromOrder <= getGradeOrder("Grade 12");
}

/**
 * Dynamic template recommendation based on institution, country, board, and grades.
 */
export function getCurriculumRecommendation({
  institutionType,
  country,
  curriculumBoard,
  gradeFrom,
  gradeTo,
}) {
  const board = String(curriculumBoard || "").trim();
  const region = String(country || "").trim();
  const range = formatGradeRange(gradeFrom, gradeTo);
  const hasSenior = includesSeniorGrades(gradeFrom, gradeTo);

  if (!institutionType || !region || !board) {
    return {
      title: "Select your setup",
      confidence: null,
      reason: "Choose institution type, country, and board to see a tailored template.",
      features: [
        "Exam structure recommendations",
        "Grading format suggestions",
        "Subject framework preview",
        "Promotion rule hints",
      ],
    };
  }

  const isCbseIndia =
    region === "India" &&
    board.toUpperCase() === "CBSE" &&
    institutionType === INSTITUTION_TYPES.K12;

  if (isCbseIndia) {
    const features = [
      "2-term exam structure",
      "Marks + Grade result format",
    ];
    if (hasSenior) features.push("Streams for Grade 11-12");
    features.push("Standard subject framework");

    return {
      title: "CBSE K12 Template",
      confidence: hasSenior ? 98 : 94,
      reason: `Recommended because you selected ${region}, ${board}, K12 School, and ${range || "your grade range"}.`,
      features,
    };
  }

  if (institutionType === INSTITUTION_TYPES.PRESCHOOL) {
    return {
      title: `${board || "Early Years"} Preschool Template`,
      confidence: 88,
      reason: `Recommended for ${region} preschool with ${board || "your selected"} approach.`,
      features: [
        "Activity-based progress tracking",
        "Guardian pickup workflows",
        "Observation rubrics",
        "Age-group class structure",
      ],
    };
  }

  if (institutionType === INSTITUTION_TYPES.HIGHER_SECONDARY) {
    return {
      title: `${board || "Senior Secondary"} Template`,
      confidence: 91,
      reason: `Recommended for ${region}, ${board}, and ${range || "Grade 11-12"}.`,
      features: [
        "Stream & elective setup",
        "Board exam preparation",
        "Promotion rules for senior grades",
        "Marks + grade reporting",
      ],
    };
  }

  return {
    title: `${board} ${institutionType === INSTITUTION_TYPES.K12 ? "K12" : "School"} Template`,
    confidence: 86,
    reason: `Recommended because you selected ${region}, ${board}, and ${range || "your grade range"}.`,
    features: [
      "Flexible term structure",
      "Configurable grading scale",
      hasSenior ? "Streams for senior grades" : "Class-section mapping",
      "Core subject framework",
    ],
  };
}

export function getSmartCheckMessages({
  institutionType,
  gradeFrom,
  gradeTo,
}) {
  const messages = [];
  if (includesSeniorGrades(gradeFrom, gradeTo)) {
    messages.push(
      "Grades include 11–12, so VedaSchool will ask about streams and electives in the academic setup."
    );
  }
  if (institutionType === INSTITUTION_TYPES.PRESCHOOL) {
    messages.push(
      "Preschool mode focuses on activities and observations rather than formal exams."
    );
  }
  if (institutionType === INSTITUTION_TYPES.HIGHER_SECONDARY) {
    messages.push(
      "Higher secondary setup will prioritize streams, electives, and board exam workflows."
    );
  }
  return messages;
}
