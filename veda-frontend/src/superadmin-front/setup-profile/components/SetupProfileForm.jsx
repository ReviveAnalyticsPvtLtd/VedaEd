import { useState } from "react";
import { Label, Input, Select } from "../../identity-access/components/FormField";
import { ALL_MODULES, THEME_COLOR_PRESETS, DEFAULT_PRIMARY_THEME_COLOR } from "../constants";
import { TERM_OPTIONS, ACADEMIC_YEAR_PATTERNS, STREAM_OPTIONS, SECTION_MODE_OPTIONS } from "../../../Setup-Module/constants/academicStructure";
import { CURRENCY_LABELS } from "../../../Setup-Module/services/localizationData";
import {
  ATTENDANCE_MODES,
  WORKING_DAYS,
  LEAVE_APPROVAL_OPTIONS,
  LEAVE_TYPES,
  PERMISSION_TOGGLES,
  PARENT_NOTIFICATION_TOGGLES,
} from "../../../Setup-Module/constants/attendanceRules";
import OtherSettingsPanel from "./OtherSettingsPanel";

const TABS = [
  { id: "organization", label: "Organization" },
  { id: "academics", label: "Academics" },
  { id: "modules", label: "Modules & Setup" },
  { id: "others", label: "Others" },
];

export default function SetupProfileForm({ form, onChange, readOnly = false }) {
  const [activeTab, setActiveTab] = useState("organization");

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

  const toggleStream = (stream) => {
    if (readOnly) return;
    const streams = form.streams || [];
    set(
      "streams",
      streams.includes(stream)
        ? streams.filter((s) => s !== stream)
        : [...streams, stream]
    );
  };

  const currencyOptions = Object.values(CURRENCY_LABELS);

  const setNested = (field, key, value) => {
    if (readOnly) return;
    set(field, { ...(form[field] || {}), [key]: value });
  };

  const toggleNested = (field, key) =>
    setNested(field, key, !(form[field] || {})[key]);

  const toggleInArray = (field, value) => {
    if (readOnly) return;
    const current = form[field] || [];
    set(
      field,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1.5">
        <div
          role="tablist"
          aria-label="Setup profile sections"
          className="flex flex-wrap gap-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`setup-profile-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`setup-profile-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`setup-profile-panel-${activeTab}`}
        aria-labelledby={`setup-profile-tab-${activeTab}`}
        className="space-y-2"
      >
      {activeTab === "organization" && (
      <>
      {/* ===== Organization Details ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
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
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
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
          <div className="md:col-span-2">
            <Label>Primary Theme Color</Label>
            {/* Predefined Color Swatches */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              {THEME_COLOR_PRESETS.map((preset) => {
                const currentColor = (form.primaryThemeColor || DEFAULT_PRIMARY_THEME_COLOR).toUpperCase();
                const isSelected = currentColor === preset.value.toUpperCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => set("primaryThemeColor", preset.value)}
                    className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-gray-900 bg-gray-50 shadow-sm ring-2 ring-offset-1 ring-gray-900"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    } ${readOnly ? "cursor-default opacity-85" : "cursor-pointer"}`}
                    title={preset.label}
                    aria-label={`Select ${preset.label} theme color (${preset.value})`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shadow-inner border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.value }}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-800 font-semibold">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input & Hex Value */}
            <div className="mt-3 flex items-center gap-3">
              <input
                type="color"
                value={form.primaryThemeColor || DEFAULT_PRIMARY_THEME_COLOR}
                onChange={(e) => set("primaryThemeColor", e.target.value.toUpperCase())}
                disabled={readOnly}
                aria-label="Theme color picker"
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed p-0.5 bg-white shrink-0"
              />
              <div className="w-36">
                <Input
                  value={(form.primaryThemeColor || DEFAULT_PRIMARY_THEME_COLOR).toUpperCase()}
                  onChange={(e) => set("primaryThemeColor", e.target.value.toUpperCase())}
                  placeholder="#2563EB"
                  disabled={readOnly}
                  className="uppercase font-mono text-sm"
                />
              </div>
              {!THEME_COLOR_PRESETS.some(
                (p) =>
                  p.value.toUpperCase() ===
                  (form.primaryThemeColor || DEFAULT_PRIMARY_THEME_COLOR).toUpperCase()
              ) && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  Custom Color
                </span>
              )}
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
          <div>
            <Label>State / Province</Label>
            <Input
              value={form.state || ""}
              onChange={(e) => set("state", e.target.value)}
              placeholder="Madhya Pradesh"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              value={form.city || ""}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Bhopal"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Postal Code</Label>
            <Input
              value={form.postalCode || ""}
              onChange={(e) => set("postalCode", e.target.value)}
              placeholder="462001"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Time Zone</Label>
            <Input
              value={form.timezone || ""}
              onChange={(e) => set("timezone", e.target.value)}
              placeholder="Asia/Kolkata"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Select
              value={form.currency || ""}
              onChange={(e) => set("currency", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select currency</option>
              {form.currency && !currencyOptions.includes(form.currency) && (
                <option value={form.currency}>{form.currency}</option>
              )}
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Official Email</Label>
            <Input
              type="email"
              value={form.officialEmail || ""}
              onChange={(e) => set("officialEmail", e.target.value)}
              placeholder="admin@school.com"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={form.phoneNumber || ""}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+91 98765 43210"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Support Email</Label>
            <Input
              type="email"
              value={form.supportEmail || ""}
              onChange={(e) => set("supportEmail", e.target.value)}
              placeholder="support@school.com"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Emergency Contact</Label>
            <Input
              type="tel"
              value={form.emergencyContact || ""}
              onChange={(e) => set("emergencyContact", e.target.value)}
              placeholder="+91 98765 43211"
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      </>
      )}

      {activeTab === "academics" && (
      <>
      {/* ===== Academic Configuration ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Academic Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Academic Year</Label>
            <Input
              value={form.academicYear || ""}
              onChange={(e) => set("academicYear", e.target.value)}
              placeholder="2026-2027"
              disabled={readOnly}
            />
            <p className="mt-1 text-xs text-gray-500">
              Active academic session for the school.
            </p>
          </div>
          <div>
            <Label>Terms / Semesters</Label>
            <Select
              value={form.termStructure || ""}
              onChange={(e) => set("termStructure", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select term structure</option>
              {TERM_OPTIONS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Academic Year Pattern</Label>
            <Select
              value={form.academicYearPattern || ""}
              onChange={(e) => set("academicYearPattern", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select pattern</option>
              {ACADEMIC_YEAR_PATTERNS.map((pattern) => (
                <option key={pattern.value} value={pattern.value}>
                  {pattern.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Academic Year Start</Label>
            <Input
              type="date"
              value={form.academicYearStart || ""}
              onChange={(e) => set("academicYearStart", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Academic Year End</Label>
            <Input
              type="date"
              value={form.academicYearEnd || ""}
              onChange={(e) => set("academicYearEnd", e.target.value)}
              disabled={readOnly}
            />
          </div>
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
          <div>
            <Label>Capacity</Label>
            <Input
              type="number"
              value={form.maxStudentsPerSection || ""}
              onChange={(e) => set("maxStudentsPerSection", e.target.value)}
              placeholder="40"
              disabled={readOnly}
            />
            <p className="mt-1 text-xs text-gray-500">
              Max students per section across classes.
            </p>
          </div>
          <div>
            <Label>Sections</Label>
            <Input
              type="number"
              value={form.sections || ""}
              onChange={(e) => set("sections", e.target.value)}
              placeholder="3"
              disabled={readOnly}
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of sections (A, B, C…) per class.
            </p>
          </div>
          <div>
            <Label>Expected Students</Label>
            <Input
              type="number"
              value={form.expectedStudents ?? ""}
              onChange={(e) => set("expectedStudents", e.target.value)}
              placeholder="1200"
              disabled={readOnly}
            />
            <p className="mt-1 text-xs text-gray-500">
              Total students expected across all classes.
            </p>
          </div>
          <div>
            <Label>Section Mode</Label>
            <Select
              value={form.sectionMode || ""}
              onChange={(e) => set("sectionMode", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select section mode</option>
              {SECTION_MODE_OPTIONS.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Streams (Grade 11–12)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STREAM_OPTIONS.map((stream) => {
                const selected = (form.streams || []).includes(stream);
                return (
                  <button
                    key={stream}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleStream(stream)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600"
                    } ${readOnly ? "cursor-default" : ""}`}
                  >
                    {stream}
                    {selected && <span className="font-bold">×</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Only applies when the school includes Grade 11–12.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Attendance ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900">Attendance</h3>
        <p className="mt-1 text-xs text-gray-500">
          Rules captured in Step 8. Changes apply to future attendance.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Attendance Mode</Label>
            <Select
              value={form.attendanceMode || ""}
              onChange={(e) => set("attendanceMode", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select attendance mode</option>
              {ATTENDANCE_MODES.map((mode) => (
                <option key={mode.key} value={mode.key}>
                  {mode.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Minimum Attendance (%)</Label>
            <Input
              type="number"
              min="50"
              max="100"
              value={form.minimumAttendance ?? ""}
              onChange={(e) => set("minimumAttendance", e.target.value)}
              placeholder="75"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>School Start Time</Label>
            <Input
              type="time"
              value={form.schoolStartTime || ""}
              onChange={(e) => set("schoolStartTime", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>School End Time</Label>
            <Input
              type="time"
              value={form.schoolEndTime || ""}
              onChange={(e) => set("schoolEndTime", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Late Arrival After</Label>
            <Input
              type="time"
              value={form.lateArrivalAfter || ""}
              onChange={(e) => set("lateArrivalAfter", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Auto Absent After</Label>
            <Input
              type="time"
              value={form.autoAbsentAfter || ""}
              onChange={(e) => set("autoAbsentAfter", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Attendance Closing Time</Label>
            <Input
              type="time"
              value={form.attendanceClosingTime || ""}
              onChange={(e) => set("attendanceClosingTime", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Half Day Checkout Time</Label>
            <Input
              type="time"
              value={form.halfDayCheckoutTime || ""}
              onChange={(e) => set("halfDayCheckoutTime", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Grace Minutes</Label>
            <Input
              type="number"
              min="0"
              value={form.graceMinutes ?? ""}
              onChange={(e) => set("graceMinutes", e.target.value)}
              placeholder="10"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label>Working Days</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {WORKING_DAYS.map((day) => {
              const active = (form.workingDays || []).includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleInArray("workingDays", day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600"
                  } ${readOnly ? "cursor-default" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <Label>Leave Types</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {LEAVE_TYPES.map((leaveType) => {
              const active = (form.leaveTypes || []).includes(leaveType);
              return (
                <button
                  key={leaveType}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleInArray("leaveTypes", leaveType)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600"
                  } ${readOnly ? "cursor-default" : ""}`}
                >
                  {leaveType}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Student Leave Approval</Label>
            <Select
              value={form.leaveApprovalRules?.studentLeaveApproval || ""}
              onChange={(e) =>
                setNested(
                  "leaveApprovalRules",
                  "studentLeaveApproval",
                  e.target.value
                )
              }
              disabled={readOnly}
            >
              <option value="">Select approval</option>
              {LEAVE_APPROVAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Staff Leave Approval</Label>
            <Select
              value={form.leaveApprovalRules?.staffLeaveApproval || ""}
              onChange={(e) =>
                setNested(
                  "leaveApprovalRules",
                  "staffLeaveApproval",
                  e.target.value
                )
              }
              disabled={readOnly}
            >
              <option value="">Select approval</option>
              {LEAVE_APPROVAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Attendance Permissions</Label>
            <div className="mt-1 space-y-2">
              {PERMISSION_TOGGLES.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      form.attendancePermissions?.[permission.key]
                    )}
                    onChange={() =>
                      toggleNested("attendancePermissions", permission.key)
                    }
                    disabled={readOnly}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {permission.title}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Parent Notifications</Label>
            <div className="mt-1 space-y-2">
              {PARENT_NOTIFICATION_TOGGLES.map((notification) => (
                <label
                  key={notification.key}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      form.parentNotificationRules?.[notification.key]
                    )}
                    onChange={() =>
                      toggleNested(
                        "parentNotificationRules",
                        notification.key
                      )
                    }
                    disabled={readOnly}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {notification.title}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      </>
      )}

      {activeTab === "modules" && (
      <>
      {/* ===== Recommendations (Read-Only) ===== */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 max-w-md">
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
      </>
      )}

      {activeTab === "others" && <OtherSettingsPanel form={form} />}
      </div>
    </div>
  );
}