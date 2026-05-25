import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getExaminationGradebookSetup,
  getSetupWizard,
  saveExaminationGradebookSetup,
  updateExaminationGradebookSetup,
} from "../../services/setupWizardAPI";
import {
  STEP_8_NUMBER,
  STEP_10_NUMBER,
  WIZARD_STEP_PATH,
} from "../constants/setupWizard";
import {
  DEFAULT_STEP9_FORM,
  STEP_9_NUMBER,
  STEP_9_PROGRESS,
  STEP_9_TOTAL_STEPS,
} from "../constants/examinationGradebook";
import {
  buildStep9Payload,
  createLocalRowId,
  getExamSummary,
  getRecommendationText,
  getSmartChecks,
  getWeightageTotal,
  mapWizardDataToStep9Form,
  resolveDependencyStatus,
  validateStep9Form,
} from "../utils/examinationGradebook";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const START_PATH = "/setup/start";

export function useSetupWizardStep9() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_STEP9_FORM);
  const [errors, setErrors] = useState({
    gradeTableRows: {},
    assessmentWeightageRows: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [wizardMeta, setWizardMeta] = useState({});
  const [dependencyStatus, setDependencyStatus] = useState([]);
  const [hasPersistedStep9, setHasPersistedStep9] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wizardRes, step9Res] = await Promise.all([
          getSetupWizard(),
          getExaminationGradebookSetup(),
        ]);

        const wizardData = wizardRes?.data || {};
        const existingStep9 = wizardData?.step9ExaminationGradebook || null;

        if (!cancelled) {
          setWizardMeta(wizardData);
          setHasPersistedStep9(Boolean(existingStep9));

          const mapped = mapWizardDataToStep9Form(step9Res?.data || existingStep9 || {}, wizardData);
          setForm(mapped);
          setDependencyStatus(resolveDependencyStatus(step9Res?.data?.dependencyStatus));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load step 9:", err);
          setToast("Unable to load saved progress. Using default examination rules.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => getExamSummary(form), [form]);

  const displayRecommendation = useMemo(
    () => getRecommendationText(form, wizardMeta),
    [form, wizardMeta]
  );

  const displayDependencyStatus = useMemo(
    () => resolveDependencyStatus(dependencyStatus),
    [dependencyStatus]
  );

  const displaySmartChecks = useMemo(
    () => getSmartChecks(form),
    [form]
  );

  const weightageTotal = useMemo(
    () => getWeightageTotal(form.assessmentWeightage),
    [form.assessmentWeightage]
  );

  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const updateField = useCallback(
    (fieldName, value) => {
      setForm((prev) => ({ ...prev, [fieldName]: value }));
      clearFieldError(fieldName);
    },
    [clearFieldError]
  );

  const selectAssessmentModel = useCallback(
    (assessmentModel) => {
      setForm((prev) => ({ ...prev, assessmentModel }));
      clearFieldError("assessmentModel");
    },
    [clearFieldError]
  );

  const selectResultDisplayFormat = useCallback(
    (resultDisplayFormat) => {
      setForm((prev) => ({ ...prev, resultDisplayFormat }));
      clearFieldError("resultDisplayFormat");
    },
    [clearFieldError]
  );

  const toggleReportCardSection = useCallback((section) => {
    setForm((prev) => {
      const nextSections = prev.reportCardSections.includes(section)
        ? prev.reportCardSections.filter((item) => item !== section)
        : [...prev.reportCardSections, section];
      return { ...prev, reportCardSections: nextSections };
    });
    clearFieldError("reportCardSections");
  }, [clearFieldError]);

  const updateGradeRow = useCallback((rowId, key, value) => {
    setForm((prev) => ({
      ...prev,
      gradeTable: prev.gradeTable.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              [key]:
                key === "minPercentage" || key === "maxPercentage"
                  ? value
                  : value,
            }
          : row
      ),
    }));
    setErrors((prev) => ({
      ...prev,
      gradeTableRows: {
        ...prev.gradeTableRows,
        [rowId]: "",
      },
    }));
  }, []);

  const addGradeRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      gradeTable: [
        ...prev.gradeTable,
        {
          rowId: createLocalRowId("grade"),
          grade: "",
          minPercentage: 0,
          maxPercentage: 0,
          description: "",
        },
      ],
    }));
  }, []);

  const removeGradeRow = useCallback((rowId) => {
    setForm((prev) => ({
      ...prev,
      gradeTable: prev.gradeTable.filter((row) => row.rowId !== rowId),
    }));
    setErrors((prev) => {
      const nextRows = { ...prev.gradeTableRows };
      delete nextRows[rowId];
      return { ...prev, gradeTableRows: nextRows };
    });
  }, []);

  const updateWeightageRow = useCallback((rowId, key, value) => {
    setForm((prev) => ({
      ...prev,
      assessmentWeightage: prev.assessmentWeightage.map((row) =>
        row.rowId === rowId ? { ...row, [key]: value } : row
      ),
    }));
    setErrors((prev) => ({
      ...prev,
      assessmentWeightageRows: {
        ...prev.assessmentWeightageRows,
        [rowId]: "",
      },
    }));
  }, []);

  const addWeightageRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      assessmentWeightage: [
        ...prev.assessmentWeightage,
        {
          rowId: createLocalRowId("weight"),
          assessmentName: "",
          weightValue: 0,
          weightType: "% Weight",
        },
      ],
    }));
  }, []);

  const removeWeightageRow = useCallback((rowId) => {
    setForm((prev) => ({
      ...prev,
      assessmentWeightage: prev.assessmentWeightage.filter((row) => row.rowId !== rowId),
    }));
    setErrors((prev) => {
      const nextRows = { ...prev.assessmentWeightageRows };
      delete nextRows[rowId];
      return { ...prev, assessmentWeightageRows: nextRows };
    });
  }, []);

  const persistStep = useCallback(
    async ({ draft = false, exitAfterSave = false } = {}) => {
      if (!draft) {
        const validationErrors = validateStep9Form(form);
        const hasErrors = Object.entries(validationErrors).some(([key, value]) => {
          if (key === "gradeTableRows" || key === "assessmentWeightageRows") {
            return Object.values(value).some(Boolean);
          }
          return Boolean(value);
        });

        if (hasErrors) {
          setErrors(validationErrors);
          setToast("Please fix the highlighted fields before saving.");
          return false;
        }
      }

      setSaving(true);
      setToast("");

      try {
        const payload = buildStep9Payload(form, {
          draft,
          stepMeta: {
            currentStep: STEP_9_NUMBER,
            progressPercentage: STEP_9_PROGRESS,
          },
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        });
        const request = hasPersistedStep9
          ? updateExaminationGradebookSetup
          : saveExaminationGradebookSetup;
        const res = await request(payload);

        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }

        const mapped = mapWizardDataToStep9Form(res.data || {}, wizardMeta);
        setForm(mapped);
        setHasPersistedStep9(true);
        setDependencyStatus(resolveDependencyStatus(res.data?.dependencyStatus));
        setToast(
          exitAfterSave
            ? "Draft saved. You can continue setup later."
            : "Examination & gradebook setup saved successfully."
        );
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save examination & gradebook setup";
        setToast(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form, hasPersistedStep9, wizardMeta]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep();
    if (ok) {
      navigate(WIZARD_STEP_PATH(STEP_10_NUMBER));
    }
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(WIZARD_STEP_PATH(STEP_8_NUMBER));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ draft: true, exitAfterSave: true });
    if (ok) {
      navigate(START_PATH);
    }
  }, [persistStep, navigate]);

  return {
    form,
    errors,
    loading,
    saving,
    toast,
    toastBannerClassName,
    totalSteps: STEP_9_TOTAL_STEPS,
    summary,
    recommendationText: displayRecommendation,
    dependencyStatus: displayDependencyStatus,
    smartCheckMessages: displaySmartChecks,
    weightageTotal,
    updateField,
    selectAssessmentModel,
    selectResultDisplayFormat,
    toggleReportCardSection,
    updateGradeRow,
    addGradeRow,
    removeGradeRow,
    updateWeightageRow,
    addWeightageRow,
    removeWeightageRow,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
