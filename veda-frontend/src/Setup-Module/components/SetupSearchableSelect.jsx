import React from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { buildStyles } from "./setupSelectStyles";

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
  isCreatable = false,
  formatOptionLabel,
  noOptionsMessage,
  creatableHint,
}) => {
  const fieldId = `setup-select-${name}`;
  const SelectComponent = isCreatable ? CreatableSelect : Select;
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
        <SelectComponent
          inputId={fieldId}
          name={name}
          options={options}
          value={selected}
          onChange={(opt) => onChange(opt?.value ?? "")}
          onCreateOption={
            isCreatable ? (inputValue) => onChange(String(inputValue || "").trim()) : undefined
          }
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
      {creatableHint && isCreatable ? (
        <p className="mt-1 text-xs text-setup-muted">{creatableHint}</p>
      ) : null}
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
