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
  const [stats, setStats] = useState({
    childrenCount: 0,
    totalFees: 0,
    pendingFees: 0,
    attendanceAverage: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user._id) {
          const res = await axios.get(`${config.API_BASE_URL}/parents/${user._id}/dashboard-stats`);
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Error fetching parent dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const feeData = [
    { name: "Paid", value: 45000 },
    { name: "Pending", value: 12000 },
  ];
  const COLORS = ["#10B981", "#EF4444"];

  const attendanceData = [
    { name: "Aarav", attendance: 92 },
    { name: "Siya", attendance: 95 },
  ];

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Parent Dashboard</h2>
      </div>

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
            <span className="text-green-500 text-xs font-medium italic">Excellent</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Upcoming PTA</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.upcomingPTA || "TBD")}</h3>
            <span className="text-blue-500 text-xs font-medium italic">Scheduled</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Child Attendance Bar Chart */}
         <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Children's Attendance</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                     <XAxis dataKey="name" />
                     <YAxis domain={[0, 100]} />
                     <Tooltip />
                     <Bar dataKey="attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Fee Distribution Pie Chart */}
         <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-4">Fee Overview (FY 2024-25)</h3>
            <div className="h-64">
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
               <div className="flex justify-center gap-6 text-sm mt-2">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-green-500" />
                     <span>Paid: ₹45,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500" />
                     <span>Pending: ₹12,000</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Children Summary List */}
      <div className="bg-white p-5 rounded-xl border shadow-sm mt-6">
         <h3 className="font-semibold mb-4">Children Academic Summary</h3>
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
                  {[
                    { name: "Aarav Kumar", class: "8-B", score: "88%", pending: 2 },
                    { name: "Siya Kumar", class: "4-A", score: "94%", pending: 0 }
                  ].map((child, i) => (
                    <tr key={i} className="border-b last:border-0">
                       <td className="py-4 font-medium">{child.name}</td>
                       <td className="py-4 text-gray-600">{child.class}</td>
                       <td className="py-4 text-gray-600">{child.score}</td>
                       <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${child.pending > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                             {child.pending > 0 ? `${child.pending} Pending` : 'All Done'}
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
      </div>
    </div>
  );
}
