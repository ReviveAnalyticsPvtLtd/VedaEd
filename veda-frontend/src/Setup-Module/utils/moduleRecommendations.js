import { INSTITUTION_TYPES } from "../constants/schoolTypeCurriculum";

const BASE_RECOMMENDATIONS = [
  {
    key: "Transport",
    title: "Transport",
    reason:
      "Enable if your school manages buses, routes, or stop-wise fees.",
  },
  {
    key: "Health",
    title: "Health",
    reason:
      "Recommended for student health profiles, allergies, and emergency readiness.",
  },
  {
    key: "HR",
    title: "HR",
    reason:
      "Recommended because teacher onboarding and staff records are needed after launch.",
  },
];

const INSTITUTION_SUBTITLES = {
  [INSTITUTION_TYPES.PRESCHOOL]: "Based on your preschool setup.",
  [INSTITUTION_TYPES.K12]: "Based on your K12 school setup.",
  [INSTITUTION_TYPES.HIGHER_SECONDARY]:
    "Based on your higher secondary setup.",
};

const INSTITUTION_OVERRIDES = {
  [INSTITUTION_TYPES.PRESCHOOL]: [
    {
      key: "Health",
      title: "Health",
      reason:
        "Useful for allergies, medications, and guardian emergency contacts in early years.",
    },
    {
      key: "LMS",
      title: "LMS",
      reason:
        "Share activities, learning material, and parent updates for preschool classrooms.",
    },
  ],
  [INSTITUTION_TYPES.HIGHER_SECONDARY]: [
    {
      key: "LMS",
      title: "LMS",
      reason:
        "Supports assignments, digital content, and stream-wise learning resources.",
    },
    {
      key: "Library",
      title: "Library",
      reason:
        "Helpful for reference materials and board-exam preparation resources.",
    },
  ],
};

export function getRecommendationSubtitle(institutionType) {
  return (
    INSTITUTION_SUBTITLES[institutionType] ||
    "Based on your school setup."
  );
}

export function getModuleRecommendations(institutionType) {
  const overrides = INSTITUTION_OVERRIDES[institutionType];
  if (overrides?.length) {
    return overrides.slice(0, 3);
  }
  return BASE_RECOMMENDATIONS;
}
