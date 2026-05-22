import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteStep7Role,
  getRolesHrFoundation,
  getSetupWizard,
  saveRolesHrFoundation,
  updateStep7Role,
} from "../../services/setupWizardAPI";
import {
  DEFAULT_PERMISSION_MATRIX,
  DEFAULT_STEP7_FORM,
} from "../constants/rolesHrFoundation";
import {
  STEP_7_NUMBER,
  STEP_7_PROGRESS,
  STEP_8_NUMBER,
  STEP_8_PROGRESS,
} from "../constants/setupWizard";
import {
  CORE_ROLE_COUNT,
  generatePermissionMatrix,
  getRecommendationText,
  getSmartCheckMessages,
  mapWizardDataToStep7Form,
  resolveDependencyStatus,
  validateStep7Form,
} from "../utils/rolesHrFoundation";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const STEP6_PATH = "/form/step-6";
const STEP8_PATH = "/form/step-8";
const START_PATH = "/setup/start";

export function useSetupWizardStep7() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_STEP7_FORM);
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [enabledModules, setEnabledModules] = useState([]);
  const [wizardMeta, setWizardMeta] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wizardRes, step7Res] = await Promise.all([
          getSetupWizard(),
          getRolesHrFoundation(),
        ]);

        if (!cancelled && wizardRes?.success && wizardRes?.data) {
          const w = wizardRes.data;
          setEnabledModules(w.enabledModules || []);
          setWizardMeta({
            subjectFramework: w.subjectFramework,
            approvalWorkflow: w.approvalWorkflow,
            enabledModules: w.enabledModules,
          });
        }

        if (!cancelled && step7Res?.success && step7Res?.data) {
          const d = step7Res.data;
          setForm(mapWizardDataToStep7Form(d));
          setPermissionMatrix(d.permissionMatrix || []);
          if (d.enabledModules?.length) {
            setEnabledModules(d.enabledModules);
          }
          setWizardMeta((prev) => ({
            ...prev,
            approvalWorkflow: d.approvalWorkflow,
          }));
        } else if (!cancelled && wizardRes?.success && wizardRes?.data) {
          setForm(mapWizardDataToStep7Form(wizardRes.data));
        }

        if (!cancelled) {
          setPermissionMatrix((prev) =>
            prev.length > 0 ? prev : DEFAULT_PERMISSION_MATRIX
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load step 7:", err);
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

  const optionalRolesOnCount = form.optionalRoles.length;

  const displayPermissionMatrix = useMemo(
    () =>
      generatePermissionMatrix(
        form.optionalRoles,
        form.permissionSetupStyle
      ),
    [form.optionalRoles, form.permissionSetupStyle]
  );

  const recommendationText = useMemo(
    () => getRecommendationText(form.permissionSetupStyle),
    [form.permissionSetupStyle]
  );

  const smartCheckMessages = useMemo(
    () => getSmartCheckMessages(enabledModules, form.optionalRoles),
    [enabledModules, form.optionalRoles]
  );

  const dependencyStatus = useMemo(() => {
    const fromServer = wizardMeta.dependencyStatus;
    return resolveDependencyStatus(fromServer, {
      ...wizardMeta,
      approvalWorkflow: form.approvalWorkflow,
      enabledModules,
    });
  }, [wizardMeta, form.approvalWorkflow, enabledModules]);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const toggleOptionalRole = useCallback(
    async (roleKey, enabled) => {
      setForm((prev) => {
        const next = enabled
          ? [...new Set([...prev.optionalRoles, roleKey])]
          : prev.optionalRoles.filter((r) => r !== roleKey);
        return { ...prev, optionalRoles: next };
      });

      try {
        const res = await updateStep7Role({ roleKey, enabled });
        if (res?.success && res?.data) {
          setPermissionMatrix(res.data.permissionMatrix || []);
          if (res.data.dependencyStatus?.length) {
            setWizardMeta((m) => ({
              ...m,
              dependencyStatus: res.data.dependencyStatus,
            }));
          }
        }
      } catch (err) {
        console.error("Role toggle sync failed:", err);
      }
    },
    []
  );

  const removeOptionalRole = useCallback(async (roleKey) => {
    setForm((prev) => ({
      ...prev,
      optionalRoles: prev.optionalRoles.filter((r) => r !== roleKey),
    }));
    try {
      const res = await deleteStep7Role(roleKey);
      if (res?.success && res?.data) {
        setPermissionMatrix(res.data.permissionMatrix || []);
      }
    } catch (err) {
      console.error("Remove role failed:", err);
    }
  }, []);

  const toggleCategory = useCallback((category) => {
    setForm((prev) => ({
      ...prev,
      staffCategories: prev.staffCategories.includes(category)
        ? prev.staffCategories.filter((c) => c !== category)
        : [...prev.staffCategories, category],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.staffCategories;
      return next;
    });
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false, draft = false } = {}) => ({
      draft,
      optionalRoles: form.optionalRoles,
      permissionSetupStyle: form.permissionSetupStyle,
      staffIdFormat: form.staffIdFormat,
      teacherIdFormat: form.teacherIdFormat,
      staffCategories: form.staffCategories,
      departmentSetup: form.departmentSetup,
      approvalWorkflow: form.approvalWorkflow,
      currentStep: advancing ? STEP_8_NUMBER : STEP_7_NUMBER,
      progressPercentage: advancing ? STEP_8_PROGRESS : STEP_7_PROGRESS,
      completedSteps: advancing ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6],
    }),
    [form]
  );

  const persistStep = useCallback(
    async (options = {}) => {
      const { advancing = false, draft = false } = options;

      if (!draft) {
        const validationErrors = validateStep7Form(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setToast("Please fix the highlighted fields before continuing.");
          return false;
        }
      }

      setSaving(true);
      setToast("");

      try {
        const res = await saveRolesHrFoundation(
          buildPayload({ advancing, draft })
        );
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        if (res.data?.permissionMatrix) {
          setPermissionMatrix(res.data.permissionMatrix);
        }
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save roles & HR foundation";
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
    if (ok) navigate(STEP8_PATH);
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(STEP6_PATH);
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
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
    permissionMatrix: displayPermissionMatrix,
    coreRoleCount: CORE_ROLE_COUNT,
    optionalRolesOnCount,
    recommendationText,
    smartCheckMessages,
    dependencyStatus,
    updateField,
    toggleOptionalRole,
    removeOptionalRole,
    toggleCategory,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
