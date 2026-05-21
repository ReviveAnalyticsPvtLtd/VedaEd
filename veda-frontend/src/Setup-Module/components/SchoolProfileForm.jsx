import React from "react";
import SetupStepHeader from "./SetupStepHeader";
import SetupFormSection from "./SetupFormSection";
import SetupFormField from "./SetupFormField";
import SchoolLogoUpload from "./SchoolLogoUpload";
import ThemeColorPicker from "./ThemeColorPicker";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../constants/schoolProfile";

const SchoolProfileForm = ({
  form,
  errors,
  onChange,
  onCountryChange,
  onLogoSelect,
  logoUploading,
  logoError,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      onCountryChange(value);
      return;
    }
    onChange(name, value);
  };

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
            onChange={handleChange}
            placeholder="e.g. 1995"
            type="number"
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
          onFileSelect={onLogoSelect}
          uploading={logoUploading}
          error={logoError || errors.schoolLogo}
        />
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
          <SetupFormField
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            as="select"
            options={COUNTRY_OPTIONS}
            placeholder="Select Country"
            required
            error={errors.country}
          />
          <SetupFormField
            label="State / Province"
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="e.g. Madhya Pradesh"
          />
          <SetupFormField
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="e.g. Bhopal"
          />
          <SetupFormField
            label="Postal Code"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            placeholder="e.g. 462001"
          />
          <SetupFormField
            label="Time Zone"
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            as="select"
            options={TIMEZONE_OPTIONS}
            placeholder="Select Time Zone"
            required
            error={errors.timezone}
          />
          <SetupFormField
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            as="select"
            options={CURRENCY_OPTIONS}
            placeholder="Select Currency"
            required
            error={errors.currency}
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
          <SetupFormField
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="+91 98765 43210"
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
            onChange={handleChange}
            placeholder="Emergency number"
          />
        </div>
      </SetupFormSection>
    </div>
  );
};

export default SchoolProfileForm;
