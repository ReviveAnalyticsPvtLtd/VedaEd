import {
  GRADE_OPTIONS,
  CURRICULUM_BOARDS_BY_COUNTRY,
} from "../constants/schoolTypeCurriculum";
import {
  generateRecommendation,
  getSmartCheckMessages,
} from "../recommendation/recommendationEngine";
import { getGradeOrder } from "../recommendation/gradeUtils";

export { getGradeOrder, generateRecommendation, getSmartCheckMessages };

export function getGradeSelectOptions() {
  return GRADE_OPTIONS.map((g) => ({ value: g.value, label: g.label }));
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
