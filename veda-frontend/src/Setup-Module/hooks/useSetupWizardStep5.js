import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveModuleSelection,
} from "../../services/setupWizardAPI";
import {
  OPTIONAL_MODULE_KEYS,
  REQUIRED_MODULE_KEYS,
} from "../constants/moduleSelection";
import { INSTITUTION_TYPES } from "../constants/schoolTypeCurriculum";
import {
  SETUP_ROUTES,
  STEP_5_NUMBER,
  STEP_5_PROGRESS,
  STEP_6_NUMBER,
  STEP_6_PROGRESS,
} from "../constants/setupWizard";
import {
  applyModuleToggle,
  getDependencyGuidance,
  getDependencyWarnings,
} from "../utils/moduleDependencies";
import {
  getModuleRecommendations,
  getRecommendationSubtitle,
} from "../utils/moduleRecommendations";

function normalizeOptionalModules(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((key) => OPTIONAL_MODULE_KEYS.includes(key));
}

export function useSetupWizardStep5() {
  const navigate = useNavigate();
  const [enabledOptional, setEnabledOptional] = useState([]);
  const [institutionType, setInstitutionType] = useState(INSTITUTION_TYPES.K12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [autoEnabledNotice, setAutoEnabledNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data) {
          const data = res.data;
          setEnabledOptional(normalizeOptionalModules(data.enabledModules));
          if (data.institutionType) {
            setInstitutionType(data.institutionType);
          }
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

  const recommendations = useMemo(
    () => getModuleRecommendations(institutionType),
    [institutionType]
  );

  const recommendationSubtitle = useMemo(
    () => getRecommendationSubtitle(institutionType),
    [institutionType]
  );

  const recommendedModules = useMemo(
    () => recommendations.map((r) => r.key),
    [recommendations]
  );

  const dependencyWarnings = useMemo(
    () => getDependencyWarnings(enabledOptional),
    [enabledOptional]
  );

  const dependencyGuidance = useMemo(
    () => getDependencyGuidance(enabledOptional),
    [enabledOptional]
  );

  const disabledModules = useMemo(() => {
    const allOptional = new Set(OPTIONAL_MODULE_KEYS);
    enabledOptional.forEach((key) => allOptional.delete(key));
    return [...allOptional];
  }, [enabledOptional]);

  const handleToggleOptional = useCallback((key) => {
    setEnabledOptional((prev) => {
      const turningOn = !prev.includes(key);
      const result = applyModuleToggle(key, prev, turningOn);

      if (result.autoEnabled.length > 0) {
        setAutoEnabledNotice(
          `${result.autoEnabled.join(", ")} was auto-enabled because ${key} depends on it.`
        );
      } else {
        setAutoEnabledNotice("");
      }

      return result.enabled;
    });
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false, draft = false } = {}) => ({
      draft,
      enabledModules: [...REQUIRED_MODULE_KEYS, ...enabledOptional],
      disabledModules,
      recommendedModules,
      dependencyWarnings,
      currentStep: advancing ? STEP_6_NUMBER : STEP_5_NUMBER,
      progressPercentage: advancing ? STEP_6_PROGRESS : STEP_5_PROGRESS,
      completedSteps: advancing ? [1, 2, 3, 4, 5] : [1, 2, 3, 4],
    }),
    [enabledOptional, disabledModules, recommendedModules, dependencyWarnings]
  );

  const persistStep = useCallback(
    async (options = {}) => {
      const { advancing = false, draft = false } = options;

      setSaving(true);
      setToast("");

      try {
        const res = await saveModuleSelection(buildPayload({ advancing, draft }));
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save module selection";
        setToast(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, dependencyWarnings]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(SETUP_ROUTES.step(6));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(4));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(SETUP_ROUTES.START);
    }
  }, [persistStep, navigate]);

  return {
    loading,
    saving,
    toast,
    enabledOptional,
    requiredCount: REQUIRED_MODULE_KEYS.length,
    optionalEnabledCount: enabledOptional.length,
    recommendations,
    recommendationSubtitle,
    dependencyWarnings,
    dependencyGuidance,
    autoEnabledNotice,
    handleToggleOptional,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
