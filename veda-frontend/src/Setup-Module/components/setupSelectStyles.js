export const buildStyles = (hasError) => ({
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
