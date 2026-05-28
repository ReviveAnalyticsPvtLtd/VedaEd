import React from "react";
import SetupStepHeader from "./SetupStepHeader";
import SetupFormSection from "./SetupFormSection";
import SetupFormField from "./SetupFormField";
import SetupSearchableSelect, { formatCountryOption } from "./SetupSearchableSelect";
import SetupPhoneField from "./SetupPhoneField";
import LogoShapePicker from "./LogoShapePicker";
import { blockNonDigitNumberKeys } from "../utils/inputFilters";
import { getPhoneLengthRule } from "../services/phoneValidation";
import SchoolLogoUpload from "./SchoolLogoUpload";
import ThemeColorPicker from "./ThemeColorPicker";
import { resolveSchoolLogoUrl } from "../utils/schoolLogoUrl";

const SchoolProfileForm = ({
  form,
  errors,
  onChange,
  onEstablishedYearChange,
  onStateChange,
  onPostalCodeChange,
  phoneDial,
  phoneNational,
  phoneOptions,
  phoneMaxLength,
  onPhoneDialChange,
  onPhoneNationalChange,
  onEmergencyContactChange,
  onCountryChange,
  onLogoSelect,
  onLogoRemove,
  logoUploading,
  logoError,
  logoWarning,
  localization,
}) => {
  const logoDisplayUrl =
    form.schoolLogoPreview || resolveSchoolLogoUrl(form.schoolLogo);
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const {
    countriesLoading,
    statesLoading,
    countryCode,
    countryOptions,
    stateOptions,
    cityOptions,
    timezoneOptions,
    currencyOptions,
    postalLookupLoading,
    hasStates,
    hasCities,
  } = localization;

  const phoneHint = countryCode
    ? (() => {
        const { min, max } = getPhoneLengthRule(countryCode);
        return min === max
          ? `Enter ${min} digits for the selected country code.`
          : `Enter ${min}–${max} digits for the selected country code.`;
      })()
    : "Select a country code, then enter your phone number.";

  return (
    <div className="min-w-0 space-y-6">
      <SetupStepHeader
        badge="Foundation Setup"
        title="Tell us about your school"
        description="Provide your school's basic information, branding, and contact details to personalize your workspace."
      />

      <SetupFormSection
        title="Basic Information"
        subtitle="This information will be used across the system for identification."
        required
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SetupFormField
            label="School Name"
            name="schoolName"
            value={form.schoolName}
            onChange={handleChange}
            placeholder="e.g. St. Xavier's International School"
            required
            error={errors.schoolName}
          />
          <SetupFormField
            label="School Code"
            name="schoolCode"
            value={form.schoolCode}
            onChange={handleChange}
            placeholder="e.g. SXIS-01"
            hint="Used in IDs, receipts, and internal references."
            required
            error={errors.schoolCode}
          />
          <SetupFormField
            label="Established Year"
            name="establishedYear"
            value={form.establishedYear}
            onChange={(e) => onEstablishedYearChange(e.target.value)}
            onKeyDown={blockNonDigitNumberKeys}
            placeholder="e.g. 1995"
            type="text"
            inputMode="numeric"
            maxLength={4}
            error={errors.establishedYear}
          />
          <SetupFormField
            label="Website"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="e.g. https://www.school.com"
            error={errors.website}
          />
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Branding"
        subtitle="Upload your school logo and choose a primary theme color."
        required
      >
        <SchoolLogoUpload
          logoPath={form.schoolLogo}
          previewUrl={form.schoolLogoPreview}
          frameShape={form.logoFrameShape}
          onFileSelect={onLogoSelect}
          onRemove={onLogoRemove}
          uploading={logoUploading}
          error={logoError || errors.schoolLogo}
          warning={logoWarning}
        />
        <div className="mt-5">
          <LogoShapePicker
            value={form.logoFrameShape}
            onChange={(shape) => onChange("logoFrameShape", shape)}
            logoUrl={logoDisplayUrl}
            accentColor={form.primaryThemeColor}
          />
        </div>
        <div className="mt-6">
          <ThemeColorPicker
            value={form.primaryThemeColor}
            onChange={(color) => onChange("primaryThemeColor", color)}
            accentColor={form.primaryThemeColor}
          />
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Address & Localization"
        subtitle="Used for calendar, timezone, currency, communication, and compliance formatting."
        required
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SetupFormField
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Street, area, landmark"
            as="textarea"
            required
            error={errors.address}
          />

          <SetupSearchableSelect
            label="Country"
            name="country"
            value={countryCode}
            onChange={onCountryChange}
            options={countryOptions}
            placeholder="Select Country"
            required
            error={errors.country}
            isLoading={countriesLoading}
            formatOptionLabel={formatCountryOption}
            noOptionsMessage="No countries found"
          />

          {hasStates ? (
            <SetupSearchableSelect
              label="State / Province"
              name="state"
              value={form.state}
              onChange={onStateChange}
              options={stateOptions}
              placeholder="Select State / Province"
              isLoading={statesLoading}
              isDisabled={!countryCode}
              noOptionsMessage={
                countryCode ? "No states found for this country" : "Select a country first"
              }
            />
          ) : (
            <SetupFormField
              label="State / Province"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder={
                countryCode
                  ? "Enter state / province"
                  : "Select a country first"
              }
              hint={
                countryCode
                  ? "No predefined states for this country — enter manually."
                  : undefined
              }
            />
          )}

          {hasCities ? (
            <SetupSearchableSelect
              label="City"
              name="city"
              value={form.city}
              onChange={(val) => onChange("city", val)}
              options={cityOptions}
              placeholder={
                form.state ? "Select or type city" : "Select state first"
              }
              isDisabled={!form.state}
              isCreatable
              creatableHint="Pick from the list or type a custom city name."
              noOptionsMessage={
                form.state ? "Type to add a city" : "Select state first"
              }
            />
          ) : (
            <SetupFormField
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder={
                form.state
                  ? "Enter city name"
                  : countryCode
                    ? "Select or enter state first"
                    : "Select country first"
              }
              hint={
                form.state
                  ? "No predefined cities for this state — enter manually."
                  : undefined
              }
            />
          )}
          <SetupFormField
            label="Postal Code"
            name="postalCode"
            value={form.postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder={countryCode === "IN" ? "e.g. 462001" : "e.g. 10001"}
            hint={
              postalLookupLoading
                ? "Looking up address..."
                : countryCode
                  ? "Enter postal code to auto-fill state and city."
                  : "Select country first."
            }
            inputMode="numeric"
          />

          <SetupSearchableSelect
            label="Time Zone"
            name="timezone"
            value={form.timezone}
            onChange={(val) => onChange("timezone", val)}
            options={timezoneOptions}
            placeholder="Select Time Zone"
            required
            error={errors.timezone}
            isDisabled={!countryCode}
            isLoading={statesLoading && Boolean(countryCode)}
            noOptionsMessage={
              countryCode
                ? "No timezones found"
                : "Select a country first"
            }
          />

          <SetupSearchableSelect
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={(val) => onChange("currency", val)}
            options={currencyOptions}
            placeholder="Select Currency"
            required
            error={errors.currency}
            isDisabled={!countryCode}
            noOptionsMessage={
              countryCode
                ? "No currencies found"
                : "Select a country first"
            }
          />
        </div>
      </SetupFormSection>

      <SetupFormSection
        title="Contact Details"
        subtitle="These contacts will be used in notifications, receipts, and official communication."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SetupFormField
            label="Official Email"
            name="officialEmail"
            value={form.officialEmail}
            onChange={handleChange}
            placeholder="admin@school.com"
            type="email"
            error={errors.officialEmail}
          />
          <SetupPhoneField
            label="Phone Number"
            dialCode={phoneDial}
            nationalNumber={phoneNational}
            onDialChange={onPhoneDialChange}
            onNationalChange={onPhoneNationalChange}
            dialOptions={phoneOptions}
            maxLength={phoneMaxLength}
            placeholder="9876543210"
            hint={phoneHint}
            error={errors.phoneNumber}
          />
          <SetupFormField
            label="Support Email"
            name="supportEmail"
            value={form.supportEmail}
            onChange={handleChange}
            placeholder="support@school.com"
            type="email"
            error={errors.supportEmail}
          />
          <SetupFormField
            label="Emergency Contact"
            name="emergencyContact"
            value={form.emergencyContact}
            onChange={(e) => onEmergencyContactChange(e.target.value)}
            placeholder="Emergency number"
            type="tel"
            inputMode="numeric"
            maxLength={15}
          />
        </div>
      </SetupFormSection>
    </div>
  );
};

export default SchoolProfileForm;
