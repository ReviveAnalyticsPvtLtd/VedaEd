const getPasswordValue = (form, variant) => {
  if (variant === "view") {
    if (form.password) return form.password;
    if (form.userId) return "Password set";
    return "Not set";
  }
  return form.password
    ? "Set by SuperAdmin (changeable after login)"
    : "Required on create";
};

export default function AccessSummary({ form, statusLabel = "Pending", variant = "form" }) {
  const items = [
    { label: "Admin Type", value: form.adminType || "—" },
    { label: "Employee ID", value: form.employeeId || "—" },
    { label: "School", value: form.school || "—" },
    { label: "Campus", value: form.campus || "—" },
    { label: "Scope", value: form.scope || "—" },
    {
      label: "Password",
      value: getPasswordValue(form, variant),
    },
  ];

  const statusColors =
    statusLabel === "Active" || statusLabel === "Accepted"
      ? "bg-green-100 text-green-700"
      : statusLabel === "Inactive"
      ? "bg-gray-100 text-gray-600"
      : statusLabel === "Invitation Sent"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Access Summary</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors}`}>
          {statusLabel}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm"
          >
            <span className="text-gray-500">{item.label}</span>
            <span className="font-medium text-gray-800 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
