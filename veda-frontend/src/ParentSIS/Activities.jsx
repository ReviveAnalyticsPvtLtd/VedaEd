import React, { useState, useEffect } from "react";
import { FiAward } from "react-icons/fi";
import { getAllActivities } from "../services/activityAPI";

/**
 * Parent POV
 * Read-only
 */

export default function Activities() {
  // 🔹 Logged-in parent's child (future: API)
  const studentClass = "9";
  const studentSection = "A";

  const [activeTab, setActiveTab] = useState("all");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const data = await getAllActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities", error);
    }
  };

  const sections = ["A", "B", "C"];

  const ACTIVITY_THEME = {
    Sports: {
      accent: "green",
      border: "border-green-200",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
      winnerBg: "bg-green-100",
    },
    Academic: {
      accent: "blue",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
      winnerBg: "bg-blue-100",
    },
    Cultural: {
      accent: "purple",
      border: "border-purple-200",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
      winnerBg: "bg-purple-100",
    },
    Competition: {
      accent: "orange",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
      winnerBg: "bg-orange-100",
    },
  };

  const getClassSectionDisplay = (a) => {
    if (Array.isArray(a.class)) {
      return a.class
        .map((cls) =>
          a.section === "All"
            ? sections.map((s) => `${cls}${s}`).join(", ")
            : `${cls}${a.section}`
        )
        .join(", ");
    }
    return a.section === "All"
      ? sections.map((s) => `${a.class}${s}`).join(", ")
      : `${a.class}${a.section}`;
  };

  // 🔹 MY CHILD'S ACTIVITIES FILTER
  const myActivities = activities.filter((a) => {
    const classes = Array.isArray(a.class) ? a.class : [a.class];
    const classMatch = classes.includes(studentClass);
    const sectionMatch =
      a.section === "All" || a.section === studentSection;
    return classMatch && sectionMatch;
  });

  const list =
    activeTab === "all" ? activities : myActivities;

  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-4">School Activities</h2>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3  border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2 ${
            activeTab === "all"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          All Activities
        </button>

        <button
          onClick={() => setActiveTab("my")}
          className={`pb-2 ${
            activeTab === "my"
              ? "text-blue-600 font-semibold border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Child's Activities
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">
        {list.map((a) => {
          const theme = ACTIVITY_THEME[a.type] || ACTIVITY_THEME.Sports;

          return (
            <div
              key={a._id || a.id}
              className={`relative rounded-2xl p-5 border ${theme.border}
              bg-white hover:shadow-lg transition-all`}
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 bg-${theme.accent}-500 rounded-l-2xl`}
              />

              <span
                className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full ${theme.badge}`}
              >
                {a.status}
              </span>

              <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>
                {a.title}
              </h3>

              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                {a.type}
              </p>

              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>🎓 {getClassSectionDisplay(a)}</p>
                <p>📅 {a.date} • {a.time}</p>
                <p>📍 {a.venue}</p>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm">
                <p className="font-medium mb-1">Participants</p>
                {getClassSectionDisplay(a)}
              </div>

              {a.winner?.First?.name ? (
                <div className={`p-3 rounded-lg ${theme.winnerBg}`}>
                  <p className={`font-semibold ${theme.text} mb-1 flex items-center gap-1`}>
                    <FiAward /> Winners
                  </p>
                  <p>1️⃣ {a.winner.First.name}</p>
                  {a.winner.Second?.name && <p>2️⃣ {a.winner.Second.name}</p>}
                  {a.winner.Third?.name && <p>3️⃣ {a.winner.Third.name}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Winner not declared yet
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
