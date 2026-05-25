import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSetupWizard, saveCommunicationSetup } from "../../services/setupWizardAPI";
import {
  SETUP_ROUTES,
  STEP_11_NUMBER,
  STEP_11_PROGRESS,
  STEP_12_NUMBER,
} from "../constants/setupWizard";

const DEFAULT_FORM = {
  communicationChannels: {
    email: true,
    sms: true,
    whatsapp: true,
    pushInApp: true,
  },
  notificationTriggers: {
    studentAbsent: true,
    feeDueReminder: true,
    examResultPublished: true,
    homeworkPublished: false,
    emergencyAlert: true,
    transportUpdates: false,
  },
  announcementPermissions: {
    principal: true,
    schoolAdmin: true,
    classTeacher: false,
    subjectTeacher: false,
    transportManager: false,
  },
  documentTemplates: {
    idCardTemplate: "standard_school_id",
    feeReceiptTemplate: "standard_receipt",
    reportCardTemplate: "board_specific",
    certificateTemplate: "standard_certificate",
  },
};

function mapSavedToForm(data) {
  if (!data) return { ...DEFAULT_FORM };
  return {
    communicationChannels: {
      email: data.communicationChannels?.email ?? true,
      sms: data.communicationChannels?.sms ?? true,
      whatsapp: data.communicationChannels?.whatsapp ?? true,
      pushInApp: data.communicationChannels?.pushInApp ?? true,
    },
    notificationTriggers: {
      studentAbsent: data.notificationTriggers?.studentAbsent ?? true,
      feeDueReminder: data.notificationTriggers?.feeDueReminder ?? true,
      examResultPublished: data.notificationTriggers?.examResultPublished ?? true,
      homeworkPublished: data.notificationTriggers?.homeworkPublished ?? false,
      emergencyAlert: data.notificationTriggers?.emergencyAlert ?? true,
      transportUpdates: data.notificationTriggers?.transportUpdates ?? false,
    },
    announcementPermissions: {
      principal: data.announcementPermissions?.principal ?? true,
      schoolAdmin: data.announcementPermissions?.schoolAdmin ?? true,
      classTeacher: data.announcementPermissions?.classTeacher ?? false,
      subjectTeacher: data.announcementPermissions?.subjectTeacher ?? false,
      transportManager: data.announcementPermissions?.transportManager ?? false,
    },
    documentTemplates: {
      idCardTemplate: data.documentTemplates?.idCardTemplate || "standard_school_id",
      feeReceiptTemplate: data.documentTemplates?.feeReceiptTemplate || "standard_receipt",
      reportCardTemplate: data.documentTemplates?.reportCardTemplate || "board_specific",
      certificateTemplate: data.documentTemplates?.certificateTemplate || "standard_certificate",
    },
  };
}

export function useSetupWizardStep11() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data) {
          setForm(mapSavedToForm(res.data));
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
    return () => { cancelled = true; };
  }, []);

  const toggleChannel = useCallback((key) => {
    setForm((prev) => ({
      ...prev,
      communicationChannels: {
        ...prev.communicationChannels,
        [key]: !prev.communicationChannels[key],
      },
    }));
  }, []);

  const toggleTrigger = useCallback((key) => {
    setForm((prev) => ({
      ...prev,
      notificationTriggers: {
        ...prev.notificationTriggers,
        [key]: !prev.notificationTriggers[key],
      },
    }));
  }, []);

  const togglePermission = useCallback((key) => {
    setForm((prev) => ({
      ...prev,
      announcementPermissions: {
        ...prev.announcementPermissions,
        [key]: !prev.announcementPermissions[key],
      },
    }));
  }, []);

  const updateDocTemplate = useCallback((key, value) => {
    setForm((prev) => ({
      ...prev,
      documentTemplates: { ...prev.documentTemplates, [key]: value },
    }));
  }, []);

  const buildPayload = useCallback(
    ({ advancing = false } = {}) => ({
      ...form,
      currentStep: advancing ? STEP_12_NUMBER : STEP_11_NUMBER,
      progressPercentage: STEP_11_PROGRESS,
      completedSteps: advancing
        ? Array.from({ length: STEP_11_NUMBER }, (_, i) => i + 1)
        : Array.from({ length: STEP_11_NUMBER - 1 }, (_, i) => i + 1),
    }),
    [form]
  );

  const persistStep = useCallback(
    async ({ advancing = false } = {}) => {
      setSaving(true);
      setToast("");
      try {
        const res = await saveCommunicationSetup(buildPayload({ advancing }));
        if (!res?.success) throw new Error(res?.message || "Failed to save");
        setToast(advancing ? "Progress saved successfully" : "Draft saved");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to save communication setup";
        setToast(`❌ ${msg}`);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload]
  );

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(SETUP_ROUTES.step(12));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(10));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false });
    if (ok) navigate(SETUP_ROUTES.START);
  }, [persistStep, navigate]);

  // Derived counts for sidebar
  const enabledChannelsCount = Object.values(form.communicationChannels).filter(Boolean).length;
  const enabledTriggersCount = Object.values(form.notificationTriggers).filter(Boolean).length;

  return {
    form,
    loading,
    saving,
    toast,
    enabledChannelsCount,
    enabledTriggersCount,
    toggleChannel,
    toggleTrigger,
    togglePermission,
    updateDocTemplate,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
