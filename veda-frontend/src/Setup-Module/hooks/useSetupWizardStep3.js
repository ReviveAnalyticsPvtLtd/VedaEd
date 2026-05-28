import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSetupWizard,
  saveSchoolProfile,
  uploadSchoolLogo,
} from "../../services/setupWizardAPI";
import {
  DEFAULT_LOGO_FRAME_SHAPE,
  DEFAULT_SCHOOL_PROFILE_FORM,
} from "../constants/schoolProfile";
import {
  SETUP_ROUTES,
  STEP_3_NUMBER,
  STEP_3_PROGRESS,
  STEP_4_NUMBER,
} from "../constants/setupWizard";
import { useLocalizationOptions } from "./useLocalizationOptions";
import { digitsOnly, sanitizeEstablishedYear } from "../utils/inputFilters";
import {
  buildPhoneOptions,
  findPhoneOptionByDial,
  formatFullPhone,
  getDialCodeForCountry,
  getPhoneLengthRule,
  parseStoredPhone,
  validateNationalPhone,
} from "../services/phoneValidation";
import { loadAllCountries } from "../services/localizationData";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_LOOKUP_DEBOUNCE_MS = 700;

function mapSavedToForm(data) {
  if (!data) return { ...DEFAULT_SCHOOL_PROFILE_FORM };
  return {
    schoolName: data.schoolName || "",
    schoolCode: data.schoolCode || "",
    establishedYear: data.establishedYear || "",
    website: data.website || "",
    schoolLogo: data.schoolLogo || "",
    schoolLogoPreview: "",
    logoFrameShape: data.logoFrameShape || DEFAULT_LOGO_FRAME_SHAPE,
    primaryThemeColor: data.primaryThemeColor || DEFAULT_SCHOOL_PROFILE_FORM.primaryThemeColor,
    address: data.address || "",
    country: data.country || "",
    state: data.state || "",
    city: data.city || "",
    postalCode: data.postalCode || "",
    timezone: data.timezone || "",
    currency: data.currency || "",
    officialEmail: data.officialEmail || "",
    phoneNumber: data.phoneNumber || "",
    supportEmail: data.supportEmail || "",
    emergencyContact: data.emergencyContact || "",
  };
}

function validateForm(form) {
  const errors = {};
  if (!form.schoolName?.trim()) errors.schoolName = "School name is required";
  if (!form.schoolCode?.trim()) errors.schoolCode = "School code is required";
  if (!form.address?.trim()) errors.address = "Address is required";
  if (!form.country?.trim()) errors.country = "Country is required";
  if (!form.timezone?.trim()) errors.timezone = "Time zone is required";
  if (!form.currency?.trim()) errors.currency = "Currency is required";

  const yearStr = String(form.establishedYear || "").trim();
  if (yearStr) {
    const y = Number(yearStr);
    if (!Number.isInteger(y) || y < 1800 || y > new Date().getFullYear() + 1) {
      errors.establishedYear = "Enter a valid year";
    }
  }

  const website = String(form.website || "").trim();
  if (website && !/^https?:\/\/.+/i.test(website) && !website.includes(".")) {
    errors.website = "Enter a valid website URL";
  }

  if (form.officialEmail?.trim() && !EMAIL_REGEX.test(form.officialEmail.trim())) {
    errors.officialEmail = "Enter a valid email";
  }
  if (form.supportEmail?.trim() && !EMAIL_REGEX.test(form.supportEmail.trim())) {
    errors.supportEmail = "Enter a valid email";
  }

  return errors;
}

function validatePhone(phoneDial, phoneNational, countryIso) {
  const national = String(phoneNational || "").replace(/\D/g, "");
  if (!national) return "";
  if (!phoneDial) return "Select a country code";
  return validateNationalPhone(national, countryIso);
}

export function useSetupWizardStep3() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...DEFAULT_SCHOOL_PROFILE_FORM });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [logoWarning, setLogoWarning] = useState("");
  const previewUrlRef = useRef("");
  const [toast, setToast] = useState("");
  const autoSaveTimer = useRef(null);
  const postalLookupTimer = useRef(null);
  const countryCodeRef = useRef("");
  const postalLookupRef = useRef(null);
  const applyPostalResultRef = useRef(null);
  const skipAutoSave = useRef(true);
  const [phoneDial, setPhoneDial] = useState("");
  const [phoneNational, setPhoneNational] = useState("");

  const localization = useLocalizationOptions(form, {
    enabled: !loading,
  });

  useEffect(() => {
    countryCodeRef.current = localization.countryCode || "";
  }, [localization.countryCode]);

  useEffect(() => {
    postalLookupRef.current = localization.lookupFromPostalCode;
    applyPostalResultRef.current = localization.applyPostalLookupResult;
  }, [localization.lookupFromPostalCode, localization.applyPostalLookupResult]);

  const phoneOptions = useMemo(
    () => buildPhoneOptions(loadAllCountries()),
    []
  );

  const phoneIsoForValidation = useMemo(() => {
    const opt = findPhoneOptionByDial(phoneDial, phoneOptions);
    return opt?.isoCode || localization.countryCode || "";
  }, [phoneDial, phoneOptions, localization.countryCode]);

  const phoneMaxLength = useMemo(
    () => getPhoneLengthRule(phoneIsoForValidation).max,
    [phoneIsoForValidation]
  );

  useEffect(() => {
    if (!localization.countryCode) return;
    const dial = getDialCodeForCountry(localization.countryCode);
    if (dial && !phoneDial) setPhoneDial(dial);
  }, [localization.countryCode, phoneDial]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSetupWizard();
        if (!cancelled && res?.success && res?.data) {
          const mapped = mapSavedToForm(res.data);
          setForm(mapped);
          const countryMatch = mapped.country
            ? loadAllCountries().find(
                (c) =>
                  c.name.toLowerCase() === mapped.country.toLowerCase() ||
                  c.isoCode.toLowerCase() === mapped.country.toLowerCase()
              )
            : null;
          const defaultDial = countryMatch
            ? getDialCodeForCountry(countryMatch.isoCode)
            : "";
          const parsed = parseStoredPhone(mapped.phoneNumber, defaultDial);
          setPhoneDial(parsed.dialCode || defaultDial);
          setPhoneNational(parsed.national);
          const completedSteps = res.data.completedSteps || [];
          // Only prefill if step 3 was previously completed (resume flow)
          // Fresh start: completedSteps is empty or doesn't include step 3
          if (completedSteps.includes(STEP_3_NUMBER)) {
            setForm(mapSavedToForm(res.data));
          }
          // else: leave form as blank DEFAULT_SCHOOL_PROFILE_FORM
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load setup progress:", err);
          setToast(" Unable to load saved progress. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          skipAutoSave.current = false;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const healthItems = useMemo(
    () => [
      {
        id: "basicInfo",
        label: "Basic Info",
        complete: Boolean(form.schoolName?.trim() && form.schoolCode?.trim()),
      },
      {
        id: "themeColor",
        label: "Theme Color",
        complete: Boolean(form.primaryThemeColor),
      },
      {
        id: "schoolLogo",
        label: "School Logo",
        complete: Boolean(form.schoolLogo || form.schoolLogoPreview),
      },
      {
        id: "address",
        label: "Address",
        complete: Boolean(form.address?.trim()),
      },
      {
        id: "timezone",
        label: "Timezone",
        complete: Boolean(form.timezone?.trim()),
      },
      {
        id: "currency",
        label: "Currency",
        complete: Boolean(form.currency?.trim()),
      },
    ],
    [form]
  );

  const buildPayload = useCallback(
    ({ advancing = false, draft = false } = {}) => ({
      draft,
      schoolName: form.schoolName.trim(),
      schoolCode: form.schoolCode.trim(),
      establishedYear: String(form.establishedYear || "").trim(),
      website: String(form.website || "").trim(),
      schoolLogo: form.schoolLogo,
      logoFrameShape: form.logoFrameShape,
      primaryThemeColor: form.primaryThemeColor,
      address: form.address.trim(),
      country: form.country.trim(),
      state: String(form.state || "").trim(),
      city: String(form.city || "").trim(),
      postalCode: String(form.postalCode || "").trim(),
      timezone: form.timezone.trim(),
      currency: form.currency.trim(),
      officialEmail: String(form.officialEmail || "").trim(),
      phoneNumber: formatFullPhone(phoneDial, phoneNational).trim(),
      supportEmail: String(form.supportEmail || "").trim(),
      emergencyContact: String(form.emergencyContact || "").trim(),
      currentStep: advancing ? STEP_4_NUMBER : STEP_3_NUMBER,
      progressPercentage: STEP_3_PROGRESS,
      completedSteps: advancing ? [1, 2, 3] : [1, 2],
    }),
    [form, phoneDial, phoneNational]
  );

  const persistStep = useCallback(
    async (options = {}) => {
      const { advancing = false, silent = false, draft = false } = options;
      const validationErrors = {
        ...validateForm(form),
        ...(() => {
          const phoneErr = validatePhone(
            phoneDial,
            phoneNational,
            phoneIsoForValidation
          );
          return phoneErr ? { phoneNumber: phoneErr } : {};
        })(),
      };
      if (!draft && Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        if (!silent) {
          setToast(" Please complete all required fields before continuing.");
        }
        return false;
      }

      setErrors({});
      if (!silent) {
        setSaving(true);
        setToast("");
      }

      try {
        const res = await saveSchoolProfile(buildPayload({ advancing, draft }));
        if (!res?.success) {
          throw new Error(res?.message || "Failed to save");
        }
        if (!silent) {
          setToast(advancing ? "Progress saved successfully" : "Draft saved");
        }
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save school profile";
        if (!silent) setToast(`❌ ${msg}`);
        return false;
      } finally {
        if (!silent) setSaving(false);
      }
    },
    [buildPayload, form, phoneDial, phoneNational, phoneIsoForValidation]
  );

  const scheduleAutoSave = useCallback(() => {
    if (skipAutoSave.current || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      persistStep({ advancing: false, silent: true, draft: true });
    }, 1500);
  }, [loading, persistStep]);

  const clearFieldError = useCallback((name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const updateField = useCallback(
    (name, value) => {
      setForm((prev) => ({ ...prev, [name]: value }));
      clearFieldError(name);
      scheduleAutoSave();
    },
    [clearFieldError, scheduleAutoSave]
  );

  const handleCountryChange = useCallback(
    (isoCode) => {
      if (!isoCode) {
        setForm((prev) => ({
          ...prev,
          country: "",
          state: "",
        }));
        clearFieldError("country");
        scheduleAutoSave();
        return;
      }

      const patch = localization.applyCountrySelection(isoCode);
      if (!patch) return;

      const dial = getDialCodeForCountry(isoCode);
      setForm((prev) => ({
        ...prev,
        country: patch.countryName,
        state: patch.state,
        city: "",
        postalCode: "",
        timezone: patch.timezone,
        currency: patch.currency,
      }));
      if (dial) setPhoneDial(dial);
      clearFieldError("country");
      clearFieldError("timezone");
      clearFieldError("currency");
      scheduleAutoSave();
    },
    [localization, clearFieldError, scheduleAutoSave]
  );

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  const updateEstablishedYear = useCallback(
    (value) => {
      updateField("establishedYear", sanitizeEstablishedYear(value));
    },
    [updateField]
  );

  const handleStateChange = useCallback(
    (stateName) => {
      setForm((prev) => ({ ...prev, state: stateName, city: "" }));
      clearFieldError("state");
      clearFieldError("city");
      if (localization.countryCode) {
        localization.refreshCityOptions(localization.countryCode, stateName, "");
      }
      scheduleAutoSave();
    },
    [localization, clearFieldError, scheduleAutoSave]
  );

  const runPostalLookup = useCallback(
    async (postal, iso) => {
      const lookup = postalLookupRef.current;
      const applyResult = applyPostalResultRef.current;
      if (!lookup || !applyResult || !iso || !postal) return;

      const raw = await lookup(postal);
      if (!raw) return;

      const resolved = applyResult(raw);
      if (!resolved) return;

      setForm((prev) => ({
        ...prev,
        state: resolved.state || prev.state,
        city: resolved.city || prev.city,
      }));
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const handlePostalCodeChange = useCallback(
    (value) => {
      const iso = countryCodeRef.current;
      const maxLen = iso === "IN" ? 6 : 10;
      const postal = digitsOnly(value, maxLen);
      updateField("postalCode", postal);

      if (postalLookupTimer.current) clearTimeout(postalLookupTimer.current);
      if (!iso || !postal) return;

      const minLen = iso === "IN" ? 6 : 4;
      if (postal.length < minLen) return;

      postalLookupTimer.current = setTimeout(() => {
        runPostalLookup(postal, iso);
      }, POSTAL_LOOKUP_DEBOUNCE_MS);
    },
    [updateField, runPostalLookup]
  );

  const handlePhoneDialChange = useCallback(
    (dial) => {
      setPhoneDial(dial);
      const rule = getPhoneLengthRule(
        findPhoneOptionByDial(dial, phoneOptions)?.isoCode || ""
      );
      setPhoneNational((prev) => digitsOnly(prev, rule.max));
      clearFieldError("phoneNumber");
      scheduleAutoSave();
    },
    [phoneOptions, clearFieldError, scheduleAutoSave]
  );

  const handlePhoneNationalChange = useCallback(
    (value) => {
      const national = digitsOnly(value, phoneMaxLength);
      setPhoneNational(national);
      clearFieldError("phoneNumber");
      scheduleAutoSave();
    },
    [phoneMaxLength, clearFieldError, scheduleAutoSave]
  );

  const handleEmergencyContactChange = useCallback(
    (value) => {
      updateField("emergencyContact", digitsOnly(value, 15));
    },
    [updateField]
  );

  const handleLogoSelect = useCallback(
    async (file, clientError, clientWarning) => {
      if (clientError) {
        setLogoError(clientError);
        setLogoWarning("");
        return;
      }
      if (!file) return;

      setLogoError("");
      setLogoWarning(clientWarning || "");
      revokePreviewUrl();
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      setForm((prev) => ({ ...prev, schoolLogoPreview: preview }));
      setLogoUploading(true);

      try {
        const res = await uploadSchoolLogo(file);
        if (!res?.success) {
          throw new Error(res?.message || "Upload failed");
        }
        const path = res?.data?.schoolLogo || "";
        setForm((prev) => ({
          ...prev,
          schoolLogo: path,
          schoolLogoPreview: preview,
        }));
        scheduleAutoSave();
      } catch (err) {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to upload logo";
        setLogoError(msg);
        revokePreviewUrl();
        setForm((prev) => ({ ...prev, schoolLogoPreview: "" }));
      } finally {
        setLogoUploading(false);
      }
    },
    [revokePreviewUrl, scheduleAutoSave]
  );

  const handleLogoRemove = useCallback(() => {
    revokePreviewUrl();
    setLogoError("");
    setLogoWarning("");
    setForm((prev) => ({
      ...prev,
      schoolLogo: "",
      schoolLogoPreview: "",
    }));
    scheduleAutoSave();
  }, [revokePreviewUrl, scheduleAutoSave]);

  const handleSaveContinue = useCallback(async () => {
    const ok = await persistStep({ advancing: true });
    if (ok) navigate(SETUP_ROUTES.step(4));
  }, [persistStep, navigate]);

  const handleBack = useCallback(() => {
    navigate(SETUP_ROUTES.step(2));
  }, [navigate]);

  const handleSaveExit = useCallback(async () => {
    const ok = await persistStep({ advancing: false, draft: true });
    if (ok) {
      setToast("Draft saved. You can continue setup later.");
      navigate(SETUP_ROUTES.START);
    }
  }, [persistStep, navigate]);

  useEffect(
    () => () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (postalLookupTimer.current) clearTimeout(postalLookupTimer.current);
      revokePreviewUrl();
    },
    [revokePreviewUrl]
  );

  return {
    form,
    errors,
    loading,
    saving,
    logoUploading,
    logoError,
    logoWarning,
    toast,
    healthItems,
    localization,
    phoneDial,
    phoneNational,
    phoneOptions,
    phoneMaxLength,
    phoneIsoForValidation,
    updateField,
    updateEstablishedYear,
    handleStateChange,
    handlePostalCodeChange,
    handlePhoneDialChange,
    handlePhoneNationalChange,
    handleEmergencyContactChange,
    handleCountryChange,
    handleLogoSelect,
    handleLogoRemove,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  };
}
