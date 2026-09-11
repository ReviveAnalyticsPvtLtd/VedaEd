import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../identity-access/components/PageHeader";
import SetupProfileForm from "./components/SetupProfileForm";
import SetupProfileSummary from "./components/SetupProfileSummary";
import { getSetupProfile, updateSetupProfile } from "../../services/setupWizardAPI";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const BASE = "/superadmin-front/setup-profile";

export default function EditSetupProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSetupProfile()
      .then((res) => setForm(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const save = () => {
    if (!form) return;
    setSaving(true);
    setError("");
    setToast("");
    updateSetupProfile({ ...form, schoolCode: undefined })
      .then(() => {
        setToast("Setup profile updated successfully.");
        setTimeout(() => navigate(BASE), 1500);
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  };

  if (!form && !error) {
    return (
      <div className="min-h-full bg-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading setup profile...
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-full bg-gray-100 p-4 md:p-6">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", to: "/superadmin-front/dashboard" },
            { label: "Setup Profile", to: BASE },
            { label: "Edit Setup Profile" },
          ]}
          title="Edit Setup Profile"
        />
        <p className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 inline-block text-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-4 md:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Setup Profile", to: BASE },
          { label: "Edit Setup Profile" },
        ]}
        title="Edit Setup Profile"
        subtitle={`Update organization setup data for ${form.schoolName}`}
      />

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SetupProfileForm form={form} onChange={setForm} />
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(BASE)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        <SetupProfileSummary form={form} />
      </div>
    </div>
  );
}