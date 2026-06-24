import { useEffect, useState } from "react";
import axios from "axios";
// import config from "../config";

export default function SuperAdminSettingsPreferences() {
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const applyTheme = (theme) => {
    const root = document.documentElement;

    root.classList.remove("dark");

    if (theme === "dark") {
      root.classList.add("dark");
    }

    if (theme === "system") {
      const isDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      if (isDark) {
        root.classList.add("dark");
      }
    }
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);

      /*
      const res = await axios.get(
        `${config.API_BASE_URL}/settings/preferences`
      );

      setPreferences(res.data);
      */

      const savedPrefs = localStorage.getItem("preferences");

      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      } else {
        setPreferences({
          theme: "light",
          language: "en",
          timezone: "Asia/Kolkata",
        });
      }
    } catch (error) {
      console.error(error);
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
      /*
      await axios.put(
        `${config.API_BASE_URL}/settings/preferences`,
        preferences
      );
      */

      localStorage.setItem(
        "preferences",
        JSON.stringify(preferences)
      );

      alert("Preferences Saved Successfully");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 dark:text-white rounded-xl p-10 text-center">
        Loading Preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Preferences
        </h2>

        <p className="text-slate-500 dark:text-slate-400">
          Customize your experience on the platform.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 space-y-8">

        {/* Appearance */}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Appearance
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400">
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
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {theme}
              </button>
            ))}

          </div>
        </div>

        {/* Language */}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
            Language & Region
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Set your preferred language and region.
          </p>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Language
              </label>

              <select
                value={preferences.language}
                onChange={(e) =>
                  handleChange("language", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="en">English (US)</option>
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Timezone
              </label>

              <select
                value={preferences.timezone}
                onChange={(e) =>
                  handleChange("timezone", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex justify-end">
          <button
            onClick={savePreferences}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
          >
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
}