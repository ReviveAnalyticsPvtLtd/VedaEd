import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CORE_ROLES = [
  { key: "Super Admin", icon: "", locked: true },
  { key: "Principal", icon: "", locked: true },
  { key: "Teacher", icon: "", locked: true },
  { key: "Student", icon: "", locked: true },
  { key: "Parent", icon: "", locked: true },
  { key: "Accountant", icon: "", locked: true },
];

const OPTIONAL_ROLES = [
  { key: "HR Admin", icon: "", recommended: true },
  { key: "Class Coordinator", icon: "" },
  { key: "Transport Manager", icon: "" },
  { key: "Librarian", icon: "" },
  { key: "Health Officer", icon: "" },
  { key: "Admissions Officer", icon: "", recommended: true },
];

const PERMISSION_PREVIEW = [
  { role: "Principal", academic: "Manage", fees: "View", setup: "Limited", portal: "View" },
  { role: "Teacher", academic: "Manage", fees: "No", setup: "No", portal: "Class" },
  { role: "Parent", academic: "View", fees: "Pay", setup: "No", portal: "Own Child" },
  { role: "Accountant", academic: "View", fees: "Manage", setup: "No", portal: "Finance" },
];

const Step7 = () => {
  const navigate = useNavigate();

  const [enabledRoles, setEnabledRoles] = useState([
    "HR Admin",
    "Class Coordinator",
    "Admissions Officer",
  ]);

  const [permissionMode, setPermissionMode] = useState("recommended");

  const [hr, setHr] = useState({
    staffId: "EMP-{YEAR}-{SEQ}",
    teacherId: "TCH-{YEAR}-{SEQ}",
    categories: [
      "Teaching Staff",
      "Administrative Staff",
      "Finance Staff",
    ],
    departmentMode: "recommended",
    approvalMode: "principal",
  });
const [staffConfig, setStaffConfig] = useState({
  departmentSetup: "",
  approvalWorkflow: "",
});
const handleStaffChange = (key, value) => {
  setStaffConfig((prev) => ({
    ...prev,
    [key]: value,
  }));
};
  const toggleRole = (role) => {
    setEnabledRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleCategory = (cat) => {
    setHr((p) => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const recommendationText = () => {
    if (permissionMode === "custom")
      return "Custom mode selected. You can edit detailed permissions before launch, but setup may take longer.";
    if (permissionMode === "copy")
      return "Copy mode selected. VedaSchool will ask for source school/campus permission template.";
    return "Use recommended permissions now. Advanced permission tuning can be done later from Setup Center with audit logs.";
  };

  const warningText = () => {
    if (!enabledRoles.includes("HR Admin"))
      return "HR Admin is disabled. Staff onboarding can still work, but HR controls will be limited.";
    if (enabledRoles.includes("Transport Manager"))
      return "Transport Manager enabled. Transport setup will include route and vehicle ownership permissions.";
    return "HR Admin and Admissions Officer are recommended because staff onboarding and admissions workflow are part of your setup.";
  };

  const handleSubmit = () => {
    const payload = {
      roles: enabledRoles,
      permissionMode,
      hrFoundation: hr,
    };

    localStorage.setItem("step7Data", JSON.stringify(payload));
    navigate("/form/step-8");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="w-full max-w-[1180px]">

        {/* CARD */}
        <div className="bg-white rounded-[32px] shadow-2xl border overflow-hidden">

          {/* PROGRESS */}
          <div className="p-8 border-b bg-gradient-to-b from-white to-slate-50">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-4">
              <span>Step 7 of 13 · Roles & HR Foundation</span>
              <span>Setup Progress: 64%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div className="h-2 w-[64%] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-9 grid grid-cols-[1.85fr_1fr] gap-6">

            {/* LEFT */}
            <div className="space-y-6">

              {/* ROLES */}
              <section className="border rounded-[28px] p-6">
                <h3 className="text-xl font-semibold mb-5">Recommended Roles</h3>

                <div className="grid grid-cols-2 gap-4">
                  {CORE_ROLES.map((r) => (
                    <div key={r.key} className="flex gap-4 p-4 bg-slate-50 border rounded-2xl">
                      <div className="text-2xl">{r.icon}</div>
                      <div>
                        <p className="font-bold">{r.key}</p>
                        <span className="text-xs font-bold text-green-600">Required</span>
                      </div>
                    </div>
                  ))}

                  {OPTIONAL_ROLES.map((r) => {
                    const on = enabledRoles.includes(r.key);
                    return (
                      <div
                        key={r.key}
                        className={`flex gap-4 p-4 border rounded-2xl ${
                          on ? "border-blue-600 bg-blue-50" : ""
                        }`}
                      >
                        <div className="text-2xl">{r.icon}</div>
                        <div>
                          <p className="font-bold">{r.key}</p>
                          {r.recommended && (
                            <span className="text-xs font-bold text-green-600">
                              Recommended
                            </span>
                          )}
                        </div>
                        <label className="ml-auto relative inline-flex cursor-pointer">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleRole(r.key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* PERMISSION MODE */}
              <section className="border rounded-[28px] p-6">
                <h3 className="font-semibold mb-3">Permission Setup Style</h3>
                <div className="flex gap-3 flex-wrap">
                  {["recommended", "custom", "copy"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPermissionMode(m)}
                      className={`px-4 py-2 rounded-full font-bold border ${
                        permissionMode === m
                          ? "bg-blue-600 text-white border-blue-600"
                          : ""
                      }`}
                    >
                      {m === "recommended"
                        ? "Use Recommended Permissions"
                        : m === "custom"
                        ? "Customize Permissions"
                        : "Copy from Another School"}
                    </button>
                  ))}
                </div>
              </section>

              {/* HR FOUNDATION */}
              <section className="border rounded-[28px] p-6 space-y-4">
                <h3 className="font-semibold">Basic HR Foundation</h3>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={hr.staffId}
                    onChange={(e) => setHr({ ...hr, staffId: e.target.value })}
                    className="border rounded-xl px-4 py-2"
                  />
                  <input
                    value={hr.teacherId}
                    onChange={(e) => setHr({ ...hr, teacherId: e.target.value })}
                    className="border rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">Staff Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Teaching Staff",
                      "Administrative Staff",
                      "Finance Staff",
                      "Support Staff",
                      "Transport Staff",
                      "Health Staff",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => toggleCategory(c)}
                        className={`px-4 py-2 rounded-full font-bold border ${
                          hr.categories.includes(c)
                            ? "bg-blue-600 text-white"
                            : ""
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Department Setup */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Department Setup
    </label>
    <select
      value={staffConfig.departmentSetup}
      onChange={(e) =>
        handleStaffChange("departmentSetup", e.target.value)
      }
      className="w-full border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Use Recomended Department</option>
      <option value="single">Manual Department</option>
      <option value="multi"></option>
      <option value="hierarchical">Hierarchical Departments</option>
    </select>
    <p className="text-xs text-gray-400 mt-1">
      Defines how staff are grouped within departments.
    </p>
  </div>

  {/* Approval Workflow */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Approval Workflow
    </label>
    <select
      value={staffConfig.approvalWorkflow}
      onChange={(e) =>
        handleStaffChange("approvalWorkflow", e.target.value)
      }
      className="w-full border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Select approval workflow</option>
      <option value="none">No Approval Required</option>
      <option value="single">Principal Approval</option>
      <option value="multi">Department Head Approval</option>
    </select>
    <p className="text-xs text-gray-400 mt-1">
      Controls how requests like leave, expenses, or changes are approved.
    </p>
  </div>
              </section>

              {/* PERMISSION TABLE */}
              <section className="border rounded-[28px] p-6">
                <h3 className="font-semibold mb-4">Permission Preview</h3>
                <table className="w-full border-separate border-spacing-y-2 text-sm">
                  <thead className="text-slate-500 uppercase text-xs">
                    <tr>
                      <th>Role</th><th>Academic</th><th>Fees</th><th>Setup</th><th>Portal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_PREVIEW.map((r) => (
                      <tr key={r.role}>
                        <td className="font-bold bg-slate-100 p-3 rounded-l-xl">{r.role}</td>
                        <td className="bg-slate-100 p-3">{r.academic}</td>
                        <td className="bg-slate-100 p-3">{r.fees}</td>
                        <td className="bg-slate-100 p-3">{r.setup}</td>
                        <td className="bg-slate-100 p-3 rounded-r-xl">{r.portal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            {/* RIGHT */}
            <aside className="space-y-4 sticky top-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6">
                <h3 className="text-xl font-semibold">Access Summary</h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <strong className="text-2xl block">6</strong>
                    <span className="text-xs">Core Roles</span>
                  </div>
                  <div>
                    <strong className="text-2xl block">{enabledRoles.length}</strong>
                    <span className="text-xs">Optional Roles ON</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-2xl p-4">
                <h4 className="font-semibold mb-2">Dependency Impact</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex justify-between"><span>Teacher Onboarding</span><span className="text-green-600 font-bold">Ready</span></li>
                  <li className="flex justify-between"><span>Subject Mapping</span><span className="text-yellow-600 font-bold">Depends</span></li>
                  <li className="flex justify-between"><span>Timetable</span><span className="text-yellow-600 font-bold">Depends</span></li>
                  <li className="flex justify-between"><span>Approvals</span><span className="text-yellow-600 font-bold">Depends</span></li>
                </ul>
              </div>

              <div className="border rounded-2xl p-4 bg-slate-50">
                <h4 className="font-semibold mb-1">Recommendation</h4>
                <p className="text-sm text-slate-600">{recommendationText()}</p>
              </div>

              <div className="border rounded-2xl p-4 bg-yellow-50 border-yellow-300">
                <h4 className="font-semibold mb-1 text-yellow-800">Smart Check</h4>
                <p className="text-sm text-yellow-700">{warningText()}</p>
              </div>
            </aside>
          </div>

          {/* FOOTER */}
          <div className="flex justify-between p-8 border-t">
            <button
              onClick={() => navigate("/form/step-6")}
              className="px-6 py-3 border rounded-xl font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl text-white font-semibold bg-blue-600"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step7;