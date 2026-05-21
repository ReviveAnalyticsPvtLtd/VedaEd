import React, { useMemo } from "react";
import SetupStepHeader from "./SetupStepHeader";
import SetupFormSection from "./SetupFormSection";
import InstitutionTypeCard from "./InstitutionTypeCard";
import SetupSearchableSelect, { formatCountryOption } from "./SetupSearchableSelect";
import LanguageSupportChips from "./LanguageSupportChips";
import {
  INSTITUTION_TYPE_OPTIONS,
} from "../constants/schoolTypeCurriculum";
import {
  getBoardOptionsForCountry,
  getGradeSelectOptions,
} from "../utils/curriculumRecommendations";
import { loadAllCountries } from "../services/localizationData";

const countryOptions = loadAllCountries().map((c) => ({
  value: c.name,
  label: c.name,
  flag: c.flag,
}));

const SchoolTypeCurriculumForm = ({
  form,
  errors,
  onInstitutionChange,
  onFieldChange,
}) => {
  const boardOptions = useMemo(
    () => getBoardOptionsForCountry(form.country),
    [form.country]
  );
  const gradeOptions = useMemo(() => getGradeSelectOptions(), []);

  return (
    <div className="space-y-6">
      <SetupStepHeader
        badge="Academic Foundation"
        title="Choose your institution type and curriculum"
        description="This decision controls the questions, templates, subjects, grading, exams, and operational rules VedaSchool recommends next."
      />

      <SetupFormSection
        title="Institution Type"
        subtitle="Select the model that best matches your school."
        required
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {INSTITUTION_TYPE_OPTIONS.map((option) => (
            <InstitutionTypeCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={form.institutionType === option.id}
              onSelect={() => onInstitutionChange(option.id)}
            />
          ))}
        </div>
        {errors.institutionType ? (
          <p className="mt-2 text-xs text-red-600">{errors.institutionType}</p>
        ) : null}
      </SetupFormSection>

      <SetupFormSection
        title="Curriculum / Board"
        subtitle="VedaSchool will load recommendation rules based on your selected curriculum."
        required
      >
        {/* Future Update: Add multilingual curriculum and language support here */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SetupSearchableSelect
            label="Country / Region"
            name="curriculumCountry"
            options={countryOptions}
            value={form.country}
            onChange={(val) => {
              onFieldChange("country", val);
              onFieldChange("curriculumBoard", "");
            }}
            placeholder="Select country"
            required
            error={errors.country}
            formatOptionLabel={formatCountryOption}
          />
          <SetupSearchableSelect
            label="Board / Curriculum"
            name="curriculumBoard"
            options={boardOptions}
            value={form.curriculumBoard}
            onChange={(val) => onFieldChange("curriculumBoard", val)}
            placeholder={
              form.country ? "Select board" : "Select country first"
            }
            required
            error={errors.curriculumBoard}
            isDisabled={!form.country}
            isClearable={false}
          />
        </div>

        <LanguageSupportChips
          value={form.languagePreference}
          onChange={(val) => onFieldChange("languagePreference", val)}
        />
      </SetupFormSection>

      <SetupFormSection
        title="Grades / Classes Offered"
        subtitle="This controls academic structure, subjects, streams, exams, and promotion logic."
        required
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SetupSearchableSelect
            label="From"
            name="gradeFrom"
            options={gradeOptions}
            value={form.gradeFrom}
            onChange={(val) => onFieldChange("gradeFrom", val)}
            placeholder="From grade"
            required
            error={errors.gradeFrom}
            isClearable={false}
          />
          <SetupSearchableSelect
            label="To"
            name="gradeTo"
            options={gradeOptions}
            value={form.gradeTo}
            onChange={(val) => onFieldChange("gradeTo", val)}
            placeholder="To grade"
            required
            error={errors.gradeTo || errors.gradeRange}
            isClearable={false}
          />
        </div>
      </SetupFormSection>
    </div>
  );
};

export default SchoolTypeCurriculumForm;
