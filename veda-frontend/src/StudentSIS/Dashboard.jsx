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

export default function StudentDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignments: 0,
    attendance: 0,
    exams: 0,
    activities: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        
        if (user && user.refId) {
          setLoading(true);
          const authHeaders = { Authorization: `Bearer ${token}` };

          // 1. Get stats
          const res = await axios.get(`${config.API_BASE_URL}/students/${user.refId}/dashboard-stats`, { headers: authHeaders });
          setStats(res.data.stats);

          // 2. Get today's timetable
          const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const today = DAYS[new Date().getDay()];
          
          const ttRes = await axios.get(`${config.API_BASE_URL}/timetable`, { headers: authHeaders });
          if (ttRes.data && ttRes.data.success) {
            const todayEntries = ttRes.data.data
              .filter(entry => entry.day === today)
              .map(entry => ({
                time: entry.timeFrom,
                subject: entry.subject?.subjectName || "Unknown",
                teacher: entry.teacher?.personalInfo?.name || "Unknown",
                type: entry.subject?.type || "Lecture"
              }))
              .sort((a, b) => a.time.localeCompare(b.time));
            setTimetable(todayEntries);
          }
        }
      } catch (err) {
        console.error("Error fetching student dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const assignmentStatusData = [
    { name: "Completed", value: 8 },
    { name: "Pending", value: 3 },
    { name: "Overdue", value: 1 },
  ];
  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  const weeklyAttendance = [
    { day: "Mon", status: 1 },
    { day: "Tue", status: 1 },
    { day: "Wed", status: 1 },
    { day: "Thu", status: 0 },
    { day: "Fri", status: 1 },
  ];

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Student Dashboard</h2>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">My Attendance</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : `${stats.attendance || 0}%`}</h3>
            <span className="text-green-500 text-xs font-medium">Good</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Assignments</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.assignments || 0)}</h3>
            <span className="text-orange-500 text-xs font-medium">3 Pending</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Upcoming Exams</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.exams || 0)}</h3>
            <span className="text-blue-500 text-xs font-medium">Next: 15 Oct</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Activities</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold">{loading ? "..." : (stats.activities || 0)}</h3>
            <span className="text-purple-500 text-xs font-medium">Registered</span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments Chart */}
        <div className="bg-white p-5 rounded-xl border col-span-1 shadow-sm">
          <h3 className="font-semibold mb-4">Assignment Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assignmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assignmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-2">
            {assignmentStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white p-5 rounded-xl border col-span-2 shadow-sm">
          <h3 className="font-semibold mb-4">Today's Schedule</h3>
          <div className="space-y-3">
             {timetable.length > 0 ? (
               timetable.map((slot, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="w-20 text-xs font-medium text-blue-600">{slot.time}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{slot.subject}</div>
                      <div className="text-xs text-gray-500">{slot.teacher} • {slot.type}</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-white border text-[10px] font-bold uppercase text-gray-400">Join</div>
                 </div>
               ))
             ) : (
               <p className="text-gray-500 text-sm py-4 text-center">No classes scheduled for today.</p>
             )}
          </div>
          <Link to="/student/timetable" className="block text-center text-sm text-blue-600 mt-4 hover:underline">
            View Full Timetable
          </Link>
        </div>
      </div>


       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Notices */}
          <div className="bg-white p-5 rounded-xl border shadow-sm">
             <h3 className="font-semibold mb-4">Latest Notices</h3>
             <div className="space-y-4">
               {[
                 { title: "Annual Sports Meet", date: "12 Oct", category: "Sports" },
                 { title: "Science Fair Registration", date: "10 Oct", category: "Academic" },
                 { title: "Winter Vacation Schedule", date: "05 Oct", category: "School" }
               ].map((notice, i) => (
                 <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                       <div>
                          <div className="text-sm font-medium group-hover:text-blue-600 transition">{notice.title}</div>
                          <div className="text-[10px] text-gray-400">{notice.category}</div>
                       </div>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">{notice.date}</div>
                 </div>
               ))}
             </div>
             <Link to="/student/communication/notices" className="block text-center text-sm text-gray-400 mt-6 hover:underline">
               View All Notices
             </Link>
          </div>

          {/* Quick Tasks */}
          <div className="bg-white p-5 rounded-xl border shadow-sm">
             <h3 className="font-semibold mb-4">Action Items</h3>
             <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                   <input type="checkbox" className="rounded text-red-600" />
                   <div className="flex-1">
                      <div className="text-sm font-medium text-red-800">Submit Physics Lab Manual</div>
                      <div className="text-xs text-red-600 font-medium">Due Today, 04:00 PM</div>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                   <input type="checkbox" className="rounded text-orange-600" />
                   <div className="flex-1">
                      <div className="text-sm font-medium text-orange-800">Complete Math Quiz 2</div>
                      <div className="text-xs text-orange-600 font-medium">Due Tomorrow</div>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 opacity-60">
                   <input type="checkbox" checked className="rounded text-blue-600" readOnly />
                   <div className="flex-1">
                      <div className="text-sm font-medium text-blue-800 line-through">Pay Registration Fee</div>
                      <div className="text-xs text-blue-600 font-medium italic">Completed</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
