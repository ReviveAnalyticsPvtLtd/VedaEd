export default function PermissionMatrix({
  permissions = [],
  onChange,
  readOnly = false,
  title = "Permission Review",
}) {
  const rows = permissions.length ? permissions : [];

  const toggle = (index, field) => {
    if (readOnly || !onChange) return;
    const next = rows.map((row, i) =>
      i === index ? { ...row, [field]: !row[field] } : row
    );
    onChange(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-indigo-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th className="px-5 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium text-center w-20">View</th>
              <th className="px-4 py-3 font-medium text-center w-20">Create</th>
              <th className="px-4 py-3 font-medium text-center w-20">Edit</th>
              <th className="px-4 py-3 font-medium text-center w-20">Delete</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.module} className="border-t border-gray-100">
                <td className="px-5 py-3 font-medium text-gray-800">{row.module}</td>
                {["view", "create", "edit", "delete"].map((field) => (
                  <td key={field} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!row[field]}
                      disabled={readOnly}
                      onChange={() => toggle(index, field)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600
                        focus:ring-indigo-500 cursor-pointer disabled:cursor-default"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
