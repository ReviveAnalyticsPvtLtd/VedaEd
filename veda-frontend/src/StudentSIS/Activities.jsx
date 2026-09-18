// import React, { useState, useEffect } from "react";
// import { FiAward } from "react-icons/fi";
// import { getAllActivities } from "../services/activityAPI";

// /**
//  * Student POV
//  * Read-only
//  */

// export default function Activities() {
//   const [activities, setActivities] = useState([]);
//   const [loadError, setLoadError] = useState(null);

//   useEffect(() => {
//     fetchActivities();
//   }, []);

//   const fetchActivities = async () => {
//     try {
//       setLoadError(null);
//       const data = await getAllActivities();
//       setActivities(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Failed to fetch activities", error);
//       setActivities([]);
//       setLoadError("Could not load activities. Please sign in again or try later.");
//     }
//   };

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
import React, { useState, useEffect } from "react";
// import { FiAward } from "react-icons/fi";
// import { getAllActivities } from "../services/activityAPI";

// /**
//  * Student POV
//  * Read-only
//  */

// export default function Activities() {
//   const [activities, setActivities] = useState([]);
//   const [loadError, setLoadError] = useState(null);

//   useEffect(() => {
//     fetchActivities();
//   }, []);

//   const fetchActivities = async () => {
//     try {
//       setLoadError(null);
//       const data = await getAllActivities();
//       setActivities(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error("Failed to fetch activities", error);
//       setActivities([]);
//       setLoadError("Could not load activities. Please sign in again or try later.");
//     }
//   };

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
//     if (!a) return "—";
//     const sec = a.section != null ? String(a.section) : "";
//     const secAll = sec.trim().toLowerCase() === "all";
//     if (Array.isArray(a.class) && a.class.length > 0) {
//       return a.class
//         .filter((cls) => cls != null && cls !== "")
//         .map((cls) =>
//           secAll
//             ? sections.map((s) => `${cls}${s}`).join(", ")
//             : `${cls}${sec}`
//         )
//         .join(", ");
//     }
//     const cls = a.class != null ? String(a.class) : "";
//     if (!cls && !sec) return "—";
//     return secAll
//       ? sections.map((s) => `${cls}${s}`).join(", ")
//       : `${cls}${sec}`;
//   };

//   return (
//     <div className="p-0 min-h-screen">
//       <h2 className="text-2xl font-bold mb-4">School Activities</h2>
//       <p className="text-sm text-gray-500 mb-4">
//         Activities for your class and section (from school admin and your teachers).
//       </p>

//       {loadError && (
//         <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
//           {loadError}
//         </div>
//       )}

//       {/* Grid */}
//       <div className="grid grid-cols-3 gap-6">
//         {!loadError && activities.length === 0 && (
//           <p className="text-gray-500 text-sm col-span-3">No activities to show yet.</p>
//         )}
//         {activities.map((a) => {
//           const theme = ACTIVITY_THEME[a.type] || ACTIVITY_THEME.Sports;

//           return (
//             <div
//               key={a._id || a.id}
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
//                   <p className={`font-semibold ${theme.text} mb-1 flex items-center gap-1`}>
//                     <FiAward /> Winners
//                   </p>
//                   <p>1️⃣ {a.winner.First.name}</p>
//                   {a.winner.Second?.name && <p>2️⃣ {a.winner.Second.name}</p>}
//                   {a.winner.Third?.name && <p>3️⃣ {a.winner.Third.name}</p>}
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

//   const getClassSectionDisplay = (a) => {
//     if (!a) return "—";
//     const sec = a.section != null ? String(a.section) : "";
//     const secAll = sec.trim().toLowerCase() === "all";
//     if (Array.isArray(a.class) && a.class.length > 0) {
//       return a.class
//         .filter((cls) => cls != null && cls !== "")
//         .map((cls) =>
//           secAll
//             ? sections.map((s) => `${cls}${s}`).join(", ")
//             : `${cls}${sec}`
//         )
//         .join(", ");
//     }
//     const cls = a.class != null ? String(a.class) : "";
//     if (!cls && !sec) return "—";
//     return secAll
//       ? sections.map((s) => `${cls}${s}`).join(", ")
//       : `${cls}${sec}`;
//   };

//   return (
//     <div className="p-0 min-h-screen">
//       <h2 className="text-2xl font-bold mb-4">School Activities</h2>
//       <p className="text-sm text-gray-500 mb-4">
//         Activities for your class and section (from school admin and your teachers).
//       </p>

//       {loadError && (
//         <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
//           {loadError}
//         </div>
//       )}

//       {/* Grid */}
//       <div className="grid grid-cols-3 gap-6">
//         {!loadError && activities.length === 0 && (
//           <p className="text-gray-500 text-sm col-span-3">No activities to show yet.</p>
//         )}
//         {activities.map((a) => {
//           const theme = ACTIVITY_THEME[a.type] || ACTIVITY_THEME.Sports;

//           return (
//             <div
//               key={a._id || a.id}
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
//                   <p className={`font-semibold ${theme.text} mb-1 flex items-center gap-1`}>
//                     <FiAward /> Winners
//                   </p>
//                   <p>1️⃣ {a.winner.First.name}</p>
//                   {a.winner.Second?.name && <p>2️⃣ {a.winner.Second.name}</p>}
//                   {a.winner.Third?.name && <p>3️⃣ {a.winner.Third.name}</p>}
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


export default function Activities() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 9H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 4v5h5" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Gradebook module is currently under development.
          <br />
          We’re working on something better for you.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>

      </div>
    </div>
  );
}