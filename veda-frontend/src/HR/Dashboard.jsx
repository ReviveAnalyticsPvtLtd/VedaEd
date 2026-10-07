import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/apiClient";
import {
  FiUsers,
  FiClock,
  FiDollarSign,
  FiUserPlus,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

export default function HRDashboard() {

  /* ===================== MAIN STATS ===================== */
  const [statValues, setStatValues] = useState({
    totalStaff: "—",
    pendingLeaves: "—",
    payroll: "—",
    newHires: "—",
  });

  const formatCurrency = (amount) => {
    if (!Number.isFinite(amount)) return "—";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  useEffect(() => {
    let alive = true;

    const loadStats = async () => {
      const now = new Date();
      try {
        // Staff is the only school-filtered source here, so it also gives us the
        // id set used to scope the leave and payroll responses.
        const staffRes = await api.get("/staff/");
        const staff = staffRes?.data?.staff || [];
        const myStaffIds = new Set(staff.map((s) => String(s._id)));

        const byRole = {};
        staff.forEach((s) => {
          const role = s?.personalInfo?.role || "Unassigned";
          byRole[role] = (byRole[role] || 0) + 1;
        });
        setRoleStats(
          Object.entries(byRole)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role))
        );

        const pad = (n) => String(n).padStart(2, "0");
        const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const eventEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const end = `${eventEnd.getFullYear()}-${pad(eventEnd.getMonth() + 1)}-${pad(eventEnd.getDate())}`;

        const [leaveResult, payrollResult, trendResult, payrollTrendResult, attendanceResult, eventsResult] =
          await Promise.allSettled([
            api.get("/staff/leave/requests"),
            api.get("/staff/payroll/list", {
              params: { month: now.getMonth() + 1, year: now.getFullYear() },
            }),
            api.get("/staff/hiring-trend", { params: { months: 12 } }),
            api.get("/staff/payroll/trend", { params: { months: 12 } }),
            api.get("/staff/attendance/list", { params: { date: today } }),
            api.get("/calendar/events", { params: { start: today, end } }),
          ]);

        if (!alive) return;

        if (trendResult.status === "fulfilled") {
          const trend = trendResult.value?.data?.hiringTrend;
          if (Array.isArray(trend)) setHiringData(trend);
        }

        if (payrollTrendResult.status === "fulfilled") {
          const trend = payrollTrendResult.value?.data?.trend;
          if (Array.isArray(trend)) setSalaryTrend(trend);
        }

        if (attendanceResult.status === "fulfilled") {
          const rows = attendanceResult.value?.data?.attendance;
          if (Array.isArray(rows)) {
            const PRESENT = new Set(["Present", "Late", "Half Day"]);
            const ABSENT = new Set(["Absent", "Leave"]);
            const present = rows.filter((r) => PRESENT.has(r?.status)).length;
            const absent = rows.filter((r) => ABSENT.has(r?.status)).length;
            setAttendanceData(
              present + absent > 0
                ? [
                    { name: "Present", value: present },
                    { name: "Absent", value: absent },
                  ]
                : []
            );
          }
        }

        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const newHires = staff.filter(
          (s) => s.createdAt && new Date(s.createdAt).getTime() >= cutoff
        ).length;

        // Both endpoints are read without a school filter today, so restrict
        // them to staff belonging to this dashboard's school.
        const ownLeaves =
          leaveResult.status === "fulfilled"
            ? (leaveResult.value?.data?.leaves || []).filter((leave) =>
                myStaffIds.has(String(leave?.staff?._id ?? leave?.staff))
              )
            : null;
        const pendingLeaves =
          ownLeaves === null
            ? null
            : ownLeaves.filter((l) => String(l.status).toLowerCase() === "pending").length;

        const ownPayrolls =
          payrollResult.status === "fulfilled"
            ? (payrollResult.value?.data?.payrolls || []).filter((row) =>
                myStaffIds.has(String(row?.staff?._id ?? row?.staff))
              )
            : null;
        const payrollTotal =
          ownPayrolls === null
            ? null
            : ownPayrolls.reduce(
                (sum, row) =>
                  sum +
                  (Number(row.basic) || 0) +
                  (Number(row.allowances) || 0) -
                  (Number(row.deductions) || 0),
                0
              );

        setStatValues({
          totalStaff: staff.length,
          pendingLeaves: pendingLeaves === null ? "—" : pendingLeaves,
          payroll: payrollTotal === null ? "—" : formatCurrency(payrollTotal),
          newHires,
        });

        const activityItems = [];
        staff
          .filter((s) => s.createdAt && new Date(s.createdAt).getTime() >= cutoff)
          .slice(0, 3)
          .forEach((s) => {
            activityItems.push({
              icon: "👤",
              text: `${s?.personalInfo?.name || "Staff"} joined as ${s?.personalInfo?.role || "Staff"}`,
            });
          });
        (ownLeaves || []).slice(0, 3).forEach((l) => {
          activityItems.push({
            icon: "📄",
            text: `${l?.staff?.personalInfo?.name || "Staff"} leave request ${String(l?.status || "").toLowerCase()}`,
          });
        });
        if (ownPayrolls && ownPayrolls.length > 0) {
          activityItems.push({
            icon: "💰",
            text: `Payroll generated for ${now.toLocaleString("en", { month: "long" })}`,
          });
        }
        setActivities(activityItems.slice(0, 5));

        if (eventsResult.status === "fulfilled") {
          const events = eventsResult.value?.data?.data;
          if (Array.isArray(events)) {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            setUpcomingEvents(
              events
                .filter((e) => e?.startDate && new Date(e.startDate).getTime() >= dayStart)
                .slice(0, 5)
                .map((e) => {
                  const d = new Date(e.startDate);
                  return `${e.title || "Event"} - ${d.toLocaleString("en", { day: "numeric", month: "short" })}`;
                })
            );
          }
        }
      } catch (error) {
        if (!alive) return;
        console.error("Failed to load HR dashboard stats:", error);
      }
    };

    loadStats();
    return () => {
      alive = false;
    };
  }, []);

  const stats = [
    { title: "Total Staff", value: statValues.totalStaff, icon: <FiUsers size={22} />, color: "border-blue-500" },
    { title: "Pending Leaves", value: statValues.pendingLeaves, icon: <FiClock size={22} />, color: "border-yellow-500" },
    { title: "Payroll This Month", value: statValues.payroll, icon: <FiDollarSign size={22} />, color: "border-green-500" },
    { title: "New Hires", value: statValues.newHires, icon: <FiUserPlus size={22} />, color: "border-purple-500" },
  ];

  /* ===================== ROLE CARDS ===================== */
  const [roleStats, setRoleStats] = useState([]);

  /* ===================== CHART DATA ===================== */
  const [hiringData, setHiringData] = useState([]);
  const [salaryTrend, setSalaryTrend] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="space-y-8">

      {/* ===================== TOP STAT CARDS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <div key={index}
            className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${item.color}`}>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h2 className="text-2xl font-bold mt-1">{item.value}</h2>
              </div>
              <div className="text-gray-500">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== ANALYTICS SECTION ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Hiring Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FiTrendingUp /> Monthly Hiring Trend
          </h3>

          {hiringData.length === 0 ? (
            <p className="text-gray-500 text-sm h-[260px] flex items-center justify-center">
              No hiring data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hiringData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hires" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-4">Today Attendance</h3>

          {attendanceData.length === 0 ? (
            <p className="text-gray-500 text-sm h-[260px] flex items-center justify-center">
              No attendance marked today yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={100}
                  label
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ===================== SALARY TREND ===================== */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="font-semibold mb-4">Salary Expense Trend (Last 12 Months)</h3>

        {salaryTrend.length === 0 ? (
          <p className="text-gray-500 text-sm h-[260px] flex items-center justify-center">
            No payroll data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salaryTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ===================== ROLE COUNT GRID ===================== */}
      <div>
        <h3 className="font-semibold mb-4">Staff Overview</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {roleStats.length === 0 ? (
            <p className="text-gray-500 text-sm col-span-full">
              No staff records to show yet.
            </p>
          ) : (
            roleStats.map((role) => (
              <div key={role.role}
                className="bg-white p-5 rounded-xl shadow-sm text-center">
                <p className="text-gray-500 text-sm">{role.role}</p>
                <h2 className="text-2xl font-bold mt-2">{role.count}</h2>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== HR ACTIVITY ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-4">Recent HR Activities</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {activities.length === 0 ? (
              <li className="text-gray-500">No recent activity yet.</li>
            ) : (
              activities.map((item, index) => (
                <li key={index}>{item.icon} {item.text}</li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-4">Upcoming Events</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {upcomingEvents.length === 0 ? (
              <li className="text-gray-500">No upcoming events in the next 30 days.</li>
            ) : (
              upcomingEvents.map((event, index) => (
                <li key={index}>📅 {event}</li>
              ))
            )}
          </ul>
        </div>

      </div>

    </div>
  );
}
