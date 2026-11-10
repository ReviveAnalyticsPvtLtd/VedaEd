//import React, { useState, useEffect } from "react";
//import { FiPlus, FiUsers, FiCalendar, FiBell, FiAward } from "react-icons/fi";
//import { getAllActivities, createActivity, updateActivity } from "../../services/activityAPI"; // Fixed import path
//
//function MultiSelectDropdown({ options, selected, setSelected, placeholder }) {
//  const [open, setOpen] = useState(false);
//
//  const toggleOption = (value) => {
//    if (selected.includes(value)) {
//      setSelected(selected.filter((s) => s !== value));
//    } else {
//      setSelected([...selected, value]);
//    }
//  };
//
//  return (
//    <div className="relative w-full">
//      <div
//        className="border p-2 rounded w-full flex items-center justify-between cursor-pointer"
//        onClick={() => setOpen(!open)}
//      >
//        <div className="flex flex-wrap gap-1">
//          {selected.length > 0
//            ? selected.map((s) => (
//              <span
//                key={s}
//                className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
//              >
//                {s}
//              </span>
//            ))
//            : <span className="text-gray-400 text-xs">{placeholder}</span>}
//        </div>
//        <span className="text-gray-500">{open ? "▲" : "▼"}</span>
//      </div>
//
//      {open && (
//        <div className="absolute z-10 w-full bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto">
//          {options.map((opt) => (
//            <label
//              key={opt}
//              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
//            >
//              <input
//                type="checkbox"
//                checked={selected.includes(opt)}
//                onChange={() => toggleOption(opt)}
//                className="mr-2"
//              />
//              {opt}
//            </label>
//          ))}
//        </div>
//      )}
//    </div>
//  );
//}
//
//export default function ActivityReport() {
//  const [showModal, setShowModal] = useState(false);
//  const [isEditMode, setIsEditMode] = useState(false);
//  const [showWinnerModal, setShowWinnerModal] = useState(false);
//  const [selectedActivity, setSelectedActivity] = useState(null);
//
//  const [activities, setActivities] = useState([]);
//
//  const classes = ["6", "7", "8", "9", "10"];
//  const sections = ["A", "B", "C"];
//  const teachers = ["Mr. Sharma", "Ms. Neha", "Mr. Raj", "Ms. Pooja"];
//
//  const [form, setForm] = useState({
//    winner: {
//      First: { name: "", class: "", section: "" },
//      Second: { name: "", class: "", section: "" },
//      Third: { name: "", class: "", section: "" }
//    },
//    type: "Sports",
//    title: "",
//    class: [],
//    section: "All",
//    date: "",
//    time: "",
//    venue: "",
//    participants: [],
//    teachers: [],
//    notify: { admin: true, classTeacher: true, parents: false },
//    outcome: "",
//    status: "Upcoming",
//  });
//
//  useEffect(() => {
//    fetchActivities();
//  }, []);
//
//  const fetchActivities = async () => {
//    try {
//      const data = await getAllActivities();
//      setActivities(data);
//    } catch (error) {
//      console.error("Failed to fetch activities", error);
//    }
//  };
//
//  const ACTIVITY_THEME = {
//    Sports: {
//      accent: "green",
//      bg: "bg-green-50",
//      border: "border-green-200",
//      text: "text-green-700",
//      badge: "bg-green-100 text-green-700",
//      winnerBg: "bg-green-100",
//    },
//    Academic: {
//      accent: "blue",
//      bg: "bg-blue-50",
//      border: "border-blue-200",
//      text: "text-blue-700",
//      badge: "bg-blue-100 text-blue-700",
//      winnerBg: "bg-blue-100",
//    },
//    Cultural: {
//      accent: "purple",
//      bg: "bg-purple-50",
//      border: "border-purple-200",
//      text: "text-purple-700",
//      badge: "bg-purple-100 text-purple-700",
//      winnerBg: "bg-purple-100",
//    },
//    Competition: {
//      accent: "orange",
//      bg: "bg-orange-50",
//      border: "border-orange-200",
//      text: "text-orange-700",
//      badge: "bg-orange-100 text-orange-700",
//      winnerBg: "bg-orange-100",
//    },
//  };
//
//  const getStatus = (activity) =>
//    activity.winner?.First?.name ? "Completed" : "Upcoming";
//
//  const handleSubmit = async () => {
//    const activityWithStatus = { ...form, status: getStatus(form) };
//
//    try {
//      if (isEditMode) {
//        const updated = await updateActivity(form._id, activityWithStatus);
//        setActivities(
//          activities.map((a) =>
//            a._id === form._id ? updated : a
//          )
//        );
//      } else {
//        const created = await createActivity(activityWithStatus);
//        setActivities([created, ...activities]);
//      }
//      setShowModal(false);
//      setIsEditMode(false);
//      setForm({
//        winner: {
//          First: { name: "", class: "", section: "" },
//          Second: { name: "", class: "", section: "" },
//          Third: { name: "", class: "", section: "" }
//        },
//        title: "",
//        class: [],
//        section: "All",
//        date: "",
//        time: "",
//        venue: "",
//        participants: [],
//        teachers: [],
//        notify: { admin: true, classTeacher: true, parents: false },
//        outcome: "",
//        status: "Upcoming",
//      });
//    } catch (error) {
//      console.error("Failed to save activity", error);
//    }
//  };
//
//  const handleSaveWinner = async () => {
//    const updatedStatus = getStatus(selectedActivity);
//    const updatedActivityData = { ...selectedActivity, status: updatedStatus };
//
//    try {
//      const updated = await updateActivity(selectedActivity._id, updatedActivityData);
//      setActivities(
//        activities.map((a) =>
//          a._id === selectedActivity._id ? updated : a
//        )
//      );
//      setShowWinnerModal(false);
//    } catch (error) {
//      console.error("Failed to update winner", error);
//    }
//  };
//
//  const getClassSectionDisplay = (a) => {
//    if (Array.isArray(a.class)) {
//      return a.class
//        .map((cls) =>
//          a.section === "All"
//            ? sections.map((s) => `${cls}${s}`).join(", ")
//            : `${cls}${a.section}`
//        )
//        .join(", ");
//    }
//    return a.section === "All"
//      ? sections.map((s) => `${a.class}${s}`).join(", ")
//      : `${a.class}${a.section}`;
//  };
//
//  return (
//    <div className="p-0 m-0 min-h-screen">
//
//
//      {/* Header */}
//      <div className="flex justify-between items-center mb-3">
//        <h2 className="text-2xl font-bold flex items-center gap-2">
//          Activity Center
//        </h2>
//        <div className="flex gap-3">
//
//          <button
//            onClick={() => setShowModal(true)}
//            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
//          >
//            <FiPlus /> Add Activity
//          </button>
//        </div>
//      </div>
//
//      {/* Summary */}
//      <div className="grid grid-cols-4 gap-4 mb-6">
//        <div className="bg-white border rounded-lg p-4">
//          <p className="text-xs text-gray-500">Total Activities</p>
//          <p className="text-xl font-semibold">{activities.length}</p>
//        </div>
//        <div className="bg-white border rounded-lg p-4">
//          <p className="text-xs text-gray-500">Upcoming</p>
//          <p className="text-xl font-semibold">
//            {activities.filter((a) => a.status === "Upcoming").length}
//          </p>
//        </div>
//        <div className="bg-white border rounded-lg p-4">
//          <p className="text-xs text-gray-500">Completed</p>
//          <p className="text-xl font-semibold">
//            {activities.filter((a) => a.status === "Completed").length}
//          </p>
//        </div>
//        <div className="bg-white border rounded-lg p-4">
//          <p className="text-xs text-gray-500">Winner Declared</p>
//          <p className="text-xl font-semibold">
//            {activities.filter((a) => a.winner?.First?.name).length}
//          </p>
//        </div>
//      </div>
//
//      <div className="grid grid-cols-3 gap-6">
//        {activities.map((a) => {
//          const theme = ACTIVITY_THEME[a.type || "Sports"];
//
//          return (
//            <div
//              key={a._id}
//              className={`relative rounded-2xl p-5 border ${theme.border} 
//             bg-white hover:shadow-xl transition-all hover:-translate-y-1`}
//            >
//
//              <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-${theme.accent}-500`} />
//
//
//              <span className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full ${theme.badge}`}>
//                {a.status}
//              </span>
//
//
//              <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>
//                {a.title}
//              </h3>
//
//              {/* Type */}
//              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
//                {a.type}
//              </p>
//
//              {/* Info */}
//              <div className="text-sm text-gray-600 space-y-1 mb-4">
//                <p>🎓 {getClassSectionDisplay(a)}</p>
//                <p>📅 {a.date} {a.time}</p>
//                <p>📍 {a.venue}</p>
//              </div>
//
//              {/* Participants */}
//              <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm">
//                <p className="font-medium mb-1">Participants</p>
//                {a.participants.length > 0
//                  ? a.participants.join(", ")
//                  : getClassSectionDisplay(a)}
//              </div>
//
//              {/* Winner */}
//              {a.winner?.First?.name ? (
//                <div className={`p-3 rounded-lg ${theme.winnerBg}`}>
//                  <p className={`font-semibold ${theme.text} mb-1`}>🏆 Winners</p>
//                  <p>1️⃣ {a.winner.First.name}</p>
//                  {a.winner.Second?.name && <p>2️⃣ {a.winner.Second.name}</p>}
//                  {a.winner.Third?.name && <p>3️⃣ {a.winner.Third.name}</p>}
//                </div>
//              ) : (
//                <button
//                  onClick={() => {
//                    setSelectedActivity(a);
//                    setShowWinnerModal(true);
//                  }}
//                  className={`text-sm underline ${theme.text}`}
//                >
//                  Update Winner
//                </button>
//              )}
//            </div>
//          );
//        })}
//      </div>
//
//
//      {/* Add/Edit Modal */}
//      {showModal && (
//        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
//          <div className="bg-white w-[720px] rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
//            <h2 className="text-lg font-semibold mb-2">
//              {isEditMode ? "Edit Activity" : "Setup New Activity"}
//            </h2>
//
//            {/* Title */}
//            <div>
//              <label className="text-sm font-medium mb-1 block">Activity Title</label>
//              <input
//                className="w-full border p-2 rounded"
//                value={form.title}
//                onChange={(e) => setForm({ ...form, title: e.target.value })}
//              />
//            </div>
//            <div>
//              <label className="text-sm font-medium mb-1 block">Activity Type</label>
//              <select
//                value={form.type}
//                onChange={(e) => setForm({ ...form, type: e.target.value })}
//                className="border p-2 rounded w-full"
//              >
//                <option>Sports</option>
//                <option>Academic</option>
//                <option>Cultural</option>
//                <option>Competition</option>
//              </select>
//            </div>
//
//            {/* Class / Section Multi-select */}
//            <div className="grid grid-cols-2 gap-4">
//              <div>
//                <label className="text-sm font-medium mb-1 block">Class</label>
//                <MultiSelectDropdown
//                  options={classes}
//                  selected={form.class}
//                  setSelected={(val) => setForm({ ...form, class: val })}
//                  placeholder="Select Classes"
//                />
//              </div>
//              <div>
//                <label className="text-sm font-medium mb-1 block">Section</label>
//                <select
//                  className="border p-2 rounded w-full"
//                  value={form.section}
//                  onChange={(e) => setForm({ ...form, section: e.target.value })}
//                >
//                  <option value="All">All Sections</option>
//                  {sections.map((s) => (
//                    <option key={s} value={s}>{s}</option>
//                  ))}
//                </select>
//              </div>
//            </div>
//
//            {/* Date / Time / Venue */}
//            <div className="grid grid-cols-3 gap-4">
//              <div>
//                <label className="text-sm font-medium mb-1 block">Date</label>
//                <input
//                  type="date"
//                  className="border p-2 rounded w-full"
//                  value={form.date}
//                  onChange={(e) => setForm({ ...form, date: e.target.value })}
//                />
//              </div>
//              <div>
//                <label className="text-sm font-medium mb-1 block">Time</label>
//                <input
//                  type="time"
//                  className="border p-2 rounded w-full"
//                  value={form.time}
//                  onChange={(e) => setForm({ ...form, time: e.target.value })}
//                />
//              </div>
//              <div>
//                <label className="text-sm font-medium mb-1 block">Venue</label>
//                <input
//                  className="border p-2 rounded w-full"
//                  value={form.venue}
//                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
//                />
//              </div>
//            </div>
//
//            {/* Participants */}
//            <div>
//              <label className="text-sm font-medium mb-1 flex items-center gap-2">
//                <FiUsers /> Participants
//              </label>
//              {form.class.length > 0 ? (
//                <div className="text-sm text-gray-600">
//                  {form.class.map((cls) => (
//                    <p key={cls}>
//                      Class {cls} - {form.section === "All" ? sections.join(", ") : form.section}
//                    </p>
//                  ))}
//                </div>
//              ) : (
//                <span className="text-sm text-gray-400">Select class first</span>
//              )}
//            </div>
//
//            {/* Teachers Multi-select */}
//            <div>
//              <label className="text-sm font-medium mb-1 block">Teachers on Duty</label>
//              <MultiSelectDropdown
//                options={teachers}
//                selected={form.teachers}
//                setSelected={(val) => setForm({ ...form, teachers: val })}
//                placeholder="Select Teachers"
//              />
//            </div>
//
//            {/* Notifications */}
//            <div>
//              <p className="font-medium mb-1 flex items-center gap-2"><FiBell /> Send Notifications</p>
//              {["admin", "classTeacher", "parents"].map((n) => (
//                <label key={n} className="mr-4 text-sm capitalize">
//                  <input
//                    type="checkbox"
//                    checked={form.notify[n]}
//                    onChange={() => setForm({ ...form, notify: { ...form.notify, [n]: !form.notify[n] } })}
//                    className="mr-1"
//                  />
//                  {n}
//                </label>
//              ))}
//            </div>
//
//            {/* Outcome */}
//            <div>
//              <p className="font-medium mb-1 flex items-center gap-2"><FiAward /> Outcome / Awards</p>
//              <select
//                className="border p-2 rounded w-full"
//                value={form.outcome}
//                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
//              >
//                <option>Select Outcome</option>
//                <option>Participation Certificate</option>
//                <option>Medals</option>
//                <option>Merit Certificate</option>
//              </select>
//            </div>
//
//            {/* Actions */}
//            <div className="flex justify-end gap-3 pt-4">
//              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
//              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Save Activity</button>
//            </div>
//          </div>
//        </div>
//      )}
//
//      {/* Winner Modal */}
//      {showWinnerModal && selectedActivity && (
//        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//          <div className="bg-white w-[450px] rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
//            <h3 className="text-lg font-semibold mb-2 text-center">🏆 Declare Winners</h3>
//
//            {["First", "Second", "Third"].map((pos) => (
//              <div key={pos} className="mb-4 border-b pb-2">
//                <p className="font-medium mb-1">{pos} Position</p>
//                <input
//                  className="border p-2 rounded w-full mb-1"
//                  placeholder="Student Name"
//                  value={selectedActivity.winner[pos]?.name || ""}
//                  onChange={(e) =>
//                    setSelectedActivity({
//                      ...selectedActivity,
//                      winner: { ...selectedActivity.winner, [pos]: { ...selectedActivity.winner[pos], name: e.target.value } },
//                    })
//                  }
//                />
//                <div className="grid grid-cols-2 gap-2">
//                  <input
//                    className="border p-2 rounded"
//                    placeholder="Class"
//                    value={selectedActivity.winner[pos]?.class || ""}
//                    onChange={(e) =>
//                      setSelectedActivity({
//                        ...selectedActivity,
//                        winner: { ...selectedActivity.winner, [pos]: { ...selectedActivity.winner[pos], class: e.target.value } },
//                      })
//                    }
//                  />
//                  <input
//                    className="border p-2 rounded"
//                    placeholder="Section"
//                    value={selectedActivity.winner[pos]?.section || ""}
//                    onChange={(e) =>
//                      setSelectedActivity({
//                        ...selectedActivity,
//                        winner: { ...selectedActivity.winner, [pos]: { ...selectedActivity.winner[pos], section: e.target.value } },
//                      })
//                    }
//                  />
//                </div>
//              </div>
//            ))}
//
//            <div className="flex justify-end gap-3 pt-2">
//              <button onClick={() => setShowWinnerModal(false)} className="px-4 py-2 border rounded">Cancel</button>
//              <button onClick={handleSaveWinner} className="px-4 py-2 bg-blue-600 text-white rounded">Save Winners</button>
//            </div>
//          </div>
//        </div>
//      )}
//    </div>
//  );
//}

export default function ActivitiesReport() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l8 4v5c0 4.5-3 7.8-8 9-5-1.2-8-4.5-8-9V7l8-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Activities Report
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Report module is currently under development.
          <br />
          We’re working on a better experience for you.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>
      </div>
    </div>
  );
}
