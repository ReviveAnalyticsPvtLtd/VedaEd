import React from "react";
import { DEFAULT_LOGO_FRAME_SHAPE } from "../constants/schoolProfile";
import { resolveSchoolLogoUrl } from "../utils/schoolLogoUrl";
import LogoPreview from "./LogoPreview";

const SchoolBrandingPreview = ({
  schoolName,
  schoolCode,
  primaryThemeColor,
  schoolLogo,
  logoPreviewUrl,
  logoFrameShape = DEFAULT_LOGO_FRAME_SHAPE,
}) => {
  const logoUrl = logoPreviewUrl || resolveSchoolLogoUrl(schoolLogo);
  const displayName = schoolName?.trim() || "Your School Name";
  const displayCode = schoolCode?.trim() || "School Code will appear here";

  return (
    <div className="overflow-hidden rounded-xl border border-setup-border bg-white shadow-sm">
      <div
        className="px-5 py-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryThemeColor} 0%, ${primaryThemeColor}dd 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <LogoPreview
            src={logoUrl}
            frameShape={logoFrameShape}
            size="sm"
            placeholder="V"
            variant="branding"
            backgroundColor="#ffffff"

          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold uppercase tracking-wide">
              {displayName}
            </p>
            <p className="truncate text-xs text-white/85">{displayCode}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-setup-muted">
          Branding appears on
        </p>
        <ul className="mt-2 space-y-1 text-sm text-setup-heading">
          <li>• Portal &amp; dashboards</li>
          <li>• Reports &amp; receipts</li>
          <li>• ID cards &amp; certificates</li>
        </ul>
      </div>
    </div>
  );
};

export default SchoolBrandingPreview;
