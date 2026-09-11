import { useEffect, useState } from "react";
import { userSettingsAPI } from "../../services/userSettingsAPI";

export default function SuperAdminSettingsPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      setPreferences((prev) => ({
        ...prev,
        theme: savedTheme,
      }));
    }

    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const settings = await userSettingsAPI.getSettings();
      
      if (settings && settings.preferences) {
        setPreferences(settings.preferences);
      }
    } catch (error) {
      console.error(error);
      // Fallback to localStorage if API fails
      const savedPrefs = localStorage.getItem("preferences");
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "theme") {
      localStorage.setItem("theme", value);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      await userSettingsAPI.updatePreferences(preferences);
      
      localStorage.setItem(
        "preferences",
        JSON.stringify(preferences)
      );

      setSuccess("Preferences Saved Successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Preferences
        </h2>

        <p className="text-slate-900">
          Customize your experience on the platform.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 rounded-lg px-4 py-2">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">

        {/* Appearance */}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Appearance
          </h3>

          <p className="text-sm text-slate-900">
            Choose your preferred theme.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {["light", "dark", "system"].map((theme) => (
              <button
                key={theme}
                onClick={() =>
                  handleChange("theme", theme)
                }
                className={`px-4 py-3 rounded-xl border-2 font-medium capitalize transition-all ${
                  preferences.theme === theme
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {theme}
              </button>
            ))}

          </div>
        </div>

        {/* Language */}

        <div className="border-t border-slate-200 pt-8">
          <h3 className="text-lg font-semibold mb-2 text-slate-900">
            Language & Region
          </h3>

          <p className="text-sm text-slate-900 mb-5">
            Set your preferred language and region.
          </p>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Language
              </label>

              <select
                value={preferences.language}
                onChange={(e) =>
                  handleChange("language", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
              >
                <option value="en">English (US)</option>
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Timezone
              </label>

              <select
                value={preferences.timezone}
                onChange={(e) =>
                  handleChange("timezone", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
              >
                <option value="Asia/Kolkata">
                  India (GMT+5:30)
                </option>

                <option value="Europe/London">
                  London
                </option>

                <option value="America/New_York">
                  New York
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* Footer */}

        <div className="border-t border-slate-200 pt-6 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

      </div>
    </div>
  );
}