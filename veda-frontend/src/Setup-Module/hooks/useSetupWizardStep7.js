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
  SETUP_TYPES,
  STEP_6_NUMBER,
  STEP_7_NUMBER,
  STEP_7_PROGRESS,
  STEP_8_NUMBER,
  STEP_8_PROGRESS,
  WIZARD_STEP_PATH,
} from "../constants/setupWizard";
import {
  CORE_ROLE_COUNT,
  generatePermissionMatrix,
  getModuleDrivenRoleKeys,
  getRecommendationText,
  getSmartCheckMessages,
  mapWizardDataToStep7Form,
  resolveDependencyStatus,
  syncOptionalRolesWithModules,
  validateStep7Form,
} from "../utils/rolesHrFoundation";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const START_PATH = "/setup/start";

export function useSetupWizardStep7() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_STEP7_FORM);
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [customPermissionMatrix, setCustomPermissionMatrix] = useState([]);
  const [enabledModules, setEnabledModules] = useState([]);
  const [wizardMeta, setWizardMeta] = useState({});
  const [selectedSetupType, setSelectedSetupType] = useState(SETUP_TYPES.QUICK);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const moduleDrivenRoleKeys = useMemo(() => getModuleDrivenRoleKeys(), []);

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
          setSelectedSetupType(w.selectedSetupType || SETUP_TYPES.QUICK);
          setWizardMeta({
            subjectFramework: w.subjectFramework,
            approvalWorkflow: w.approvalWorkflow,
            enabledModules: w.enabledModules,
          });
        }

        if (!cancelled && step7Res?.success && step7Res?.data) {
          const d = step7Res.data;
          const baseForm = mapWizardDataToStep7Form(d);
          const wizardModules = wizardRes?.data?.enabledModules || [];
          const stepModules = d.enabledModules || [];
          const effectiveModules =
            stepModules.length > 0 ? stepModules : wizardModules;
          setForm({
            ...baseForm,
            optionalRoles: syncOptionalRolesWithModules(
              baseForm.optionalRoles,
              effectiveModules
            ),
          });
          setPermissionMatrix(d.permissionMatrix || []);
          if (d.permissionSetupStyle === "custom") {
            setCustomPermissionMatrix(d.permissionMatrix || []);
          }
          if (d.enabledModules?.length) {
            setEnabledModules(d.enabledModules);
          }
          setWizardMeta((prev) => ({
            ...prev,
            approvalWorkflow: d.approvalWorkflow,
          }));
        } else if (!cancelled && wizardRes?.success && wizardRes?.data) {
          const baseForm = mapWizardDataToStep7Form(wizardRes.data);
          setForm({
            ...baseForm,
            optionalRoles: syncOptionalRolesWithModules(
              baseForm.optionalRoles,
              wizardRes.data.enabledModules || []
            ),
          });
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

  useEffect(() => {
    const generatedMatrix = generatePermissionMatrix(
      form.optionalRoles,
      form.permissionSetupStyle
    );

    setPermissionMatrix((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        if (
          form.permissionSetupStyle === "custom" &&
          Array.isArray(customPermissionMatrix) &&
          customPermissionMatrix.length > 0
        ) {
          const previousByRole = new Map(
            customPermissionMatrix.map((row) => [row.role, row])
          );
          return generatedMatrix.map((row) => {
            const previousRow = previousByRole.get(row.role);
            if (!previousRow) {
              return row;
            }
            return {
              ...row,
              academic: previousRow.academic ?? row.academic,
              fees: previousRow.fees ?? row.fees,
              setup: previousRow.setup ?? row.setup,
              portal: previousRow.portal ?? row.portal,
            };
          });
        }
        return generatedMatrix;
      }

      if (form.permissionSetupStyle !== "custom") {
        return generatedMatrix;
      }

      // Preserve user edits when custom mode is active.
      const sourceMatrix =
        Array.isArray(customPermissionMatrix) && customPermissionMatrix.length > 0
          ? customPermissionMatrix
          : prev;
      const previousByRole = new Map(sourceMatrix.map((row) => [row.role, row]));
      return generatedMatrix.map((row) => {
        const previousRow = previousByRole.get(row.role);
        if (!previousRow) {
          return row;
        }
        return {
          ...row,
          academic: previousRow.academic ?? row.academic,
          fees: previousRow.fees ?? row.fees,
          setup: previousRow.setup ?? row.setup,
          portal: previousRow.portal ?? row.portal,
        };
      });
    });
  }, [form.optionalRoles, form.permissionSetupStyle, customPermissionMatrix]);

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

  const updatePermissionCell = useCallback(
    (role, column, value) => {
      if (form.permissionSetupStyle !== "custom") {
        return;
      }
      setPermissionMatrix((prev) => {
        const next = prev.map((row) =>
          row.role === role ? { ...row, [column]: value } : row
        );
        setCustomPermissionMatrix(next);
        return next;
      });
    },
    [form.permissionSetupStyle]
  );

  const toggleOptionalRole = useCallback(
    async (roleKey, enabled) => {
      if (moduleDrivenRoleKeys.includes(roleKey)) {
        return;
      }
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
    [moduleDrivenRoleKeys]
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
      permissionMatrix,
      currentStep: advancing ? STEP_8_NUMBER : STEP_7_NUMBER,
      progressPercentage: advancing ? STEP_8_PROGRESS : STEP_7_PROGRESS,
      completedSteps: advancing ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6],
    }),
    [form, permissionMatrix]
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
          if (form.permissionSetupStyle === "custom") {
            setCustomPermissionMatrix(res.data.permissionMatrix);
          }
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
    if (ok) navigate(WIZARD_STEP_PATH(STEP_8_NUMBER));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(WIZARD_STEP_PATH(STEP_6_NUMBER));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(START_PATH);
    }
  }, [persistStep, navigate]);

  const handleSavePermissions = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Permissions saved successfully.");
    }
  }, [persistStep]);

  return {
    form,
    errors,
    loading,
    saving,
    toast,
    toastBannerClassName,
    permissionMatrix,
    coreRoleCount: CORE_ROLE_COUNT,
    optionalRolesOnCount,
    recommendationText,
    smartCheckMessages,
    dependencyStatus,
    selectedSetupType,
    moduleDrivenRoleKeys,
    updateField,
    updatePermissionCell,
    toggleOptionalRole,
    removeOptionalRole,
    toggleCategory,
    handleSavePermissions,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
