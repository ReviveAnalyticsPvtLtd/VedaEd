import {
  GRADE_OPTIONS,
  CURRICULUM_BOARDS_BY_COUNTRY,
  INSTITUTION_TYPES,
} from "../constants/schoolTypeCurriculum";
import {
  generateRecommendation,
  getSmartCheckMessages,
} from "../recommendation/recommendationEngine";
import { getGradeOrder } from "../recommendation/gradeUtils";

export { getGradeOrder, generateRecommendation, getSmartCheckMessages };

const GRADE_OPTIONS_BY_INSTITUTION = {
  [INSTITUTION_TYPES.PRESCHOOL]: ["Nursery", "LKG", "UKG"],
  [INSTITUTION_TYPES.K12]: GRADE_OPTIONS.map((g) => g.value),
  [INSTITUTION_TYPES.HIGHER_SECONDARY]: ["Grade 11", "Grade 12"],
};

export function getGradeSelectOptions(institutionType) {
  const allowedGrades =
    GRADE_OPTIONS_BY_INSTITUTION[institutionType] ||
    GRADE_OPTIONS_BY_INSTITUTION[INSTITUTION_TYPES.K12];

  return GRADE_OPTIONS.filter((g) => allowedGrades.includes(g.value)).map(
    (g) => ({
      value: g.value,
      label: g.label,
    })
  );
}

export function getBoardOptionsForCountry(countryName) {
  if (!countryName) return [];
  const boards = CURRICULUM_BOARDS_BY_COUNTRY[countryName] || [];
  return boards.map((b) => ({ value: b, label: b }));
}

/** Alias for components that used the legacy helper name */
export function getCurriculumRecommendation(input) {
  return generateRecommendation(input);
}
