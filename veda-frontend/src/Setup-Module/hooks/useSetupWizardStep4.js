import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveSchoolTypeCurriculum,
} from "../../services/setupWizardAPI";
import {
  DEFAULT_SCHOOL_TYPE_FORM,
  INSTITUTION_DEFAULT_GRADES,
  INSTITUTION_TYPES,
  LANGUAGE_PREFERENCES,
} from "../constants/schoolTypeCurriculum";
import {
  SETUP_ROUTES,
  STEP_4_NUMBER,
  STEP_4_PROGRESS,
  STEP_5_NUMBER,
} from "../constants/setupWizard";
import {
  getCurriculumRecommendation,
  getGradeOrder,
  getSmartCheckMessages,
} from "../utils/curriculumRecommendations";
import { findCountryByNameOrCode } from "../services/localizationData";

const VALID_INSTITUTION_TYPES = Object.values(INSTITUTION_TYPES);

function mapSavedToForm(data) {
  if (!data) return { ...DEFAULT_SCHOOL_TYPE_FORM };

  const curriculumCountry =
    data.curriculumCountry ||
    data.country ||
    "";

  return {
    institutionType:
      data.institutionType || DEFAULT_SCHOOL_TYPE_FORM.institutionType,
    country: curriculumCountry,
    curriculumBoard: data.curriculumBoard || "",
    gradeFrom: data.gradeFrom || DEFAULT_SCHOOL_TYPE_FORM.gradeFrom,
    gradeTo: data.gradeTo || DEFAULT_SCHOOL_TYPE_FORM.gradeTo,
    languagePreference:
      data.languagePreference || LANGUAGE_PREFERENCES.ENGLISH,
    primaryThemeColor: data.primaryThemeColor,
  };
}

function validateForm(form) {
  const errors = {};

  if (
    !form.institutionType ||
    !VALID_INSTITUTION_TYPES.includes(form.institutionType)
  ) {
    errors.institutionType = "Select an institution type";
  }

  if (!form.country?.trim()) {
    errors.country = "Country / region is required";
  }

  if (!form.curriculumBoard?.trim()) {
    errors.curriculumBoard = "Board / curriculum is required";
  }

  if (!form.gradeFrom?.trim()) {
    errors.gradeFrom = "From grade is required";
  }

  if (!form.gradeTo?.trim()) {
    errors.gradeTo = "To grade is required";
  }

  const fromOrder = getGradeOrder(form.gradeFrom);
  const toOrder = getGradeOrder(form.gradeTo);
  if (
    form.gradeFrom &&
    form.gradeTo &&
    fromOrder >= 0 &&
    toOrder >= 0 &&
    toOrder < fromOrder
  ) {
    errors.gradeRange = "To grade cannot be earlier than From grade";
  }

  return errors;
}

export function useSetupWizardStep4() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...DEFAULT_SCHOOL_TYPE_FORM });
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
          const mapped = mapSavedToForm(res.data);
          if (!mapped.country && res.data.country) {
            const match = findCountryByNameOrCode(res.data.country);
            mapped.country = match?.name || res.data.country;
          }
          if (!mapped.curriculumBoard && mapped.country === "India") {
            mapped.curriculumBoard = mapped.curriculumBoard || "CBSE";
          }
          setForm(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast(" Unable to load saved progress. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recommendation = useMemo(
    () =>
      getCurriculumRecommendation({
        institutionType: form.institutionType,
        country: form.country,
        curriculumBoard: form.curriculumBoard,
        gradeFrom: form.gradeFrom,
        gradeTo: form.gradeTo,
      }),
    [form]
  );

  const smartCheckMessages = useMemo(
    () =>
      getSmartCheckMessages({
        institutionType: form.institutionType,
        gradeFrom: form.gradeFrom,
        gradeTo: form.gradeTo,
      }),
    [form.institutionType, form.gradeFrom, form.gradeTo]
  );

  const healthItems = useMemo(
    () => [
      {
        id: "institutionType",
        label: "Institution type",
        complete: Boolean(form.institutionType),
      },
      {
        id: "country",
        label: "Country / region",
        complete: Boolean(form.country?.trim()),
      },
      {
        id: "curriculumBoard",
        label: "Board / curriculum",
        complete: Boolean(form.curriculumBoard?.trim()),
      },
      {
        id: "gradeRange",
        label: "Grade range",
        complete:
          Boolean(form.gradeFrom?.trim() && form.gradeTo?.trim()) &&
          getGradeOrder(form.gradeTo) >= getGradeOrder(form.gradeFrom),
      },
    ],
    [form]
  );

  const buildPayload = useCallback(
    ({ advancing = false, draft = false } = {}) => ({
      draft,
      institutionType: form.institutionType,
      country: form.country.trim(),
      curriculumBoard: form.curriculumBoard.trim(),
      gradeFrom: form.gradeFrom,
      gradeTo: form.gradeTo,
      languagePreference: form.languagePreference,
      currentStep: advancing ? STEP_5_NUMBER : STEP_4_NUMBER,
      progressPercentage: STEP_4_PROGRESS,
      completedSteps: advancing ? [1, 2, 3, 4] : [1, 2, 3],
    }),
    [form]
  );

  const persistStep = useCallback(
    async (options = {}) => {
      const { advancing = false, draft = false } = options;
      const validationErrors = validateForm(form);
      if (!draft && Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setToast(" Please complete all required fields before continuing.");
        return false;
      }

      setErrors({});
      setSaving(true);
      setToast("");

      try {
        const res = await saveSchoolTypeCurriculum(
          buildPayload({ advancing, draft })
        );
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save school type and curriculum";
        setToast(`❌ ${msg}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, form]
  );

  const clearFieldError = useCallback((name) => {
    setErrors((prev) => {
      if (!prev[name] && !prev.gradeRange) return prev;
      const next = { ...prev };
      delete next[name];
      if (name === "gradeFrom" || name === "gradeTo") delete next.gradeRange;
      return next;
    });
  }, []);

  const updateField = useCallback(
    (name, value) => {
      setForm((prev) => ({ ...prev, [name]: value }));
      clearFieldError(name);
    },
    [clearFieldError]
  );

  const handleInstitutionChange = useCallback((institutionType) => {
    const defaults = INSTITUTION_DEFAULT_GRADES[institutionType];
    setForm((prev) => ({
      ...prev,
      institutionType,
      gradeFrom: defaults?.from || prev.gradeFrom,
      gradeTo: defaults?.to || prev.gradeTo,
    }));
    clearFieldError("institutionType");
  }, [clearFieldError]);

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(SETUP_ROUTES.step(5));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(3));
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
    recommendation,
    healthItems,
    smartCheckMessages,
    updateField,
    handleInstitutionChange,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
