import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const REQUIRED_MODULES = [
  {
    key: "SIS",
    title: "Student Information System",
    desc: "Centralized student records, profiles, and enrollment data.",
  },
  {
    key: "Academics",
    title: "Academics",
    desc: "Classes, subjects, curriculum structure, and academic setup.",
  },
  {
    key: "Attendance",
    title: "Attendance",
    desc: "Daily attendance tracking for students and staff.",
  },
  {
    key: "Timetable",
    title: "Timetable",
    desc: "Automated class and teacher scheduling.",
  },
  {
    key: "Exams",
    title: "Exams & Gradebook",
    desc: "Exam planning, marks entry, and report cards.",
  },
  {
    key: "Fees",
    title: "Fees",
    desc: "Fee structure, invoices, payments, and dues.",
  },
  {
    key: "Communication",
    title: "Communication",
    desc: "SMS, email, and app notifications for parents and staff.",
  },
  {
    key: "Reports",
    title: "Dashboards & Reports",
    desc: "Analytics, insights, and performance reports.",
  },
];

const OPTIONAL_MODULES = [
  {
    key: "Transport",
    title: "Transport",
    desc: "Bus routes, drivers, GPS tracking, and transport fees.",
    recommended: true,
  },
  {
    key: "Library",
    title: "Library",
    desc: "Books, issue/return tracking, and fines management.",
  },
  {
    key: "Health",
    title: "Health",
    desc: "Medical records, health logs, and emergency details.",
    recommended: true,
  },
  {
    key: "Hostel",
    title: "Hostel",
    desc: "Room allocation, hostel attendance, and fees.",
  },
  {
    key: "LMS",
    title: "Learning Management System",
    desc: "Online classes, assignments, and digital content.",
  },
  {
    key: "Inventory",
    title: "Inventory",
    desc: "Assets, consumables, and stock tracking.",
  },
  {
    key: "HR",
    title: "HR",
    desc: "Staff records, roles, leaves, and performance.",
    recommended: true,
  },
  {
    key: "Payroll",
    title: "Payroll",
    desc: "Salary processing, payslips, and deductions.",
    dependsOn: "HR",
  },
];

const Toggle = ({ checked, disabled }) => (
  <div
    className={`w-11 h-6 rounded-full p-1 transition 
      ${checked ? "bg-indigo-600" : "bg-gray-300"} 
      ${disabled ? "opacity-50" : ""}`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow transform transition
        ${checked ? "translate-x-5" : ""}`}
    />
  </div>
);

const Step5 = () => {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState([]);

  const toggleModule = (key) => {
    if (key === "Payroll" && !enabled.includes("HR")) return;

    if (key === "HR" && enabled.includes("Payroll")) {
      setEnabled((p) => p.filter((m) => m !== "Payroll"));
    }

    setEnabled((prev) =>
      prev.includes(key)
        ? prev.filter((m) => m !== key)
        : [...prev, key]
    );
  };

  const handleSubmit = () => {
    const payload = {
      requiredModules: REQUIRED_MODULES.map((m) => m.key),
      optionalModules: enabled,
    };

    localStorage.setItem("step5Data", JSON.stringify(payload));

    // future API
    // await axios.post("/api/setup/modules", payload);

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">⚙️</div>
          <h2 className="text-lg font-semibold text-indigo-600">VedaEdu</h2>
        </div>

        <h1 className="text-3xl font-bold mb-1">Select Modules</h1>
        <p className="text-gray-500 mb-6">
          Required modules are enabled by default. Optional modules can be
          changed anytime.
        </p>

        {/* Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span>STEP 5 OF 13</span>
          <span>52% COMPLETE</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded mb-8">
          <div className="bg-indigo-600 h-2 rounded" style={{ width: "52%" }} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="col-span-2 space-y-6">
            {/* Required */}
            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-4">Required Modules</h3>

              <div className="grid grid-cols-2 gap-4">
                {REQUIRED_MODULES.map((m) => (
                  <div
                    key={m.key}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">{m.title}</p>
                      <Toggle checked disabled />
                    </div>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional */}
            <div className="border rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-4">Optional Modules</h3>

              <div className="grid grid-cols-2 gap-4">
                {OPTIONAL_MODULES.map((m) => {
                  const checked = enabled.includes(m.key);
                  const disabled =
                    m.key === "Payroll" && !enabled.includes("HR");

                  return (
                    <div
                      key={m.key}
                      onClick={() => !disabled && toggleModule(m.key)}
                      className={`border rounded-lg p-4 cursor-pointer
                        ${checked ? "border-indigo-600 bg-indigo-50" : ""}
                        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="font-medium">{m.title}</p>
                          {m.recommended && (
                            <span className="text-xs text-green-600">
                              Recommended
                            </span>
                          )}
                        </div>
                        <Toggle checked={checked} />
                      </div>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                      {m.dependsOn && (
                        <p className="text-xs text-red-500 mt-1">
                          Requires {m.dependsOn}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-4">Module Summary</h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {REQUIRED_MODULES.length}
                  </p>
                  <p className="text-xs">Required Enabled</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{enabled.length}</p>
                  <p className="text-xs">Optional Enabled</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Payroll depends on HR. HR must be enabled to activate Payroll.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate("/form/step-4")}
            className="px-6 py-3 border rounded-lg font-semibold"
          >
            Back
          </button>

          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-lg text-white font-semibold
            bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step5;