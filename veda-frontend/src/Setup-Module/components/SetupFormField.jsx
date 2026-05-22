import React from "react";

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-setup-border bg-white px-3.5 py-2.5 text-sm text-setup-heading placeholder:text-gray-400 transition focus:border-setup-primary focus:outline-none focus:ring-2 focus:ring-blue-100";

const SetupFormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
  as = "input",
  options = [],
  error,
  rows = 3,
}) => {
  const fieldId = `setup-field-${name}`;

  return (
    <div className={as === "textarea" ? "sm:col-span-2" : ""}>
      <label htmlFor={fieldId} className="text-sm font-semibold text-setup-heading">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {as === "textarea" ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClassName} resize-y min-h-[88px]`}
        />
      ) : as === "select" ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          className={`${inputClassName} cursor-pointer`}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
      {hint ? <p className="mt-1 text-xs text-setup-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default SetupFormField;
