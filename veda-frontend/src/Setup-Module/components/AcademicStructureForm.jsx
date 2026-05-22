import React, { useMemo } from "react";
import SetupStepHeader from "./SetupStepHeader";
import SetupFormSection from "./SetupFormSection";
import SetupFormField from "./SetupFormField";
import {
  ACADEMIC_YEAR_PATTERNS,
  SECTION_MODE_OPTIONS,
  SUBJECT_FRAMEWORK_OPTIONS,
  TERM_OPTIONS,
} from "../constants/academicStructure";
import { getGradeSelectOptions } from "../utils/curriculumRecommendations";

const chipBase =
  "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200";
const chipActive = "border-setup-primary bg-setup-primary text-white shadow-sm";
const chipInactive =
  "border-setup-border bg-white text-setup-heading hover:border-blue-300 hover:bg-blue-50/40";

const AcademicStructureForm = ({
  form,
  errors,
  estimatedSections,
  showStreams,
  streamOptions,
  onFieldChange,
  onPatternChange,
  onTermSelect,
  onSectionModeSelect,
  onSubjectFrameworkSelect,
  onToggleStream,
}) => {
  const gradeOptions = useMemo(
    () => getGradeSelectOptions().map((g) => g.value),
    []
  );

  return (
    <div className="space-y-6">
      <SetupStepHeader
        badge="Academic Backbone"
        title="Set up your academic structure"
        description="Define academic year, terms, grades, sections, streams, and subject setup mode. These settings drive attendance, timetable, exams, fees, and dashboards."
      />

      <SetupFormSection
        title="Academic Year"
        subtitle="Create the active academic session for your school."
        required
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SetupFormField
            label="Academic Year Name"
            name="academicYear"
            value={form.academicYear}
            onChange={(e) => onFieldChange("academicYear", e.target.value)}
            error={errors.academicYear}
            required
          />
          <div>
            <label
              htmlFor="setup-field-academicYearPattern"
              className="text-sm font-semibold text-setup-heading"
            >
              Recommended Pattern
            </label>
            <select
              id="setup-field-academicYearPattern"
              value={form.academicYearPattern}
              onChange={(e) => onPatternChange(e.target.value)}
              className="mt-1.5 w-full cursor-pointer rounded-lg border border-setup-border bg-white px-3.5 py-2.5 text-sm text-setup-heading transition focus:border-setup-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {ACADEMIC_YEAR_PATTERNS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <SetupFormField
            label="Start Date"
            name="academicYearStart"
            type="date"
            value={form.academicYearStart}
            onChange={(e) => onFieldChange("academicYearStart", e.target.value)}
          />
          <SetupFormField
            label="End Date"
            name="academicYearEnd"
            type="date"
            value={form.academicYearEnd}
            onChange={(e) => onFieldChange("academicYearEnd", e.target.value)}
          />
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Terms / Semesters"
        subtitle="Choose how the academic year is divided."
        badge="CBSE Recommended"
      >
        <div className="flex flex-wrap gap-2">
          {TERM_OPTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onTermSelect(term)}
              className={`${chipBase} ${
                form.termStructure === term ? chipActive : chipInactive
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Grades & Sections"
        subtitle="Define the classes offered and how sections should be created."
        required
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SetupFormField
            label="Grade From"
            name="gradeFrom"
            as="select"
            value={form.gradeFrom}
            onChange={(e) => onFieldChange("gradeFrom", e.target.value)}
            options={gradeOptions}
            error={errors.gradeFrom || errors.gradeRange}
            required
          />
          <SetupFormField
            label="Grade To"
            name="gradeTo"
            as="select"
            value={form.gradeTo}
            onChange={(e) => onFieldChange("gradeTo", e.target.value)}
            options={gradeOptions}
            error={errors.gradeTo}
            required
          />
          <SetupFormField
            label="Expected Students"
            name="expectedStudents"
            type="number"
            value={form.expectedStudents}
            onChange={(e) =>
              onFieldChange("expectedStudents", e.target.value)
            }
            error={errors.expectedStudents}
            required
          />
          <SetupFormField
            label="Max Students / Section"
            name="maxStudentsPerSection"
            type="number"
            value={form.maxStudentsPerSection}
            onChange={(e) =>
              onFieldChange("maxStudentsPerSection", e.target.value)
            }
            hint={`Estimated total sections: ${estimatedSections} across selected grades.`}
            error={errors.maxStudentsPerSection}
            required
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SECTION_MODE_OPTIONS.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSectionModeSelect(mode.id)}
              aria-pressed={form.sectionMode === mode.id}
              className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                form.sectionMode === mode.id
                  ? "border-setup-primary bg-blue-50/70 shadow-md ring-1 ring-setup-primary/20"
                  : "border-setup-border bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <p className="text-sm font-semibold text-setup-heading">
                {mode.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-setup-muted">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Streams & Electives"
        subtitle="Shown when higher secondary grades are included."
        badge="Dynamic"
      >
        {showStreams ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-sm font-semibold text-setup-heading">
              Recommended Streams
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {streamOptions.map((stream) => (
                <button
                  key={stream}
                  type="button"
                  onClick={() => onToggleStream(stream)}
                  className={`${chipBase} ${
                    form.streams.includes(stream) ? chipActive : chipInactive
                  }`}
                >
                  {stream}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-setup-muted">
              Because Grade 11–12 is included, streams are recommended.
            </p>
          </div>
        ) : (
          <p className="text-sm text-setup-muted">
            Streams are not required for the selected grade range.
          </p>
        )}
      </SetupFormSection>

      <SetupFormSection
        title="Subject Framework"
        subtitle="Choose how subjects should be created in the next step."
        required
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SUBJECT_FRAMEWORK_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSubjectFrameworkSelect(option.key)}
              aria-pressed={form.subjectFramework === option.key}
              className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                form.subjectFramework === option.key
                  ? "border-setup-primary bg-blue-50/70 shadow-md ring-1 ring-setup-primary/20"
                  : "border-setup-border bg-white hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <p className="text-sm font-semibold text-setup-heading">
                {option.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-setup-muted">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </SetupFormSection>
    </div>
  );
};

export default AcademicStructureForm;
