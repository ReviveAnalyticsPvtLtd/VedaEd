import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveAcademicStructure,
} from "../../services/setupWizardAPI";
import {
  DEFAULT_ACADEMIC_FORM,
  SUBJECT_FRAMEWORK_OPTIONS,
  STREAM_OPTIONS,
} from "../constants/academicStructure";
import {
  SETUP_ROUTES,
  STEP_6_NUMBER,
  STEP_6_PROGRESS,
  STEP_7_NUMBER,
  STEP_7_PROGRESS,
} from "../constants/setupWizard";
import {
  applyPatternDates,
  estimateSections,
  formatGradeRange,
  getAcademicRecommendationText,
  getDependencyStatus,
  getSmartCheckMessages,
  includesSeniorGrades,
  mapWizardDataToAcademicForm,
} from "../utils/academicStructure";
import { isValidGradeRange } from "../recommendation/gradeUtils";

const ACADEMIC_YEAR_REGEX = /^(\d{4})-(\d{4})$/;

function normalizeAcademicYearInput(value) {
  return String(value || "")
    .replace(/[^\d-]/g, "")
    .slice(0, 9);
}

function isValidAcademicYearRange(academicYear) {
  const currentYear = new Date().getFullYear();
  const match = String(academicYear || "").match(ACADEMIC_YEAR_REGEX);
  if (!match) {
    return "Academic year must be in YYYY-YYYY format (e.g., 2026-2027)";
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) {
    return "Academic year must be continuous (e.g., 2026-2027)";
  }

  if (startYear < currentYear) {
    return `Academic year must start from ${currentYear} or later`;
  }

  return "";
}

function academicYearNeedsReset(academicYear) {
  return Boolean(isValidAcademicYearRange(academicYear));
}

function mergeFormWithDefaults(saved, step4Grades) {
  const base = { ...DEFAULT_ACADEMIC_FORM };
  const mapped = mapWizardDataToAcademicForm(saved) || {};
  const resolvedGradeFrom = step4Grades?.gradeFrom || mapped.gradeFrom || base.gradeFrom;
  const resolvedGradeTo = step4Grades?.gradeTo || mapped.gradeTo || base.gradeTo;

  const merged = {
    ...base,
    ...mapped,
    gradeFrom: resolvedGradeFrom,
    gradeTo: resolvedGradeTo,
  };

  if (!merged.academicYear && merged.academicYearStart) {
    merged.academicYear = DEFAULT_ACADEMIC_FORM.academicYear;
  }

  if (
    includesSeniorGrades(merged.gradeFrom, merged.gradeTo) &&
    merged.streams.length === 0
  ) {
    merged.streams = DEFAULT_ACADEMIC_FORM.streams;
  }

  if (academicYearNeedsReset(merged.academicYear)) {
    merged.academicYear = base.academicYear;
    merged.academicYearPattern = base.academicYearPattern;
    merged.academicYearStart = base.academicYearStart;
    merged.academicYearEnd = base.academicYearEnd;
  }

  const allowedSubjectFrameworks = new Set(
    SUBJECT_FRAMEWORK_OPTIONS.map((option) => option.key)
  );
  if (!allowedSubjectFrameworks.has(merged.subjectFramework)) {
    merged.subjectFramework = base.subjectFramework;
  }

  return merged;
}

function validateForm(form) {
  const errors = {};

  if (!form.academicYear?.trim()) {
    errors.academicYear = "Academic year is required";
  } else {
    const academicYearError = isValidAcademicYearRange(form.academicYear);
    if (academicYearError) {
      errors.academicYear = academicYearError;
    }
  }

  if (!form.gradeFrom?.trim()) {
    errors.gradeFrom = "Grade from is required";
  }

  if (!form.gradeTo?.trim()) {
    errors.gradeTo = "Grade to is required";
  }

  if (
    form.gradeFrom &&
    form.gradeTo &&
    !isValidGradeRange(form.gradeFrom, form.gradeTo)
  ) {
    errors.gradeRange = "Grade to must be equal to or after grade from";
  }

  const expected = Number(form.expectedStudents);
  if (!Number.isFinite(expected) || expected < 1) {
    errors.expectedStudents = "Enter a valid expected student count";
  }

  const maxPer = Number(form.maxStudentsPerSection);
  if (!Number.isFinite(maxPer) || maxPer < 1) {
    errors.maxStudentsPerSection = "Enter a valid max students per section";
  }

  return errors;
}

export function useSetupWizardStep6() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_ACADEMIC_FORM);
  const [lockedGradeRange, setLockedGradeRange] = useState({
    gradeFrom: DEFAULT_ACADEMIC_FORM.gradeFrom,
    gradeTo: DEFAULT_ACADEMIC_FORM.gradeTo,
  });
  const [curriculumBoard, setCurriculumBoard] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data) {
          const data = res.data;
          const step4Grades = {
            gradeFrom: data.gradeFrom,
            gradeTo: data.gradeTo,
          };
          setForm(
            mergeFormWithDefaults(data, step4Grades)
          );
          setLockedGradeRange((prev) => ({
            gradeFrom: step4Grades.gradeFrom || prev.gradeFrom,
            gradeTo: step4Grades.gradeTo || prev.gradeTo,
          }));
          setCurriculumBoard(data.curriculumBoard || "");
          setInstitutionType(data.institutionType || "");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast("Unable to load saved progress. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const estimatedSections = useMemo(
    () => estimateSections(form.expectedStudents, form.maxStudentsPerSection),
    [form.expectedStudents, form.maxStudentsPerSection]
  );

  const showStreams = useMemo(
    () => includesSeniorGrades(form.gradeFrom, form.gradeTo),
    [form.gradeFrom, form.gradeTo]
  );

  const gradeRangeLabel = useMemo(
    () => formatGradeRange(form.gradeFrom, form.gradeTo),
    [form.gradeFrom, form.gradeTo]
  );

  const recommendationText = useMemo(
    () => getAcademicRecommendationText(curriculumBoard, institutionType),
    [curriculumBoard, institutionType]
  );

  const dependencyStatus = useMemo(() => getDependencyStatus(form), [form]);

  const smartCheckMessages = useMemo(() => getSmartCheckMessages(form), [form]);

  const summarySubtitle = useMemo(() => {
    const board = curriculumBoard || "CBSE";
    return `${board}-style K12 academic structure is being prepared.`;
  }, [curriculumBoard]);

  const updateField = useCallback((name, value) => {
    if (name === "gradeFrom" || name === "gradeTo") return;
    const numericFields = ["expectedStudents", "maxStudentsPerSection"];
    let nextValue = numericFields.includes(name) ? Number(value) : value;
    if (name === "academicYear") {
      nextValue = normalizeAcademicYearInput(value);
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === "gradeFrom" || name === "gradeTo") delete next.gradeRange;
      return next;
    });
  }, []);

  const handlePatternChange = useCallback((pattern) => {
    setForm((prev) => applyPatternDates(pattern, prev));
  }, []);

  const handleTermSelect = useCallback((term) => {
    updateField("termStructure", term);
  }, [updateField]);

  const handleSectionModeSelect = useCallback((mode) => {
    updateField("sectionMode", mode);
  }, [updateField]);

  const handleSubjectFrameworkSelect = useCallback((key) => {
    updateField("subjectFramework", key);
  }, [updateField]);

  const toggleStream = useCallback((stream) => {
    setForm((prev) => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter((s) => s !== stream)
        : [...prev.streams, stream],
    }));
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false, draft = false } = {}) => ({
      draft,
      academicYear: form.academicYear,
      academicYearPattern: form.academicYearPattern,
      academicYearStart: form.academicYearStart,
      academicYearEnd: form.academicYearEnd,
      termStructure: form.termStructure,
      gradeFrom: lockedGradeRange.gradeFrom,
      gradeTo: lockedGradeRange.gradeTo,
      expectedStudents: Number(form.expectedStudents),
      maxStudentsPerSection: Number(form.maxStudentsPerSection),
      sectionMode: form.sectionMode,
      streams: showStreams ? form.streams : [],
      subjectFramework: form.subjectFramework,
      currentStep: advancing ? STEP_7_NUMBER : STEP_6_NUMBER,
      progressPercentage: advancing ? STEP_7_PROGRESS : STEP_6_PROGRESS,
      completedSteps: advancing ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5],
    }),
    [form, showStreams, lockedGradeRange]
  );

  const persistStep = useCallback(
    async (options = {}) => {
      const { advancing = false, draft = false } = options;

      if (!draft && !advancing) {
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setToast("Please fix the highlighted fields before continuing.");
          return false;
        }
      }

      if (!draft && advancing) {
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setToast("Please complete all required academic structure fields.");
          return false;
        }
      }

      setSaving(true);
      setToast("");

      try {
        const res = await saveAcademicStructure(buildPayload({ advancing, draft }));
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save academic structure";
        setToast(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, form]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate("/form/step-7");
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(5));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(SETUP_ROUTES.START);
    }
  }, [persistStep, navigate]);

  return {
    form,
    errors,
    loading,
    saving,
    toast,
    estimatedSections,
    showStreams,
    gradeRangeLabel,
    lockedGradeRange,
    recommendationText,
    dependencyStatus,
    smartCheckMessages,
    summarySubtitle,
    streamOptions: STREAM_OPTIONS,
    updateField,
    handlePatternChange,
    handleTermSelect,
    handleSectionModeSelect,
    handleSubjectFrameworkSelect,
    toggleStream,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
