export default function SetupProfileSummary({ form }) {
  const items = [
    { label: "Organization Type", value: (form.organizationType || "—").replace(/_/g, " ") },
    { label: "School Name", value: form.schoolName || "—" },
    { label: "School Code", value: form.schoolCode || "—" },
    { label: "Curriculum Board", value: form.curriculumBoard || "—" },
    { label: "Grade Range", value: form.gradeFrom && form.gradeTo ? `${form.gradeFrom} – ${form.gradeTo}` : "—" },
    { label: "Capacity", value: form.maxStudentsPerSection || "—" },
    { label: "Sections", value: form.sections || "—" },
    { label: "Country", value: form.country || "—" },
    {
      label: "Theme Color",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shrink-0"
            style={{ backgroundColor: form.primaryThemeColor || "#2563EB" }}
          />
          <span className="font-mono text-xs text-gray-800">
            {form.primaryThemeColor || "#2563EB"}
          </span>
        </span>
      ),
    },
    {
      label: "Enabled Modules",
      value: `${(form.enabledModules || []).length} / ${(form.enabledModules || []).length + (form.disabledModules || []).length}`,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Setup Summary</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Completed
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