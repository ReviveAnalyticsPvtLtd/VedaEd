import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/apiClient";
import config from "../../config";
import { useAccess } from "../../access/useAccess";
import { getAllEvents } from "../../services/calendarAPI";
import { format, isAfter } from "date-fns";
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

const COLORS = ["#4F46E5", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444"];

export default function UnifiedDashboard() {
  const { isSuperAdmin, canViewModule } = useAccess();
  const location = useLocation();
  const isSuper = isSuperAdmin || location.pathname.startsWith("/superadmin");

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const topModules = useMemo(() => {
    return [
      {
        title: isSuper ? "SIS" : "Admin SIS",
        key: "sis",
        valueKey: "sis",
        to: isSuper ? "/superadmin/sis" : "/admin",
        format: (s) => `${s?.totalStudents ?? 0} Students`,
      },
      {
        title: "Communication",
        key: "communication",
        valueKey: "communication",
        to: isSuper ? "/superadmin/communication" : "/communication",
        format: (s) => `${(s?.totalNotices ?? 0) + (s?.totalComplaints ?? 0)} Logs`,
      },
      {
        title: isSuper ? "Calendar" : "Admin Calendar",
        key: "calendar",
        valueKey: "calendar",
        to: isSuper ? "/superadmin/calendar" : "/admin/calendar/annual",
        format: (s) => `${s?.totalEvents ?? 0} Events`,
      },
      {
        title: "Admission",
        key: "admission",
        valueKey: "admission",
        to: isSuper ? "/superadmin/admission" : "/admission",
        format: (s) => `${s?.confirmedAdmissions ?? 0} Confirmed`,
      },
      {
        title: isSuper ? "HR" : "HR Module",
        key: "hr",
        valueKey: "hr",
        to: isSuper ? "/superadmin/hr" : "/hr",
        format: (s) => `${s?.totalStaff ?? 0} Staff`,
      },
      {
        title: "Fees",
        key: "fees",
        valueKey: "fees",
        to: isSuper ? "/superadmin/fees" : "/admin/fees",
        format: (s) => `₹${s?.collected ?? 0} Collected`,
      },
    ].filter((m) => canViewModule(m.key));
  }, [isSuper, canViewModule]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`${config.API_BASE_URL}/dashboard/master-stats`);
        if (res.data?.success || res.data?.stats) {
          setStats(res.data.stats || res.data);
        }
      } catch (err) {
        console.error("Error fetching master stats:", err);
        setError(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getAllEvents();
        setEvents(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const upcomingEvents = useMemo(() => {
    return events
      .map((e) => ({
        ...e,
        start: new Date(e.startDate),
        end: new Date(e.endDate),
      }))
      .filter((e) => !isNaN(e.start.getTime()) && isAfter(e.end, new Date()))
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);
  }, [events]);

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-gray-500">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <p className="text-sm font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  const sisStats = stats?.sis || {};
  const commStats = stats?.communication || {};
  const admissionStats = stats?.admission || {};
  const hrStats = stats?.hr || {};

  const studentsByClass = sisStats.studentsByClass || [];
  const genderRatio = sisStats.genderRatio || [];
  const weeklyAttendance = (sisStats.weeklyAttendance || []).filter(
    (d) => d && d.value !== null && d.value !== undefined
  );

  const commData = [
    { name: "Notices", value: commStats.totalNotices || 0 },
    { name: "Complaints", value: commStats.totalComplaints || 0 },
    { name: "Messages", value: commStats.totalMessages || 0 },
  ];

  const admissionFunnel = [
    { name: "Enquiries", value: admissionStats.totalEnquiries || 0 },
    { name: "Applications", value: admissionStats.totalApplications || 0 },
    { name: "Selected", value: admissionStats.selectedStudents || 0 },
    { name: "Confirmed", value: admissionStats.confirmedAdmissions || 0 },
  ];

  const hrBreakdown = [
    { name: "Teaching", value: hrStats.teachingStaff || 0 },
    { name: "Non-Teaching", value: hrStats.nonTeachingStaff || 0 },
    { name: "Support", value: hrStats.supportStaff || 0 },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* ================= TOP METRIC CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topModules.map((m) => (
          <Link
            key={m.key}
            to={m.to}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">
              {m.title}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {m.format(stats?.[m.valueKey])}
            </div>
          </Link>
        ))}
      </div>

      {/* ================= SIS OVERVIEW SECTION ================= */}
      {canViewModule("sis") && (
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span>Student Information Overview</span>
            <Link
              to={isSuper ? "/superadmin/sis/students" : "/admin/students"}
              className="text-xs text-indigo-600 hover:underline font-normal"
            >
              View Directory &rarr;
            </Link>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Students by class */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-2">Class Distribution</span>
              <div className="w-full h-48">
                {studentsByClass.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentsByClass}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {studentsByClass.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No class data
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Attendance */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-2">Weekly Attendance (%)</span>
              <div className="w-full h-48">
                {weeklyAttendance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyAttendance}>
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No attendance logs
                  </div>
                )}
              </div>
            </div>

            {/* Gender Ratio */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-gray-500 mb-2">Gender Ratio</span>
              <div className="w-full h-48">
                {genderRatio.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderRatio}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {genderRatio.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No demographic data
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= SECONDARY OPERATIONS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Communication Activity */}
        {canViewModule("communication") && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex justify-between">
              <span>Communication Logs</span>
              <Link
                to={isSuper ? "/superadmin/communication" : "/communication/notices"}
                className="text-xs text-indigo-600 hover:underline font-normal"
              >
                Notices &rarr;
              </Link>
            </h3>
            <div className="w-full h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Admission Funnel */}
        {canViewModule("admission") && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex justify-between">
              <span>Admission Intake Funnel</span>
              <Link
                to={isSuper ? "/superadmin/admission" : "/admission"}
                className="text-xs text-indigo-600 hover:underline font-normal"
              >
                Pipeline &rarr;
              </Link>
            </h3>
            <div className="w-full h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionFunnel}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* HR Staff Breakdown */}
        {canViewModule("hr") && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex justify-between">
              <span>HR & Staff Composition</span>
              <Link
                to={isSuper ? "/superadmin/hr/staff-directory" : "/hr/staff-directory"}
                className="text-xs text-indigo-600 hover:underline font-normal"
              >
                Staff &rarr;
              </Link>
            </h3>
            <div className="w-full h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hrBreakdown}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {hrBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ================= CALENDAR & UPCOMING EVENTS ================= */}
      {canViewModule("calendar") && (
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Upcoming Academic Events</h3>
            <Link
              to={isSuper ? "/superadmin/calendar" : "/admin/calendar/annual"}
              className="text-xs text-indigo-600 hover:underline"
            >
              Full Calendar &rarr;
            </Link>
          </div>

          {eventsLoading ? (
            <div className="py-6 text-center text-xs text-gray-400">Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No upcoming events scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt._id || evt.id || evt.title}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {evt.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(evt.start, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded-full">
                    {evt.category || "Academic"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

