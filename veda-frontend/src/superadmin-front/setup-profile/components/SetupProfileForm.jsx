import { Label, Input, Select } from "../../identity-access/components/FormField";
import { ALL_MODULES } from "../constants";

export default function SetupProfileForm({ form, onChange, readOnly = false }) {
  const set = (field, value) => onChange({ ...form, [field]: value });

  const toggleModule = (module, isEnabled) => {
    if (readOnly) return;
    const enabled = form.enabledModules || [];
    const disabled = form.disabledModules || [];
    if (isEnabled) {
      set("enabledModules", enabled.filter((m) => m !== module));
      set("disabledModules", [...disabled, module].sort());
    } else {
      set("disabledModules", disabled.filter((m) => m !== module));
      set("enabledModules", [...enabled, module].sort());
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== Organization Details ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Organization Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Organization Type</Label>
            <Select
              value={form.organizationType || ""}
              onChange={(e) => set("organizationType", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select organization type</option>
              <option value="single_school">Single School</option>
              <option value="multi_campus">Multi Campus</option>
              <option value="school_group">School Group</option>
            </Select>
          </div>
          <div>
            <Label required>School Name</Label>
            <Input
              value={form.schoolName || ""}
              onChange={(e) => set("schoolName", e.target.value)}
              placeholder="Mukita International School"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>School Code</Label>
            <Input
              value={form.schoolCode || ""}
              readOnly
              disabled
              placeholder="671118"
              className="bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated during setup, cannot be changed.
            </p>
          </div>
          <div>
            <Label>Established Year</Label>
            <Input
              type="number"
              value={form.establishedYear || ""}
              onChange={(e) => set("establishedYear", e.target.value)}
              placeholder="2018"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              type="url"
              value={form.website || ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://mukita.org/"
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      {/* ===== Branding ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>School Logo</Label>
            {readOnly ? (
              <div className="flex items-center gap-3">
                {form.schoolLogo ? (
                  <img
                    src={form.schoolLogo}
                    alt="School logo"
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <span className="text-xl font-bold">
                      {(form.schoolName || "S").charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-500">
                  {form.schoolLogo ? "Logo uploaded" : "No logo uploaded"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {form.schoolLogo ? (
                  <img
                    src={form.schoolLogo}
                    alt="School logo"
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <span className="text-xl font-bold">
                      {(form.schoolName || "S").charAt(0)}
                    </span>
                  </div>
                )}
                <label className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => set("schoolLogo", reader.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {form.schoolLogo && (
                  <button
                    type="button"
                    onClick={() => set("schoolLogo", "")}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>Logo Frame Shape</Label>
            <Select
              value={form.logoFrameShape || ""}
              onChange={(e) => set("logoFrameShape", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select logo frame shape</option>
              <option value="square">Square</option>
              <option value="rounded-square">Rounded Square</option>
              <option value="circle">Circle</option>
              <option value="flexible">Flexible</option>
            </Select>
          </div>
          <div>
            <Label>Primary Theme Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryThemeColor || "#2563EB"}
                onChange={(e) => set("primaryThemeColor", e.target.value)}
                disabled={readOnly}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
              />
              <Input
                value={(form.primaryThemeColor || "").toUpperCase()}
                onChange={(e) => set("primaryThemeColor", e.target.value)}
                placeholder="#2563EB"
                disabled={readOnly}
                className="uppercase"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Contact & Location ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Contact & Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Address</Label>
            <Input
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Bairagarh Bhopal"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Country</Label>
            <Select
              value={form.country || ""}
              onChange={(e) => set("country", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select country</option>
              {[
                "India",
                "United States",
                "United Kingdom",
                "United Arab Emirates",
                "Canada",
                "Australia",
                "Singapore",
                "Malaysia",
                "Germany",
                "Nepal",
                "Sri Lanka",
                "Bangladesh",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      {/* ===== Academic Configuration ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Academic Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Institution Type</Label>
            <Select
              value={form.institutionType || ""}
              onChange={(e) => set("institutionType", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select institution type</option>
              <option value="preschool">Preschool</option>
              <option value="k12_school">K-12 School</option>
              <option value="higher_secondary">Higher Secondary</option>
            </Select>
          </div>
          <div>
            <Label>Curriculum Country</Label>
            <Select
              value={form.curriculumCountry || ""}
              onChange={(e) => set("curriculumCountry", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select curriculum country</option>
              {["India", "United States", "United Kingdom", "United Arab Emirates", "International"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Curriculum Board</Label>
            <Select
              value={form.curriculumBoard || ""}
              onChange={(e) => set("curriculumBoard", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select curriculum board</option>
              {[
                "State Board",
                "CBSE",
                "ICSE",
                "IB",
                "Cambridge (IGCSE)",
                "American Curriculum",
                "National Curriculum (UK)",
              ].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Language Preference</Label>
            <Select
              value={form.languagePreference || ""}
              onChange={(e) => set("languagePreference", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select language</option>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="regional">Regional</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label>Grade From</Label>
            <Select
              value={form.gradeFrom || ""}
              onChange={(e) => set("gradeFrom", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select grade</option>
              {[
                "Nursery",
                "KG",
                "Grade 1",
                "Grade 2",
                "Grade 3",
                "Grade 4",
                "Grade 5",
                "Grade 6",
                "Grade 7",
                "Grade 8",
                "Grade 9",
                "Grade 10",
                "Grade 11",
                "Grade 12",
              ].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Grade To</Label>
            <Select
              value={form.gradeTo || ""}
              onChange={(e) => set("gradeTo", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select grade</option>
              {[
                "Nursery",
                "KG",
                "Grade 1",
                "Grade 2",
                "Grade 3",
                "Grade 4",
                "Grade 5",
                "Grade 6",
                "Grade 7",
                "Grade 8",
                "Grade 9",
                "Grade 10",
                "Grade 11",
                "Grade 12",
              ].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      {/* ===== Recommendations (Read-Only) ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Recommendation Type</Label>
            <Input
              value={form.recommendationType || ""}
              readOnly
              disabled
              className="bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Generated by the setup wizard recommendation engine.
            </p>
          </div>
          <div>
            <Label>Recommendation Confidence</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${form.recommendationConfidence || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {form.recommendationConfidence || 0}%
              </span>
            </div>
          </div>
        </div>
        {(form.recommendationRules || []).length > 0 && (
          <div className="mt-4">
            <Label>Recommendation Rules</Label>
            <div className="flex flex-wrap gap-2">
              {(form.recommendationRules || []).map((rule) => (
                <span
                  key={rule}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {rule}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== Module Configuration ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Module Configuration
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label>Enabled Modules</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(form.enabledModules || []).map((module) => (
                <button
                  key={module}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleModule(module, true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                    ${
                      readOnly
                        ? "bg-green-50 text-green-700 border-green-200 cursor-default"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                >
                  {module}
                  {!readOnly && (
                    <span className="text-green-500 font-bold">&times;</span>
                  )}
                </button>
              ))}
              {!readOnly &&
                ALL_MODULES.filter(
                  (m) => !(form.enabledModules || []).includes(m)
                ).map((module) => (
                  <button
                    key={`add-${module}`}
                    type="button"
                    onClick={() => toggleModule(module, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:border-green-300 hover:text-green-600"
                  >
                    + {module}
                  </button>
                ))}
            </div>
          </div>
          <div>
            <Label>Disabled Modules</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(form.disabledModules || []).map((module) => (
                <button
                  key={module}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleModule(module, false)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                    ${
                      readOnly
                        ? "bg-gray-50 text-gray-600 border-gray-200 cursor-default"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  {module}
                  {!readOnly && (
                    <span className="text-green-600 font-bold">+</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Module Legend (edit mode) ===== */}
      {!readOnly && (
        <p className="text-xs text-gray-500 px-1">
          Click a module chip to move it between Enabled and Disabled. Click{" "}
          <span className="font-semibold text-green-600">&times;</span> on an
          enabled module to disable it, or <span className="font-semibold text-green-600">+</span>{" "}
          on a disabled module to enable it.
        </p>
      )}
    </div>
  );
}