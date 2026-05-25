import React from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import SetupWizardLayout from "./components/SetupWizardLayout";
import SetupProgressBar from "./components/SetupProgressBar";
import SetupWizardFooter from "./components/SetupWizardFooter";
import SetupStepHeader from "./components/SetupStepHeader";
import SetupFormSection from "./components/SetupFormSection";
import SmartCheckCard from "./components/SmartCheckCard";
import { useSetupWizardStep9 } from "./hooks/useSetupWizardStep9";
import {
  ASSESSMENT_MODEL_OPTIONS,
  GRADE_SCALE_SCOPE_OPTIONS,
  REPORT_CARD_FORMAT_OPTIONS,
  REPORT_CARD_SECTION_OPTIONS,
  RESULT_DISPLAY_OPTIONS,
  RESULT_PUBLISHING_OPTIONS,
  STEP_9_NUMBER,
  STEP_9_PROGRESS,
} from "./constants/examinationGradebook";

const Step9ExaminationSetup = () => {
  const {
    form,
    errors,
    loading,
    saving,
    toast,
    toastBannerClassName,
    totalSteps,
    summary,
    recommendationText,
    dependencyStatus,
    smartCheckMessages,
    weightageTotal,
    updateField,
    selectAssessmentModel,
    selectResultDisplayFormat,
    toggleReportCardSection,
    updateGradeRow,
    addGradeRow,
    removeGradeRow,
    updateWeightageRow,
    addWeightageRow,
    removeWeightageRow,
    handleSaveContinue,
    handleBack,
    handleSaveExit,
  } = useSetupWizardStep9();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-setup-page">
        <p className="text-sm font-medium text-gray-500">Loading setup wizard...</p>
      </div>
    );
  }

  return (
    <SetupWizardLayout onSaveExit={handleSaveExit} saving={saving}>
      <SetupProgressBar
        step={STEP_9_NUMBER}
        total={totalSteps}
        progress={STEP_9_PROGRESS}
        title="Examination & Gradebook"
      />

      {toast ? (
        <div className="px-6 pt-4 sm:px-8">
          <p
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SetupStepHeader
            badge="Assessment Foundation"
            title="Configure exams, grading, and gradebook rules"
            description="Define how assessments are planned, marks are entered, grades are calculated, report cards are generated, and promotion rules are connected."
          />

          <SetupFormSection
            title="Assessment Model"
            subtitle="Choose the exam structure your school follows."
            required
          >
            <div className="grid gap-4 md:grid-cols-2">
              {ASSESSMENT_MODEL_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = form.assessmentModel === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectAssessmentModel(option.key)}
                    className={`rounded-xl border p-5 text-left transition-all ${
                      active
                        ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-100"
                        : "border-setup-border bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="text-lg" />
                    </div>
                    <h4 className="mt-4 text-base font-bold text-setup-heading">
                      {option.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-setup-muted">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.assessmentModel} className="mt-3" />
          </SetupFormSection>

          <SetupFormSection
            title="Result Display Format"
            subtitle="Choose how results should appear to teachers, students, parents, and report cards."
            badge="Recommended"
          >
            <div className="flex flex-wrap gap-3">
              {RESULT_DISPLAY_OPTIONS.map((option) => (
                <ChipButton
                  key={option}
                  active={form.resultDisplayFormat === option}
                  onClick={() => selectResultDisplayFormat(option)}
                  label={option}
                  recommended={option === "Marks + Grade"}
                />
              ))}
            </div>
            <FieldError message={errors.resultDisplayFormat} className="mt-3" />
          </SetupFormSection>

          <SetupFormSection
            title="Marks Range & Grade Scale"
            subtitle="Define the default grade boundaries. These can be global, grade-wise, or subject-wise."
            required
          >
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Apply Grade Scale"
                value={form.gradeScaleScope}
                options={GRADE_SCALE_SCOPE_OPTIONS}
                inputClassName="h-12 rounded-[18px] px-4 text-base"
                onChange={(event) => updateField("gradeScaleScope", event.target.value)}
              />
              <InputField
                label="Default Passing Marks %"
                type="number"
                min={0}
                max={100}
                value={form.defaultPassingMarks}
                error={errors.defaultPassingMarks}
                inputClassName="h-12 rounded-[18px] px-4 text-base"
                onChange={(event) =>
                  updateField("defaultPassingMarks", event.target.value)
                }
              />
            </div>

            <div className="mt-8 hidden grid-cols-[1fr_1fr_1fr_1.1fr_44px] gap-6 px-3 text-sm font-semibold uppercase tracking-[0.18em] text-setup-muted md:grid">
              <span>Grade</span>
              <span>Min %</span>
              <span>Max %</span>
              <span>Description</span>
              <span className="text-center"> </span>
            </div>

            <div className="mt-3 space-y-4">
              {form.gradeTable.map((row) => (
                <div
                  key={row.rowId}
                  className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-3 md:p-3.5"
                >
                  <div className="grid gap-2.5 md:grid-cols-[1fr_1fr_1fr_1.1fr_44px] md:items-center md:gap-4">
                    <TableCellInput
                      label="Grade"
                      value={row.grade}
                      placeholder="Grade"
                      onChange={(event) =>
                        updateGradeRow(row.rowId, "grade", event.target.value)
                      }
                    />
                    <TableCellInput
                      label="Min %"
                      type="number"
                      min={0}
                      max={100}
                      value={row.minPercentage}
                      placeholder="Min %"
                      onChange={(event) =>
                        updateGradeRow(row.rowId, "minPercentage", event.target.value)
                      }
                    />
                    <TableCellInput
                      label="Max %"
                      type="number"
                      min={0}
                      max={100}
                      value={row.maxPercentage}
                      placeholder="Max %"
                      onChange={(event) =>
                        updateGradeRow(row.rowId, "maxPercentage", event.target.value)
                      }
                    />
                    <TableCellInput
                      label="Description"
                      value={row.description}
                      placeholder="Description"
                      onChange={(event) =>
                        updateGradeRow(row.rowId, "description", event.target.value)
                      }
                    />
                    <div className="flex items-center justify-end md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeGradeRow(row.rowId)}
                        disabled={form.gradeTable.length === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Delete grade row"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <FieldError
                      message={errors.gradeTableRows?.[row.rowId]}
                      className="text-xs"
                    />
                    {form.gradeTable.length === 1 ? (
                      <span className="text-xs font-medium text-setup-muted">
                        Minimum one grade row required
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <FieldError message={errors.gradeTable} />
              <button
                type="button"
                onClick={addGradeRow}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <FiPlus />
                Add Grade Row
              </button>
            </div>
          </SetupFormSection>

          <SetupFormSection
            title="Assessment Weightage"
            subtitle="Set how different assessment components contribute to the final result."
          >
            <div className="space-y-4">
              {form.assessmentWeightage.map((row) => (
                <div key={row.rowId}>
                  <div className="grid gap-2.5 md:grid-cols-[1.35fr_1fr_1fr_44px] md:items-center md:gap-3.5">
                    <TableCellInput
                      label="Assessment Name"
                      value={row.assessmentName}
                      placeholder="Assessment Name"
                      onChange={(event) =>
                        updateWeightageRow(
                          row.rowId,
                          "assessmentName",
                          event.target.value
                        )
                      }
                    />
                    <TableCellInput
                      label="Weight Value"
                      type="number"
                      min={0}
                      max={100}
                      value={row.weightValue}
                      placeholder="Weight Value"
                      onChange={(event) =>
                        updateWeightageRow(
                          row.rowId,
                          "weightValue",
                          event.target.value
                        )
                      }
                    />
                    <TableCellSelect
                      label="Weight Type"
                      value={row.weightType}
                      options={["% Weight"]}
                      onChange={() => {}}
                    />
                    <div className="flex items-center justify-end md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeWeightageRow(row.rowId)}
                        disabled={form.assessmentWeightage.length === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Delete assessment weightage row"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <FieldError
                      message={errors.assessmentWeightageRows?.[row.rowId]}
                      className="text-xs"
                    />
                    {form.assessmentWeightage.length === 1 ? (
                      <span className="text-xs font-medium text-setup-muted">
                        Minimum one assessment component required
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-setup-heading">
                  Total Weightage: {weightageTotal}%
                </p>
                <p className="mt-1 text-xs text-setup-muted">
                  Total assessment weightage must equal 100%.
                </p>
                <FieldError message={errors.assessmentWeightage} />
                <FieldError message={errors.assessmentWeightageTotal} className="mt-1 text-xs" />
              </div>
              <button
                type="button"
                onClick={addWeightageRow}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <FiPlus />
                Add Assessment Component
              </button>
            </div>
          </SetupFormSection>

          <SetupFormSection
            title="Report Card Setup"
            subtitle="Choose the default report card style and publishing control."
            required
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Report Card Format"
                value={form.reportCardFormat}
                options={REPORT_CARD_FORMAT_OPTIONS}
                onChange={(event) => updateField("reportCardFormat", event.target.value)}
              />
              <SelectField
                label="Result Publishing"
                value={form.resultPublishingMode}
                options={RESULT_PUBLISHING_OPTIONS}
                onChange={(event) =>
                  updateField("resultPublishingMode", event.target.value)
                }
              />
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-setup-muted">
                Report Card Sections
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {REPORT_CARD_SECTION_OPTIONS.map((item) => (
                  <ChipButton
                    key={item}
                    active={form.reportCardSections.includes(item)}
                    onClick={() => toggleReportCardSection(item)}
                    label={item}
                  />
                ))}
              </div>
              <FieldError message={errors.reportCardSections} className="mt-3" />
            </div>
          </SetupFormSection>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
            <h3 className="text-base font-bold">Exam Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              {summary.model} with {summary.resultType} is being prepared.
            </p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Model", value: summary.model },
                { label: "Result", value: summary.resultType },
                { label: "Passing", value: summary.passing },
                { label: "Scale", value: summary.scale },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-blue-900/40 px-3 py-2.5 text-sm"
                >
                  <span className="text-blue-200">{item.label}: </span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <SidebarCard
            title="Dependency Impact"
            description="Exam setup feeds these modules."
          >
            <ul className="mt-4 space-y-2">
              {dependencyStatus.map((item) => (
                <li
                  key={item.module}
                  className="flex items-center justify-between rounded-lg border border-setup-border bg-gray-50/80 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-setup-heading">{item.module}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </SidebarCard>

          <SidebarCard title="Recommendation">
            <p className="mt-2 text-sm leading-relaxed text-setup-muted">
              {recommendationText}
            </p>
          </SidebarCard>

          <SmartCheckCard messages={smartCheckMessages} />
        </aside>
      </div>

      <SetupWizardFooter
        onBack={handleBack}
        onContinue={handleSaveContinue}
        saving={saving}
      />
    </SetupWizardLayout>
  );
};

const SidebarCard = ({ title, description, children }) => (
  <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
    <h3 className="text-base font-bold text-setup-heading">{title}</h3>
    {description ? (
      <p className="mt-1 text-sm text-setup-muted">{description}</p>
    ) : null}
    {children}
  </div>
);

const ChipButton = ({ label, active, onClick, recommended = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active
        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
        : "border-setup-border bg-white text-setup-heading hover:border-blue-200 hover:text-blue-700"
    }`}
  >
    <span>{label}</span>
    {recommended ? (
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          active
            ? "bg-white/20 text-white"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        Recommended
      </span>
    ) : null}
  </button>
);

const InputField = ({
  label,
  error,
  className = "",
  inputClassName = "",
  ...props
}) => (
  <div className={className}>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-setup-muted">
      {label}
    </label>
    <input
      {...props}
      className={`w-full border bg-white text-setup-heading outline-none transition focus:border-blue-500 ${
        error ? "border-red-300" : "border-setup-border"
      } ${inputClassName || "h-11 rounded-lg px-4 text-sm"}`}
    />
    <FieldError message={error} className="mt-2" />
  </div>
);

const SelectField = ({
  label,
  options,
  error,
  inputClassName = "",
  ...props
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-setup-muted">
      {label}
    </label>
    <select
      {...props}
      className={`w-full border bg-white text-setup-heading outline-none transition focus:border-blue-500 ${
        error ? "border-red-300" : "border-setup-border"
      } ${inputClassName || "h-11 rounded-lg px-4 text-sm"}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <FieldError message={error} className="mt-2" />
  </div>
);

const TableCellInput = ({ label, ...props }) => (
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-setup-muted md:sr-only">
      {label}
    </label>
    <input
      {...props}
      className="h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-setup-heading outline-none transition focus:border-blue-500"
    />
  </div>
);

const TableCellSelect = ({ label, options, ...props }) => (
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-setup-muted md:sr-only">
      {label}
    </label>
    <select
      {...props}
      className="h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-setup-heading outline-none transition focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const FieldError = ({ message, className = "" }) =>
  message ? (
    <p className={`text-sm font-medium text-red-600 ${className}`}>{message}</p>
  ) : null;

export default Step9ExaminationSetup;
