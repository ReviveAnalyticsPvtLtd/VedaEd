import React, { useCallback, useRef, useState } from "react";
import {
  MIN_LOGO_SIZE_PX,
  RECOMMENDED_LOGO_SIZE_PX,
} from "../constants/schoolProfile";
import { optimizeLogoImage } from "../utils/optimizeLogoImage";
import { resolveSchoolLogoUrl } from "../utils/schoolLogoUrl";
import { validateLogoFile } from "../utils/validateLogoFile";
import LogoPreview from "./LogoPreview";

const SchoolLogoUpload = ({
  logoPath,
  previewUrl,
  frameShape,
  onFileSelect,
  onRemove,
  uploading,
  error,
  warning,
}) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const displayUrl = previewUrl || resolveSchoolLogoUrl(logoPath);
  const hasLogo = Boolean(displayUrl);

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      const validation = await validateLogoFile(file);
      if (validation.error) {
        onFileSelect(null, validation.error);
        return;
      }
      const optimized = await optimizeLogoImage(file);
      onFileSelect(optimized, null, validation.warning);
    },
    [onFileSelect]
  );

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const stopPropagation = (e) => e.stopPropagation();

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
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
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
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {hasLogo ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-4" onClick={stopPropagation}>
            <LogoPreview
              src={displayUrl}
              frameShape={frameShape}
              size="lg"
              backgroundColor="#ffffff"
            />
            <p className="text-sm font-medium text-setup-heading">
              {uploading ? "Uploading..." : "Logo preview"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-setup-border bg-white px-3 py-1.5 text-xs font-semibold text-setup-heading shadow-sm transition hover:border-setup-primary hover:text-setup-primary disabled:opacity-50"
              >
                Change logo
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={onRemove}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-setup-muted">Or drag and drop a new file here</p>
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
              PNG, JPG, or SVG. Square, circle, or rectangle logos supported. Recommended size:{" "}
              {RECOMMENDED_LOGO_SIZE_PX}×{RECOMMENDED_LOGO_SIZE_PX} px (min. {MIN_LOGO_SIZE_PX}×
              {MIN_LOGO_SIZE_PX}).
            </p>
          </>
        )}
      </div>
      {warning && !error ? (
        <p className="mt-2 text-xs text-amber-700">{warning}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default SchoolLogoUpload;
