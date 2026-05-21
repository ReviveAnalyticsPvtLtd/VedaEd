import React, { useCallback, useRef, useState } from "react";
import {
  ALLOWED_LOGO_EXTENSIONS,
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_SIZE_MB,
  MIN_LOGO_SIZE_PX,
  RECOMMENDED_LOGO_SIZE_PX,
} from "../constants/schoolProfile";
import { resolveSchoolLogoUrl } from "../utils/schoolLogoUrl";

const SchoolLogoUpload = ({ logoPath, previewUrl, onFileSelect, uploading, error }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const displayUrl = previewUrl || resolveSchoolLogoUrl(logoPath);

  const validateFile = (file) => {
    if (!file) return "No file selected";
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_LOGO_EXTENSIONS.includes(ext) && !ALLOWED_LOGO_TYPES.includes(file.type)) {
      return "Please upload PNG, JPG, or SVG only.";
    }
    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_LOGO_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        onFileSelect(null, validationError);
        return;
      }
      onFileSelect(file, null);
    },
    [onFileSelect]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? "border-setup-primary bg-blue-50/80"
            : "border-blue-200 bg-blue-50/40 hover:border-setup-primary hover:bg-blue-50/60"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {displayUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={displayUrl}
              alt="School logo preview"
              className="h-20 w-20 rounded-xl border border-setup-border bg-white object-contain p-1 shadow-sm"
            />
            <p className="text-sm font-medium text-setup-heading">
              {uploading ? "Uploading..." : "Click or drag to replace logo"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                className="h-6 w-6 text-setup-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-setup-heading">Upload school logo</p>
            <p className="mt-1 max-w-xs text-xs text-setup-muted">
              PNG, JPG, or SVG recommended. Square logo works best. Recommended size:{" "}
              {RECOMMENDED_LOGO_SIZE_PX}×{RECOMMENDED_LOGO_SIZE_PX} px (min. {MIN_LOGO_SIZE_PX}×
              {MIN_LOGO_SIZE_PX}).
            </p>
          </>
        )}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default SchoolLogoUpload;
