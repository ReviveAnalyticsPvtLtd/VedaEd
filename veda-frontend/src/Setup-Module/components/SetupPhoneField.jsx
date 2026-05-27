import React, { useMemo } from "react";
import Select from "react-select";
import { buildStyles } from "./setupSelectStyles";

const inputClassName =
  "w-full rounded-lg border border-setup-border bg-white px-3.5 py-2.5 text-sm text-setup-heading placeholder:text-gray-400 transition focus:border-setup-primary focus:outline-none focus:ring-2 focus:ring-blue-100";

const SetupPhoneField = ({
  label,
  dialCode,
  nationalNumber,
  onDialChange,
  onNationalChange,
  dialOptions = [],
  maxLength = 15,
  placeholder = "Phone number",
  required,
  error,
  hint,
  isDisabled,
}) => {
  const fieldId = "setup-phone-national";
  const selectedDial = useMemo(
    () => dialOptions.find((o) => o.value === dialCode) || null,
    [dialOptions, dialCode]
  );

  const formatDialLabel = (option) => {
    if (!option) return null;
    return (
      <span className="flex items-center gap-1.5">
        {option.flag ? (
          <span className="text-base leading-none" aria-hidden>
            {option.flag}
          </span>
        ) : null}
        <span>{option.label}</span>
      </span>
    );
  };

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-semibold text-setup-heading">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="mt-1.5 flex gap-2">
        <div className="w-[120px] shrink-0 sm:w-[130px]">
          <Select
            inputId="setup-phone-dial"
            options={dialOptions}
            value={selectedDial}
            onChange={(opt) => onDialChange(opt?.value ?? "")}
            placeholder="+Code"
            isSearchable
            isClearable={false}
            isDisabled={isDisabled}
            menuPlacement="auto"
            menuPortalTarget={
              typeof document !== "undefined" ? document.body : null
            }
            styles={buildStyles(Boolean(error))}
            formatOptionLabel={formatDialLabel}
            classNamePrefix="setup-select"
          />
        </div>
        <input
          id={fieldId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={nationalNumber}
          onChange={(e) => onNationalChange(e.target.value)}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isDisabled}
          className={`${inputClassName} flex-1 min-w-0 ${isDisabled ? "cursor-not-allowed bg-gray-50" : ""}`}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-setup-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default SetupPhoneField;
