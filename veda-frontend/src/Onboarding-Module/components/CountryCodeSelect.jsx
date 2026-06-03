import React, { useMemo } from "react";
import Select from "react-select";
import { ONBOARDING_COUNTRY_CODES } from "../constants/adminDetails";

const selectStyles = (hasError, isDisabled) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 48,
    borderRadius: "0.5rem",
    borderColor: hasError
      ? "#fca5a5"
      : state.isFocused
        ? "#3b82f6"
        : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
    backgroundColor: isDisabled
      ? "#f8fafc"
      : hasError
        ? "rgba(254, 242, 242, 0.3)"
        : "#ffffff",
    cursor: isDisabled ? "not-allowed" : "default",
    "&:hover": {
      borderColor: hasError ? "#fca5a5" : state.isFocused ? "#3b82f6" : "#d1d5db",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingLeft: 8,
    paddingRight: 4,
  }),
  singleValue: (base) => ({
    ...base,
    margin: 0,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
    zIndex: 50,
    minWidth: 260,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
        ? "#eff6ff"
        : "#fff",
    color: state.isSelected ? "#fff" : "#0f172a",
    cursor: "pointer",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    paddingLeft: 0,
    paddingRight: 6,
    color: "#64748b",
  }),
});

function DialOptionLabel({ option, compact = false }) {
  if (!option) return null;

  if (compact) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-base leading-none" aria-hidden>
          {option.flag}
        </span>
        <span className="font-medium text-slate-900">{option.label}</span>
      </span>
    );
  }

  return (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-base leading-none" aria-hidden>
          {option.flag}
        </span>
        <span className="truncate">{option.countryName}</span>
      </span>
      <span className="shrink-0 font-medium opacity-80">{option.label}</span>
    </span>
  );
}

export default function CountryCodeSelect({
  value,
  onChange,
  disabled = false,
  hasError = false,
  id = "countryCode",
}) {
  const selected = useMemo(
    () => ONBOARDING_COUNTRY_CODES.find((o) => o.value === value) || null,
    [value]
  );

  return (
    <Select
      inputId={id}
      options={ONBOARDING_COUNTRY_CODES}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? "")}
      isSearchable
      isClearable={false}
      isDisabled={disabled}
      placeholder="+Code"
      menuPlacement="auto"
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      styles={selectStyles(hasError, disabled)}
      classNamePrefix="onboarding-country"
      formatOptionLabel={(option, { context }) => (
        <DialOptionLabel option={option} compact={context === "value"} />
      )}
      aria-label="Country code"
    />
  );
}
