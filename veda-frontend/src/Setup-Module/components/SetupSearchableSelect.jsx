import React from "react";
import Select from "react-select";

const buildStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: "0.5rem",
    borderColor: hasError
      ? "#ef4444"
      : state.isFocused
        ? "#2563EB"
        : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
    "&:hover": {
      borderColor: hasError ? "#ef4444" : state.isFocused ? "#2563EB" : "#cbd5e1",
    },
    fontSize: "0.875rem",
    backgroundColor: state.isDisabled ? "#f9fafb" : "#fff",
    cursor: state.isDisabled ? "not-allowed" : "default",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    zIndex: 50,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? "#2563EB"
      : state.isFocused
        ? "#eff6ff"
        : "#fff",
    color: state.isSelected ? "#fff" : "#1E293B",
    cursor: "pointer",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "0.875rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1E293B",
    fontSize: "0.875rem",
  }),
  input: (base) => ({
    ...base,
    color: "#1E293B",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({ display: "none" }),
});

const SetupSearchableSelect = ({
  label,
  name,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  required,
  error,
  hint,
  isLoading,
  isDisabled,
  isClearable = true,
  formatOptionLabel,
  noOptionsMessage,
}) => {
  const fieldId = `setup-select-${name}`;
  const selected =
    options.find((o) => o.value === value) ||
    (value ? { value, label: value } : null);

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-semibold text-setup-heading">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="mt-1.5">
        <Select
          inputId={fieldId}
          name={name}
          options={options}
          value={selected}
          onChange={(opt) => onChange(opt?.value ?? "")}
          placeholder={placeholder}
          isSearchable
          isClearable={isClearable}
          isLoading={isLoading}
          isDisabled={isDisabled}
          menuPlacement="auto"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          styles={buildStyles(Boolean(error))}
          formatOptionLabel={formatOptionLabel}
          noOptionsMessage={() =>
            noOptionsMessage || (isLoading ? "Loading..." : "No options found")
          }
          classNamePrefix="setup-select"
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-setup-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export const formatCountryOption = (option) => {
  if (!option) return null;
  return (
    <span className="flex items-center gap-2">
      <span className="text-base leading-none" aria-hidden>
        {option.flag || ""}
      </span>
      <span>{option.label}</span>
    </span>
  );
};

export default SetupSearchableSelect;
