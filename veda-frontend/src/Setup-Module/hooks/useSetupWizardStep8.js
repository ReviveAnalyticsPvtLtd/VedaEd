import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAttendanceRules,
  getSetupWizard,
  patchAttendanceToggle,
  saveAttendanceRules,
} from "../../services/setupWizardAPI";
import { DEFAULT_STEP8_FORM } from "../constants/attendanceRules";
import {
  STEP_8_NUMBER,
  STEP_8_PROGRESS,
  STEP_9_NUMBER,
  STEP_9_PROGRESS,
  TOTAL_STEPS,
} from "../constants/setupWizard";
import {
  buildStep8Payload,
  getAttendanceSummary,
  getModeRecommendation,
  mapWizardDataToStep8Form,
  resolveAttendanceDependencyStatus,
  validateStep8Form,
} from "../utils/attendanceRules";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const STEP7_PATH = "/form/step-7";
const STEP9_PATH = "/form/step-9";
const START_PATH = "/setup/start";

export function useSetupWizardStep8() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_STEP8_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [recommendationText, setRecommendationText] = useState("");
  const [dependencyStatus, setDependencyStatus] = useState([]);
  const [smartCheckMessages, setSmartCheckMessages] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wizardRes, step8Res] = await Promise.all([
          getSetupWizard(),
          getAttendanceRules(),
        ]);

        if (!cancelled && step8Res?.success && step8Res?.data) {
          const d = step8Res.data;
          setForm(mapWizardDataToStep8Form(d));
          setRecommendationText(
            getModeRecommendation(d.attendanceMode, d.recommendationText)
          );
          setDependencyStatus(
            resolveAttendanceDependencyStatus(
              d.attendanceDependencyStatus,
              d.parentNotificationRules,
              d.minimumAttendance
            )
          );
          setSmartCheckMessages(d.attendanceSmartChecks || []);
        } else if (!cancelled && wizardRes?.success && wizardRes?.data) {
          const mapped = mapWizardDataToStep8Form(wizardRes.data);
          if (wizardRes.data.institutionType === "k12_school") {
            mapped.attendanceMode = "Hybrid";
          }
          setForm(mapped);
          setRecommendationText(getModeRecommendation(mapped.attendanceMode));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load step 8:", err);
          setToast("Unable to load saved progress. Using defaults.");
          setForm(DEFAULT_STEP8_FORM);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => getAttendanceSummary(form), [form]);

  const displayRecommendation = useMemo(
    () => getModeRecommendation(form.attendanceMode, recommendationText),
    [form.attendanceMode, recommendationText]
  );

  const displayDependencyStatus = useMemo(
    () =>
      resolveAttendanceDependencyStatus(
        dependencyStatus,
        form.parentNotificationRules,
        Number(form.minimumAttendance)
      ),
    [dependencyStatus, form.parentNotificationRules, form.minimumAttendance]
  );

  const displaySmartChecks = useMemo(() => {
    if (smartCheckMessages.length) return smartCheckMessages;
    const messages = [];
    if (form.attendancePermissions.adminOverride) {
      messages.push(
        `Admin override is enabled. All attendance edits after ${form.attendanceClosingTime} should be captured in audit logs.`
      );
    }
    return messages.length
      ? messages
      : [
          "Attendance closing time is set. Late edits should require admin approval with audit trail.",
        ];
  }, [
    smartCheckMessages,
    form.attendancePermissions.adminOverride,
    form.attendanceClosingTime,
  ]);

  const updateField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (name === "attendanceMode") {
      setRecommendationText(getModeRecommendation(value));
    }
  }, []);

  const toggleWorkingDay = useCallback((day) => {
    setForm((prev) => {
      const next = prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: next.length ? next : prev.workingDays };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.workingDays;
      return next;
    });
  }, []);

  const toggleLeaveType = useCallback((type) => {
    setForm((prev) => ({
      ...prev,
      leaveTypes: prev.leaveTypes.includes(type)
        ? prev.leaveTypes.filter((t) => t !== type)
        : [...prev.leaveTypes, type],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.leaveTypes;
      return next;
    });
  }, []);

  const syncTogglePatch = useCallback(async (section, key, enabled) => {
    try {
      const res = await patchAttendanceToggle({ section, key, enabled });
      if (res?.success && res?.data) {
        if (res.data.attendanceDependencyStatus?.length) {
          setDependencyStatus(res.data.attendanceDependencyStatus);
        }
        if (res.data.attendanceSmartChecks?.length) {
          setSmartCheckMessages(res.data.attendanceSmartChecks);
        }
      }
    } catch (err) {
      console.error("Toggle sync failed:", err);
    }
  }, []);

  const togglePermission = useCallback(
    (key) => {
      setForm((prev) => {
        const next = {
          ...prev,
          attendancePermissions: {
            ...prev.attendancePermissions,
            [key]: !prev.attendancePermissions[key],
          },
        };
        syncTogglePatch("attendancePermissions", key, next.attendancePermissions[key]);
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next.attendancePermissions;
        return next;
      });
    },
    [syncTogglePatch]
  );

  const toggleNotification = useCallback(
    (key, patchKey) => {
      setForm((prev) => {
        const nextVal = !prev.parentNotificationRules[key];
        const next = {
          ...prev,
          parentNotificationRules: {
            ...prev.parentNotificationRules,
            [key]: nextVal,
          },
        };
        syncTogglePatch("parentNotificationRules", patchKey, nextVal);
        return next;
      });
    },
    [syncTogglePatch]
  );

  const persistStep = useCallback(
    async ({ advancing = false, draft = false } = {}) => {
      if (!draft) {
        const validationErrors = validateStep8Form(form);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setToast("Please fix the highlighted fields before continuing.");
          return false;
        }
      }

      setSaving(true);
      setToast("");

      try {
        const payload = buildStep8Payload(form, {
          advancing,
          draft,
          stepMeta: {
            currentStep: advancing ? STEP_9_NUMBER : STEP_8_NUMBER,
            progressPercentage: advancing ? STEP_9_PROGRESS : STEP_8_PROGRESS,
          },
        });

        const res = await saveAttendanceRules(payload);
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }

        if (res.data) {
          setDependencyStatus(
            res.data.attendanceDependencyStatus ||
              resolveAttendanceDependencyStatus(
                null,
                res.data.parentNotificationRules,
                res.data.minimumAttendance
              )
          );
          setSmartCheckMessages(res.data.attendanceSmartChecks || []);
          setRecommendationText(
            getModeRecommendation(
              res.data.attendanceMode,
              res.data.recommendationText
            )
          );
        }

        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save attendance rules";
        setToast(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(STEP9_PATH);
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(STEP7_PATH);
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
    summary,
    recommendationText: displayRecommendation,
    dependencyStatus: displayDependencyStatus,
    smartCheckMessages: displaySmartChecks,
    totalSteps: TOTAL_STEPS,
    updateField,
    toggleWorkingDay,
    toggleLeaveType,
    togglePermission,
    toggleNotification,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
