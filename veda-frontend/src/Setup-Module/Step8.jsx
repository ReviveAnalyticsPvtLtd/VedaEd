import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ================= CONSTANTS ================= */

const MODES = [
  {
    key: "Daily",
    icon: "📅",
    title: "Daily Attendance",
    desc: "Mark attendance once per day. Best for primary classes.",
    reco: "Daily attendance is ideal for lower grades.",
  },
  {
    key: "Period-wise",
    icon: "🕒",
    title: "Period-wise Attendance",
    desc: "Attendance per subject period.",
    reco: "Ensure timetable & subject teachers are mapped.",
  },
  {
    key: "Hybrid",
    icon: "🔁",
    title: "Hybrid Attendance",
    desc: "Daily for lower grades, period-wise for higher grades.",
    reco: "Recommended for K–12 schools.",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Medical Leave",
  "Emergency Leave",
  "Half Day",
];

/* ================= COMMON UI STYLES ================= */

const inputClass =
  "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const selectClass =
  "w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const toggleWrap =
  "w-12 h-6 rounded-full cursor-pointer flex items-center transition";

const toggleDot =
  "w-5 h-5 bg-white rounded-full shadow transition";

/* ================= COMPONENT ================= */

const Step8AttendanceRules = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("Hybrid");

  const [workingDays, setWorkingDays] = useState([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);

  const [timings, setTimings] = useState({
    start: "08:00",
    end: "14:30",
    halfDay: "11:30",
    close: "09:30",
  });

  const [rules, setRules] = useState({
    late: "08:15",
    absent: "10:00",
    minPercent: 75,
    grace: 10,
  });

  const [permissions, setPermissions] = useState({
    classTeacher: true,
    subjectTeacher: true,
    adminOverride: true,
    biometric: false,
  });

  const [leaveRules, setLeaveRules] = useState({
    studentApproval: "Class Teacher Approval",
    staffApproval: "Principal Approval",
    types: ["Sick Leave", "Casual Leave", "Medical Leave"],
  });

  const [parentNotify, setParentNotify] = useState({
    absent: true,
    late: true,
    early: true,
    low: true,
  });

  /* ================= HELPERS ================= */

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const toggleLeaveType = (type) => {
    setLeaveRules((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const togglePermission = (key) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleNotify = (key) => {
    setParentNotify((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    const payload = {
      mode,
      workingDays,
      timings,
      rules,
      permissions,
      leaveRules,
      parentNotify,
    };

    localStorage.setItem("attendanceRules", JSON.stringify(payload));

    try {
      await axios.post("/api/admin/settings/attendance-rules", payload);
      navigate("/form/step-9");
    } catch (err) {
      alert("Failed to save attendance rules");
    }
  };

  const recommendation = MODES.find((m) => m.key === mode)?.reco;

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="w-full max-w-[1180px] mb-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">VedaSchool</h1>
            <p className="text-xs text-slate-500">School Setup Wizard</p>
          </div>
          <button className="border px-4 py-2 rounded-full font-semibold">
            Save & Exit
          </button>
        </div>

        <div className="bg-white rounded-[32px] border shadow-xl overflow-hidden mb-6">

          <div className="p-7 border-b bg-slate-50">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-3">
              <span>Step 8 of 13· Attendance Rules</span>
              <span>72% Completed</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div className="h-2 w-[72%] bg-blue-600 rounded-full" />
            </div>
          </div>

          <div className="p-9 grid grid-cols-[1.9fr_1fr] gap-6">

            {/* ================= LEFT ================= */}
            <div className="space-y-6">

              {/* Attendance Mode */}
              <div className="border rounded-[28px] p-6">
                <h3 className="font-semibold mb-4">Attendance Mode</h3>
                <div className="grid grid-cols-3 gap-4">
                  {MODES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`border rounded-xl p-4 text-left ${
                        mode === m.key
                          ? "bg-blue-50 border-blue-600"
                          : ""
                      }`}
                    >
                      <div className="text-xl mb-2">{m.icon}</div>
                      <div className="font-semibold">{m.title}</div>
                      <p className="text-sm text-slate-500">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Working Calendar */}
              <div className="border rounded-[28px] p-6">
                <h3 className="font-semibold mb-4">Working Calendar</h3>

                <div className="flex gap-2 flex-wrap mb-4">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`px-4 py-2 rounded-full border font-bold ${
                        workingDays.includes(d)
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

               <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm font-medium text-slate-700">
        School Start Time
      </label>
      <input
        type="time"
        className={inputClass}
        value={timings.start}
        onChange={(e) =>
          setTimings({ ...timings, start: e.target.value })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        School End Time
      </label>
      <input
        type="time"
        className={inputClass}
        value={timings.end}
        onChange={(e) =>
          setTimings({ ...timings, end: e.target.value })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        Half-day Checkout Time
      </label>
      <input
        type="time"
        className={inputClass}
        value={timings.halfDay}
        onChange={(e) =>
          setTimings({ ...timings, halfDay: e.target.value })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        Attendance Closing Time
      </label>
      <input
        type="time"
        className={inputClass}
        value={timings.close}
        onChange={(e) =>
          setTimings({ ...timings, close: e.target.value })
        }
      />
      <p className="text-xs text-slate-500 mt-1">
        After this, attendance edits require admin approval.
      </p>
    </div>
  </div>
              </div>

             {/* Late, Half-day & Absent Rules */}
<div className="border rounded-[28px] p-6">
  <h3 className="font-semibold mb-1">
    Late, Half-day & Absent Rules
  </h3>
  <p className="text-sm text-slate-500 mb-4">
    Set thresholds used by reports, parent alerts, and attendance analytics.
  </p>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm font-medium text-slate-700">
        Late Arrival After
      </label>
      <input
        type="time"
        className={inputClass}
        value={rules.late}
        onChange={(e) =>
          setRules({ ...rules, late: e.target.value })
        }
      />
      <p className="text-xs text-slate-500 mt-1">
        Students arriving after this time are marked late.
      </p>
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        Auto Absent After
      </label>
      <input
        type="time"
        className={inputClass}
        value={rules.absent}
        onChange={(e) =>
          setRules({ ...rules, absent: e.target.value })
        }
      />
      <p className="text-xs text-slate-500 mt-1">
        If not marked present by this time, mark absent automatically.
      </p>
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        Minimum Attendance %
      </label>
      <input
        type="number"
        className={inputClass}
        value={rules.minPercent}
        onChange={(e) =>
          setRules({ ...rules, minPercent: e.target.value })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium text-slate-700">
        Grace Minutes
      </label>
      <input
        type="number"
        className={inputClass}
        value={rules.grace}
        onChange={(e) =>
          setRules({ ...rules, grace: e.target.value })
        }
      />
    </div>
  </div>
</div>

              {/* Who Can Mark Attendance */}
              <div className="border rounded-[28px] p-6 space-y-3">
                <h3 className="font-semibold">Who Can Mark Attendance?</h3>

                {[
                  ["classTeacher","Class Teacher"],
                  ["subjectTeacher","Subject Teacher"],
                  ["adminOverride","Admin Override"],
                ].map(([key,label])=>(
                  <div key={key} className="flex justify-between items-center border rounded-xl p-4">
                    <span>{label}</span>
                    <div
                      onClick={()=>togglePermission(key)}
                      className={`${toggleWrap} ${permissions[key] ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                      <div className={`${toggleDot} ${permissions[key] ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Leave Rules */}
              <div className="border rounded-[28px] p-6">
                <h3 className="font-semibold mb-4">Leave & Approval Rules</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select className={selectClass} value={leaveRules.studentApproval} onChange={(e)=>setLeaveRules({...leaveRules,studentApproval:e.target.value})}>
                    <option>Class Teacher Approval</option>
                    <option>Principal Approval</option>
                  </select>

                  <select className={selectClass} value={leaveRules.staffApproval} onChange={(e)=>setLeaveRules({...leaveRules,staffApproval:e.target.value})}>
                    <option>Principal Approval</option>
                    <option>Admin Approval</option>
                  </select>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {LEAVE_TYPES.map((t)=>(
                    <button
                      key={t}
                      onClick={()=>toggleLeaveType(t)}
                      className={`px-4 py-2 rounded-full border ${
                        leaveRules.types.includes(t)
                          ? "bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parent Notifications */}
              <div className="border rounded-[28px] p-6 space-y-3">
                <h3 className="font-semibold">Parent Notification Rules</h3>

                {[
                  ["absent","Absent Alert"],
                  ["late","Late Arrival Alert"],
                  ["early","Early Checkout Alert"],
                  ["low","Low Attendance Warning"],
                ].map(([k,l])=>(
                  <div key={k} className="flex justify-between items-center border rounded-xl p-4">
                    <span>{l}</span>
                    <div
                      onClick={()=>toggleNotify(k)}
                      className={`${toggleWrap} ${parentNotify[k] ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                      <div className={`${toggleDot} ${parentNotify[k] ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </div>
                ))}
              </div>

            

            </div>

            {/* ================= RIGHT ================= */}
            <aside className="space-y-5 sticky top-6">
              <div className="bg-blue-700 text-white rounded-2xl p-6">
                <h4 className="font-semibold mb-2">Attendance Summary</h4>
                <p>Mode: {mode}</p>
                <p>Timing: {timings.start} – {timings.end}</p>
                <p>Late After: {rules.late}</p>
              </div>
<div className="border rounded-2xl p-4">
  <h4 className="font-semibold mb-1">Dependency Impact</h4>
  <p className="text-xs text-slate-500 mb-3">
    Attendance rules feed these areas.
  </p>

  <ul className="space-y-2 text-sm">
    <li className="flex justify-between">
      <span>Parent Portal</span>
      <span className="text-slate-500">Feeds</span>
    </li>
    <li className="flex justify-between">
      <span>Report Cards</span>
      <span className="text-slate-500">Feeds</span>
    </li>
    <li className="flex justify-between">
      <span>Teacher Dashboard</span>
      <span className="text-slate-500">Feeds</span>
    </li>
    <li className="flex justify-between">
      <span>Low Attendance Alerts</span>
      <span className="text-slate-500">Feeds</span>
    </li>
  </ul>
</div>
              <div className="border rounded-2xl p-4">
                <h4 className="font-semibold">Recommendation</h4>
                <p className="text-sm text-slate-600">{recommendation}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
                <h4 className="font-semibold text-yellow-800">Smart Check</h4>
                <p className="text-sm text-yellow-700">
                  All attendance edits after closing time should be logged.
                </p>
              </div>
            </aside>

          </div>
            <div className="flex justify-between  pt-6 border-t mb-6 p-4 m-4">
                <button onClick={()=>navigate("/form/step-7")} className="border px-6 py-3 rounded-xl">
                  Back
                </button>
                <button onClick={handleSave,()=>navigate("/form/step-9")}  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">
                  Save & Continue
                </button>
              </div>
        </div>
      </div>
    </div>
  );
};

export default Step8AttendanceRules;