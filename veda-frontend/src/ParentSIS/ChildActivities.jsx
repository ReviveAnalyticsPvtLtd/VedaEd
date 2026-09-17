// import React, { useState } from "react";
// import { FiAward } from "react-icons/fi";

// /**
//  * Parent POV
//  * Read-only
//  * Shows My Child Activities
//  */

// export default function ChildActivities() {
//   // 🔹 Child details (future: API)
//   const studentClass = "9";
//   const studentSection = "A";

//   const [activeTab, setActiveTab] = useState("all");

//   const activities = [
//     {
//       id: 1,
//       type: "Sports",
//       title: "Inter Class Football Tournament",
//       class: ["8", "9"],
//       section: "All",
//       date: "2026-02-05",
//       time: "10:00 AM",
//       venue: "School Ground",
//       participants: [],
//       status: "Completed",
//       winner: {
//         First: { name: "Rahul Kumar", class: "9", section: "A" },
//         Second: { name: "Aman Singh", class: "8", section: "B" },
//         Third: { name: "Rohit Verma", class: "9", section: "C" },
//       },
//     },
//     {
//       id: 2,
//       type: "Academic",
//       title: "Science Quiz Competition",
//       class: ["7"],
//       section: "A",
//       date: "2026-02-12",
//       time: "11:30 AM",
//       venue: "Auditorium",
//       participants: [],
//       status: "Upcoming",
//       winner: {},
//     },
//   ];

//   const sections = ["A", "B", "C"];

//   const ACTIVITY_THEME = {
//     Sports: {
//       accent: "green",
//       border: "border-green-200",
//       text: "text-green-700",
//       badge: "bg-green-100 text-green-700",
//       winnerBg: "bg-green-100",
//     },
//     Academic: {
//       accent: "blue",
//       border: "border-blue-200",
//       text: "text-blue-700",
//       badge: "bg-blue-100 text-blue-700",
//       winnerBg: "bg-blue-100",
//     },
//     Cultural: {
//       accent: "purple",
//       border: "border-purple-200",
//       text: "text-purple-700",
//       badge: "bg-purple-100 text-purple-700",
//       winnerBg: "bg-purple-100",
//     },
//     Competition: {
//       accent: "orange",
//       border: "border-orange-200",
//       text: "text-orange-700",
//       badge: "bg-orange-100 text-orange-700",
//       winnerBg: "bg-orange-100",
//     },
//   };

//   const getClassSectionDisplay = (a) => {
//     return a.class
//       .map((cls) =>
//         a.section === "All"
//           ? sections.map((s) => `${cls}${s}`).join(", ")
//           : `${cls}${a.section}`
//       )
//       .join(", ");
//   };

//   // 🔹 MY CHILD ACTIVITIES FILTER
//   const myActivities = activities.filter((a) => {
//     const classMatch = a.class.includes(studentClass);
//     const sectionMatch =
//       a.section === "All" || a.section === studentSection;
//     return classMatch && sectionMatch;
//   });

//   const list = activeTab === "all" ? activities : myActivities;

//   return (
//     <div className="p-0 min-h-screen">
//       {/* Header */}
//       <h2 className="text-2xl font-bold mb-4">My Child Activities</h2>

//       {/* Tabs */}
//       <div className="flex gap-6 text-sm mb-3 border-b">
//         <button
//           onClick={() => setActiveTab("all")}
//           className={`pb-2 ${
//             activeTab === "all"
//               ? "text-blue-600 font-semibold border-b-2 border-blue-600"
//               : "text-gray-500"
//           }`}
//         >
//           All Activities
//         </button>

//         <button
//           onClick={() => setActiveTab("my")}
//           className={`pb-2 ${
//             activeTab === "my"
//               ? "text-blue-600 font-semibold border-b-2 border-blue-600"
//               : "text-gray-500"
//           }`}
//         >
//           My Child Activities
//         </button>
//       </div>

//       {/* Grid */}
//       <div className="grid grid-cols-3 gap-6">
//         {list.map((a) => {
//           const theme = ACTIVITY_THEME[a.type] || ACTIVITY_THEME.Sports;

//           return (
//             <div
//               key={a.id}
//               className={`relative rounded-2xl p-5 border ${theme.border}
//               bg-white hover:shadow-lg transition-all`}
//             >
//               <div
//                 className={`absolute left-0 top-0 h-full w-1 bg-${theme.accent}-500 rounded-l-2xl`}
//               />

//               <span
//                 className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full ${theme.badge}`}
//               >
//                 {a.status}
//               </span>

//               <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>
//                 {a.title}
//               </h3>

//               <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
//                 {a.type}
//               </p>

//               <div className="text-sm text-gray-600 space-y-1 mb-4">
//                 <p>🎓 {getClassSectionDisplay(a)}</p>
//                 <p>📅 {a.date} • {a.time}</p>
//                 <p>📍 {a.venue}</p>
//               </div>

//               <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm">
//                 <p className="font-medium mb-1">Participants</p>
//                 {getClassSectionDisplay(a)}
//               </div>

//               {a.winner?.First?.name ? (
//                 <div className={`p-3 rounded-lg ${theme.winnerBg}`}>
//                   <p
//                     className={`font-semibold ${theme.text} mb-1 flex items-center gap-1`}
//                   >
//                     <FiAward /> Winners
//                   </p>
//                   <p>1️⃣ {a.winner.First.name}</p>
//                   {a.winner.Second?.name && (
//                     <p>2️⃣ {a.winner.Second.name}</p>
//                   )}
//                   {a.winner.Third?.name && (
//                     <p>3️⃣ {a.winner.Third.name}</p>
//                   )}
//                 </div>
//               ) : (
//                 <p className="text-sm text-gray-400 italic">
//                   Winner not declared yet
//                 </p>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

export default function ChildActivities() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 12l2 2 2-2m-2-2v4"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900">
          Child Activities
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Activities module is currently under development.
          <br />
          We’re working on a better experience for you.
        </p>

        {/* Coming Soon Badge */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>

      </div>
    </div>
  );
}