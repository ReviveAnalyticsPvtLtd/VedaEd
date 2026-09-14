import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    childrenCount: 0,
    totalFees: 0,
    pendingFees: 0,
    attendanceAverage: 0,
    upcomingPTA: "",
    overallGrade: "—",
    children: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const parentId = user?.refId || user?._id;
        if (!parentId) {
          setError("Parent account not found. Please log in again.");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(
          `${config.API_BASE_URL}/parents/${parentId}/dashboard-stats`,
          { headers }
        );
        if (res.data.success) {
          setStats(res.data.stats);
          setError("");
        } else {
          setError(res.data.message || "Failed to load dashboard data.");
        }
      } catch (err) {
        console.error("Error fetching parent dashboard stats:", err);
        setError(
          err.response?.status === 401
            ? "Session expired. Please log in again."
            : "Could not load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const children = stats.children || [];

  const feeData = [
    { name: "Paid", value: stats.totalFees || 0 },
    { name: "Pending", value: stats.pendingFees || 0 },
  ];
  const COLORS = ["#10B981", "#EF4444"];

  const attendanceData = children.map((child) => ({
    name: (child.name || "Child").split(" ")[0],
    attendance: child.attendance ?? 0,
  }));

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Parent Dashboard</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Linked Children</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.childrenCount || 0)}</h3>
            <Link to="/parent/classes" className="text-blue-500 text-xs font-medium hover:underline">View All</Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Fee Status</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">₹{loading ? "..." : (stats.pendingFees || 0).toLocaleString()}</h3>
            <span className="text-red-500 text-xs font-medium italic">Pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Attendance Avg.</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : `${stats.attendanceAverage || 0}%`}</h3>
            <span className="text-green-500 text-xs font-medium italic">Overall</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Upcoming PTA</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.upcomingPTA || "No scheduled")}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Child Attendance Bar Chart */}
         <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Children's Attendance</h3>
            <div className="h-64">
               {attendanceData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                       <XAxis dataKey="name" />
                       <YAxis domain={[0, 100]} />
                       <Tooltip />
                       <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                   No attendance data available
                 </div>
               )}
            </div>
         </div>

         {/* Fee Distribution Pie Chart */}
         <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Fee Overview</h3>
            <div className="h-64">
               {stats.totalFees > 0 || stats.pendingFees > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={feeData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {feeData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                   No fee records available
                 </div>
               )}
               <div className="flex justify-center gap-6 text-sm mt-2">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-green-500" />
                     <span>Paid: ₹{(stats.totalFees || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500" />
                     <span>Pending: ₹{(stats.pendingFees || 0).toLocaleString()}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Children Summary List */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mt-6">
         <h3 className="font-semibold mb-4">Children Academic Summary</h3>
         {children.length > 0 ? (
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b text-gray-400 text-sm">
                     <th className="pb-3 font-medium">Child Name</th>
                     <th className="pb-3 font-medium">Class & Section</th>
                     <th className="pb-3 font-medium">Last Exam Score</th>
                     <th className="pb-3 font-medium">Assignments</th>
                     <th className="pb-3 font-medium">Action</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {children.map((child, i) => (
                    <tr key={child._id || i} className="border-b last:border-0">
                       <td className="py-4 font-medium">{child.name || "Child"}</td>
                       <td className="py-4 text-gray-600">
                         {[child.className, child.sectionName].filter(Boolean).join(" - ") || "N/A"}
                       </td>
                       <td className="py-4 text-gray-600">
                         {typeof child.examScore === "number" ? `${child.examScore}%` : "—"}
                       </td>
                       <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(child.pendingAssignments || 0) > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                             {(child.pendingAssignments || 0) > 0 ? `${child.pendingAssignments} Pending` : 'All Done'}
                          </span>
                       </td>
                       <td className="py-4">
                          <Link to="/parent/profile" className="text-blue-600 hover:underline">View Report</Link>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         ) : (
           <p className="text-gray-400 text-center py-8 text-sm">
             No children linked to this account.
           </p>
         )}
      </div>
    </div>
  );
}