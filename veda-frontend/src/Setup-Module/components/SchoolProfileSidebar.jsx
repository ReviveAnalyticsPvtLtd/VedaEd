import React from "react";
import SchoolBrandingPreview from "./SchoolBrandingPreview";
import ProfileHealthCard from "./ProfileHealthCard";

const SchoolProfileSidebar = ({
  form,
  healthItems,
  showCountryTip,
}) => {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <SchoolBrandingPreview
        schoolName={form.schoolName}
        schoolCode={form.schoolCode}
        primaryThemeColor={form.primaryThemeColor}
        schoolLogo={form.schoolLogo}
        logoPreviewUrl={form.schoolLogoPreview}
      />
      <ProfileHealthCard items={healthItems} />
      <div className="rounded-xl border border-setup-border bg-gray-50 p-5">
        <p className="text-sm font-semibold text-setup-heading">Recommendation</p>
        <p className="mt-2 text-sm leading-relaxed text-setup-muted">
          {showCountryTip
            ? "Select your country to auto-suggest timezone and currency. These can be edited manually."
            : "Use a square logo and a distinct school code for receipts, IDs, and internal references."}
        </p>
      </div>
    </aside>
  );
};

export default SchoolProfileSidebar;
