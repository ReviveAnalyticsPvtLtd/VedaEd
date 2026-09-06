// import React, { useMemo, useRef, useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import {
//   FiShield,
//   FiUsers,
//   FiAlertTriangle,
//   FiClock,
//   FiSmile,
//   FiPhone,
//   FiMail,
//   FiExternalLink,
//   FiSend,
//   FiEdit,
//   FiTrash2,
//   FiPlus,
//   FiSearch,
//   FiX,
// } from "react-icons/fi";
// import * as XLSX from "xlsx";
// import HelpInfo from "../components/HelpInfo";
// import disciplineAPI from "../services/disciplineAPI";

// /* ================= CLASS → SECTION → STUDENTS ================= */
// import classAPI from "../services/classAPI";

// /* ================= CLASS → SECTION → STUDENTS ================= */
// // Removed hardcoded CLASS_DATA


// /* ================= INITIAL TRACKER ================= */
// /* ================= INITIAL TRACKER (MOCK DATA REMOVED) ================= */

// /* ================= SIDE DATA ================= */
// const recognition = [
//   {
//     name: "Meera Desai",
//     detail: "Consistent leadership in assemblies",
//     date: "18 Sep 2025",
//   },
// ];

// const directory = [
//   {
//     title: "Discipline Lead",
//     name: "Ms. Garima Yadav",
//     contact: "garima.y@veda.edu",
//     icon: <FiMail />,
//   },
//   {
//     title: "Counsellor Desk",
//     name: "+91 98451 11345",
//     contact: "9 AM – 4 PM",
//     icon: <FiPhone />,
//   },
// ];

// /* ============================================================= */

// export default function TeacherDiscipline() {
//   const navigate = useNavigate();
//   const rowRefs = useRef({});

//   /* -------- State for Dropdowns -------- */
//   const [classList, setClassList] = useState([]);
//   const [userSelectedClass, setUserSelectedClass] = useState(null); // Full class object
//   const [studentList, setStudentList] = useState([]);

//   /* -------- filters & search -------- */
//   const [search, setSearch] = useState("");
//   const [filterClassId, setFilterClassId] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
  
//   const [tracker, setTracker] = useState([]);

//   useEffect(() => {
//     fetchIncidents();
//     fetchClasses();
//   }, []);

//   const fetchClasses = async () => {
//     try {
//       const resp = await classAPI.getAllClasses();
//       if (resp.success) {
//         setClassList(resp.data);
//       }
//     } catch (error) {
//       console.error("Failed to fetch classes", error);
//     }
//   };

//   const fetchIncidents = async () => {
//     try {
//       const data = await disciplineAPI.getAllIncidents();
//       setTracker(data.map(d => ({ ...d, id: d._id })));
//     } catch (error) {
//       console.error("Failed to fetch incidents", error);
//     }
//   };

//   /* -------- form state -------- */
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   /* -------- form -------- */
//   const [form, setForm] = useState({
//     className: "",
//     section: "",
//     student: "",
//     incident: "",
//     severity: "Low",
//     status: "Open",
//     action: "",
//     date: new Date().toISOString().split("T")[0],
//   });

//   /* ================= DERIVED REAL DATA ================= */

//   const filteredTracker = useMemo(() => {
//     return tracker.filter((r) => {
//       const matchSearch =
//         r.student.toLowerCase().includes(search.toLowerCase()) ||
//         r.incident.toLowerCase().includes(search.toLowerCase());

//       const matchClass = filterClassId
//         ? r.className === classList.find(c => c._id === filterClassId)?.name // filtering logic might need adjustment depending on what r.className stores. Assuming it stores Name for now based on previous code.
//         : true;

//       const matchStatus = filterStatus
//         ? r.status === filterStatus
//         : true;

//       return matchSearch && matchClass && matchStatus;
//     });
//   }, [tracker, search, filterClassId, filterStatus, classList]);

//   const summary = {
//     open: tracker.filter((r) => r.status === "Open").length,
//     followups: tracker.filter((r) => r.status === "Monitoring").length,
//     escalations: tracker.filter((r) => r.status === "Escalated").length,
//     recognitions: recognition.length,
//   };

//   const recentIncidents = tracker
//     .filter((r) => r.status !== "Resolved")
//     .slice(0, 3);

//   const disciplineActivity = Object.values(
//     tracker.reduce((acc, r) => {
//       if (!acc[r.student]) {
//         acc[r.student] = {
//           name: r.student,
//           incidents: 0,
//           recognition: 0,
//         };
//       }
//       acc[r.student].incidents += 1;
//       return acc;
//     }, {})
//   );

//   const complaintQueue = tracker.filter(
//     (r) =>
//       r.status === "Escalated" ||
//       (r.severity === "High" && r.status !== "Resolved")
//   );

//   /* ================= ACTIONS ================= */

//   const resetForm = () => {
//     setForm({
//       className: "",
//       section: "",
//       student: "",
//       incident: "",
//       severity: "Low",
//       status: "Open",
//       action: "",
//       date: new Date().toISOString().split("T")[0],
//     });
//     setEditingId(null);
//     setEditingId(null);
//     setShowForm(false);
//     setUserSelectedClass(null);
//     setStudentList([]);
//   };

//   const handleSave = async () => {
//     if (!form.className || !form.section || !form.student || !form.incident) {
//       alert("Please complete all required fields");
//       return;
//     }

//     try {
//       if (editingId) {
//         const updated = await disciplineAPI.updateIncident(editingId, form);
//         setTracker((prev) =>
//           prev.map((r) => (r.id === editingId ? { ...updated, id: updated._id } : r))
//         );
//       } else {
//         const newIncident = await disciplineAPI.createIncident(form);
//         setTracker((prev) => [{ ...newIncident, id: newIncident._id }, ...prev]);
//       }
//       resetForm();
//     } catch (error) {
//       console.error("Failed to save incident", error);
//       alert("Failed to save incident");
//     }
//   };

//   const handleEdit = (row) => {
//     setForm(row);
//     setEditingId(row.id);
//     setShowForm(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Delete this record?")) {
//       try {
//         await disciplineAPI.deleteIncident(id);
//         setTracker((prev) => prev.filter((r) => r.id !== id));
//       } catch (error) {
//         console.error("Failed to delete incident", error);
//         alert("Failed to delete incident");
//       }
//     }
//   };

//   // Export Excel function
//   const handleExportExcel = () => {
//     const exportData = tracker.map((r) => ({
//       Class: `${r.className}${r.section}`,
//       Student: r.student,
//       Incident: r.incident,
//       Severity: r.severity,
//       Status: r.status,
//       Action: r.action,
//       Date: r.date,
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Discipline Records");

//     XLSX.writeFile(workbook, "discipline-records.xlsx");
//   };

//   /* ================= UI ================= */

//   return (
//     <div className="p-0 min-h-screen ">
//       <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
//         <span>Teacher</span>
//         <span>&gt;</span>
//         <span>Discipline</span>
//       </div>
//       {/* Header */}
//       <div className="flex justify-between items-center mb-3">
//         <h2 className="text-2xl font-bold flex items-center gap-2">
//           Discipline Center
//         </h2>
//         <div className="flex mb-3 gap-2">
//           <HelpInfo title="Discipline Help" description="Teacher discipline tracker" />
        
//           <button
//             onClick={() => navigate("/teacher-communication/complaints")}
//             className="bg-blue-600 text-white px-2 py-1 rounded"
//           >
//              Raise Complaint
//           </button>
//         </div>
//       </div>

//       {/* Summary */}
//            <div className="bg-white mb-3 border rounded-lg p-3 space-y-3">
//       <div className="grid grid-cols-1 md:grid-cols-4  gap-3">
//         {[["Open Cases", summary.open, "bg-red-50", <FiAlertTriangle />],
//           ["Follow-ups", summary.followups, "bg-yellow-50", <FiClock />],
//           ["Escalations", summary.escalations, "bg-purple-50", <FiUsers />],
//           ["Recognitions", summary.recognitions, "bg-green-50", <FiSmile />],
//         ].map(([l, v, bg, icon]) => (
//           <div key={l} className={`p-3 rounded-lg border ${bg}`}>
//             <div className="flex justify-between">
//               <span className="text-sm text-gray-500">{l}</span>
//               {icon}
//             </div>
//             <p className="text-xl font-bold">{v}</p>
//           </div>
//         ))}
//       </div>
// </div>
//       {/* Chart + Recent */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 mb-3 gap-3">
//         <div className="bg-white border rounded-lg p-3">
//           <h3 className="font-semibold mb-2">Student Discipline Activity</h3>
//           <ResponsiveContainer width="100%" height={260}>
//             <BarChart data={disciplineActivity}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="incidents" fill="#4673FF" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="bg-white border rounded-lg p-3">
//           <h3 className="font-semibold mb-2">Recent Incidents</h3>
//           <div className="space-y-2">
//             {recentIncidents.map((r) => (
//               <div
//                 key={r.id}
//                 onClick={() =>
//                   rowRefs.current[r.id]?.scrollIntoView({
//                     behavior: "smooth",
//                     block: "center",
//                   })
//                 }
//                 className="p-2 border rounded cursor-pointer hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <p className="font-semibold">{r.student}</p>
//                   <span
//                     className={`px-2 py-0.5 rounded-full text-xs
//                     ${
//                       r.severity === "High"
//                         ? "bg-red-100 text-red-700"
//                         : r.severity === "Medium"
//                         ? "bg-yellow-100 text-yellow-700"
//                         : "bg-green-100 text-green-700"
//                     }`}
//                   >
//                     {r.severity}
//                   </span>
//                 </div>
//                 <p className="text-gray-600 text-sm">{r.incident}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Tracker */}
//      <div className="bg-white mb-3 border rounded-lg p-3 space-y-3">
//   <div className="flex justify-between items-center">
//     <h3 className="font-semibold">Discipline Tracker</h3>
//     <div className="flex gap-2">
//       <button
//         onClick={handleExportExcel}
//         className="bg-green-600 text-white px-3 py-1 rounded"
//       >
//         Export Excel
//       </button>
//       <button
//         onClick={() => setShowForm(true)}
//         className="bg-blue-600 text-white px-3 py-1 rounded"
//       >
//         Add Record
//       </button>
//     </div>
//   </div>

//         {/* Filters */}
//         <div className="flex flex-wrap gap-2 items-center">
//           <div className="flex items-center border rounded px-2">
//             <FiSearch className="text-gray-400" />
//             <input
//               placeholder="Search student / incident"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="px-2 py-1 outline-none"
//             />
//           </div>

//           <select
//             value={filterClassId}
//             onChange={(e) => setFilterClassId(e.target.value)}
//             className="border rounded px-2 py-1"
//           >
//             <option value="">All Classes</option>
//             {classList.map((c) => (
//               <option key={c._id} value={c._id}>Class {c.name}</option>
//             ))}
//           </select>

//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="border rounded px-2 py-1"
//           >
//             <option value="">All Status</option>
//             <option>Open</option>
//             <option>Monitoring</option>
//             <option>Resolved</option>
//             <option>Escalated</option>
//           </select>
//         </div>

//         {/* Table */}
//     <div className="mt-4 overflow-x-auto">
//     <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
//       <thead className="bg-gray-50 text-gray-600">
//         <tr>
//           <th className="py-2 px-3">Student</th>
//           <th className="py-2 px-3">Class</th>
//           <th className="py-2 px-3">Incident</th>
//           <th className="py-2 px-3">Severity</th>
//           <th className="py-2 px-3">Status</th>
//           <th className="py-2 px-3 text-center">Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {filteredTracker.length === 0 ? (
//           <tr>
//             <td
//               colSpan={6}
//               className="py-6 px-3 text-center text-gray-500"
//             >
//               No records found.
//             </td>
//           </tr>
//         ) : (
//           filteredTracker.map((r) => (
//             <tr
//               key={r.id}
//               ref={(el) => (rowRefs.current[r.id] = el)}
//               className="border-t hover:bg-blue-50/20"
//             >
//               <td className="py-2 px-3 font-medium text-gray-800">{r.student}</td>
//               <td className="py-2 px-3 text-gray-600">
//                 {r.className}
//                 {r.section}
//               </td>
//               <td className="py-2 px-3 text-gray-600">{r.incident}</td>
//               <td className="py-2 px-3 text-gray-600">{r.severity}</td>
//               <td className="py-2 px-3 text-gray-600">{r.status}</td>
//               <td className="py-2 px-3 text-center">
//                 <div className="flex items-center gap-3 justify-center text-gray-500">
//                   <button
//                     onClick={() => handleEdit(r)}
//                     className="hover:text-blue-600"
//                     title="Edit"
//                   >
//                     <FiEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(r.id)}
//                     className="hover:text-red-600"
//                     title="Delete"
//                   >
//                     <FiTrash2 />
//                   </button>
//                 </div>
//               </td>
//             </tr>
//           ))
//         )}
//       </tbody>
//     </table>
//         </div>
//       </div>

//       {/* Complaint Queue */}
//       <div className="bg-white border rounded-lg mb-3 p-3">
//         <div className="flex justify-between items-center mb-2">
//           <h3 className="font-semibold">Complaint Queue</h3>
//           <button
//             onClick={() => navigate("/teacher-communication/complaints")}
//             className="text-blue-600 flex items-center gap-1"
//           >
//             View All <FiExternalLink />
//           </button>
//         </div>
//         <div className="space-y-2">
//           {complaintQueue.map((c, i) => (
//             <div
//               key={`${c.student}-${i}`}
//               className="border rounded p-2"
//             >
//               <div className="flex justify-between">
//                 <p className="font-semibold">{c.student}</p>
//                 <span className="text-xs bg-red-100 text-red-700 px-2 rounded">
//                   {c.severity}
//                 </span>
//               </div>
//               <p className="text-sm text-gray-600">{c.incident}</p>
//               <p className="text-xs text-gray-400">
//                 Class {c.className}
//                 {c.section}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ================== ADD / EDIT FORM MODAL ================== */}
//      {showForm && (
// <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-6 z-50 overflow-auto">
//     <div className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] p-6 overflow-y-auto relative">
//       <button
//         onClick={resetForm}
//         className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
//         aria-label="Close modal"
//       >
//         <FiX size={20} />
//       </button>
//             <h2 className="text-xl font-semibold mb-4">
//               {editingId ? "Edit Record" : "Add Record"}
//             </h2>

//             {/* Class Select */}
//             <label className="block mb-2 font-semibold">
//               Class <span className="text-red-600">*</span>
//             </label>
//             <select
//               value={form.className} // We might want to store Class ID here instead of Name if we want strict linking, but for now maintaining Name to avoid breaking table view if it expects names.
//               onChange={(e) => {
//                  const selectedClassId = e.target.value;
//                  const selectedClass = classList.find(c => c._id === selectedClassId); 
//                  // If value is stored as Name, we need to find by name? 
//                  // Actually, standard practice: Value is ID. 
//                  // But wait, the table displays `r.className`. If we store ID, we need to lookup Name to display.
//                  // For now, let's store Name to keep it simple with existing code, OR switch to ID.
//                  // Existing code uses names like "7", "8".
//                  // API returns classes with names like "1", "2"... 
//                  // Let's store the Name in `form.className` as before, but Find the object to get sections.
                 
//                  // Ideally, we should refactor to use IDs. But to minimize breaking changes:
//                  // Let's assume `e.target.value` is the Name (since we will set option value to Name).
                 
//                  const clsObj = classList.find(c => c.name === e.target.value);
//                  setUserSelectedClass(clsObj);
                 
//                 setForm({
//                   ...form,
//                   className: e.target.value,
//                   section: "",
//                   student: "",
//                 });
//                 setStudentList([]);
//               }}
//               className="w-full border rounded px-3 py-2 mb-4"
//             >
//               <option value="">Select Class</option>
//               {classList.map((cls) => (
//                 <option key={cls._id} value={cls.name}>
//                   Class {cls.name}
//                 </option>
//               ))}
//             </select>

//             {/* Section Select */}
//             <label className="block mb-2 font-semibold">
//               Section <span className="text-red-600">*</span>
//             </label>
//             <select
//               value={form.section}
//               onChange={async (e) => {
//                 const secName = e.target.value;
//                 setForm({
//                   ...form,
//                   section: secName,
//                   student: "",
//                 });
                
//                 // Fetch students
//                 if (userSelectedClass && secName) {
//                     const secObj = userSelectedClass.sections.find(s => s.name === secName);
//                     if (secObj) {
//                         try {
//                             const resp = await classAPI.getClassSectionData(userSelectedClass._id, secObj._id);
//                             if (resp.success && resp.data && resp.data.students) {
//                                 setStudentList(resp.data.students);
//                             }
//                         } catch (err) {
//                             console.error("Failed to fetch students", err);
//                         }
//                     }
//                 }
//               }}
//               disabled={!form.className}
//               className="w-full border rounded px-3 py-2 mb-4 disabled:bg-gray-100"
//             >
//               <option value="">Select Section</option>
//               {userSelectedClass &&
//                 userSelectedClass.sections.map((sec) => (
//                   <option key={sec._id} value={sec.name}>
//                     Section {sec.name}
//                   </option>
//                 ))}
//             </select>

//             {/* Student Select */}
//             <label className="block mb-2 font-semibold">
//               Student <span className="text-red-600">*</span>
//             </label>
//             <select
//               value={form.student}
//               onChange={(e) =>
//                 setForm({ ...form, student: e.target.value })
//               }
//               disabled={!form.section}
//               className="w-full border rounded px-3 py-2 mb-4 disabled:bg-gray-100"
//             >
//               <option value="">Select Student</option>
//               {studentList.map((stu) => (
//                   <option key={stu._id} value={stu.personalInfo?.name}>
//                     {stu.personalInfo?.name}
//                   </option>
//                 ))}
//             </select>

//             {/* Incident */}
//             <label className="block mb-2 font-semibold">
//               Incident <span className="text-red-600">*</span>
//             </label>
//             <textarea
//               rows={3}
//               value={form.incident}
//               onChange={(e) =>
//                 setForm({ ...form, incident: e.target.value })
//               }
//               className="w-full border rounded px-3 py-2 mb-4"
//               placeholder="Describe the incident"
//             />

//             {/* Severity */}
//             <label className="block mb-2 font-semibold">
//               Severity
//             </label>
//             <select
//               value={form.severity}
//               onChange={(e) =>
//                 setForm({ ...form, severity: e.target.value })
//               }
//               className="w-full border rounded px-3 py-2 mb-4"
//             >
//               <option>Low</option>
//               <option>Medium</option>
//               <option>High</option>
//             </select>

//             {/* Status */}
//             <label className="block mb-2 font-semibold">
//               Status
//             </label>
//             <select
//               value={form.status}
//               onChange={(e) =>
//                 setForm({ ...form, status: e.target.value })
//               }
//               className="w-full border rounded px-3 py-2 mb-4"
//             >
//               <option>Open</option>
//               <option>Monitoring</option>
//               <option>Resolved</option>
//               <option>Escalated</option>
//             </select>

//             {/* Action */}
//             <label className="block mb-2 font-semibold">
//               Action Taken
//             </label>
//             <textarea
//               rows={2}
//               value={form.action}
//               onChange={(e) =>
//                 setForm({ ...form, action: e.target.value })
//               }
//               className="w-full border rounded px-3 py-2 mb-4"
//               placeholder="Describe any action taken"
//             />

//             {/* Date */}
//             <label className="block mb-2 font-semibold">
//               Date
//             </label>
//             <input
//               type="date"
//               value={form.date}
//               onChange={(e) =>
//                 setForm({ ...form, date: e.target.value })
//               }
//               className="w-full border rounded px-3 py-2 mb-4"
//             />

//             {/* Buttons */}
//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={resetForm}
//                 className="px-4 py-2 border rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSave}
//                 className="px-4 py-2 bg-green-600 text-white rounded"
//               >
//                 {editingId ? "Update" : "Add"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
export default function Discipline() {
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
          Discipline
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Discipline module is currently under development.
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