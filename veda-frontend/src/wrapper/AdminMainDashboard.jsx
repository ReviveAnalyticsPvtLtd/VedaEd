import { useState, useEffect, useMemo } from "react";
import api from "../services/apiClient";
import { Link } from "react-router-dom";
import config from "../config";
import { canViewModule } from "../utils/adminPermissions";
import { getAllEvents } from "../services/calendarAPI";
import { format, isAfter } from "date-fns";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ================= COLORS ================= */
const COLORS = ["#4F46E5", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444"];

/* ================= DASHBOARD ================= */

const TOP_MODULES = [
  { title: "Admin SIS", key: "Admin SIS", valueKey: "sis", path: "/admin", format: (s) => `${s?.totalStudents || 0} Students` },
  { title: "Communication", key: "Communication", valueKey: "communication", path: "/communication", format: (s) => `${s?.totalLogs || 0} Logs` },
  { title: "Calendar", key: "Admin Calendar", valueKey: "calendar", path: "/admin/calendar/annual", format: (s) => `${s?.totalEvents || 0} Events` },
  { title: "Admission", key: "Admission", valueKey: "admission", path: "/admission", format: (s) => `${s?.confirmedAdmissions || 0} Confirmed` },
  { title: "HR Module", key: "HR Module", valueKey: "hr", path: "/hr", format: (s) => `${s?.totalStaff || 0} Staff` },
  { title: "Fees", key: "Fees", valueKey: "fees", path: "/admin/fees", format: (s) => `₹${s?.collected || 0} Collected` },
];

export default function AdminMasterDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const visibleTopModules = useMemo(() => TOP_MODULES.filter((m) => canViewModule(m.key)), []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`${config.API_BASE_URL}/dashboard/master-stats`);
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Error fetching master stats:", err);
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

  // Only events that have not finished yet, soonest first.
  const UPCOMING_EVENTS = useMemo(
    () =>
      events
        .map((e) => ({ ...e, start: new Date(e.startDate), end: new Date(e.endDate) }))
        .filter((e) => !isNaN(e.start) && isAfter(e.end, new Date()))
        .sort((a, b) => a.start - b.start)
        .slice(0, 5),
    [events]
  );

  if (loading) {
    return <div className="p-4 text-center">Loading Dashboard...</div>;
  }

  // Fallback / Formatted data
  const sisStats = stats?.sis || {};
  const commStats = stats?.communication || {};
  const admissionStats = stats?.admission || {};
  const hrStats = stats?.hr || {};

  const STUDENTS_BY_CLASS = sisStats.studentsByClass || [];
  const GENDER_RATIO = sisStats.genderRatio || [];

  const ATTENDANCE_TREND = (sisStats.weeklyAttendance || []).filter(
    (d) => d.value !== null && d.value !== undefined
  );

  const COMM_STATS = [
    { name: "Notices", value: commStats.totalNotices || 0 },
    { name: "Complaints", value: commStats.totalComplaints || 0 },
    { name: "Messages", value: commStats.totalMessages || 0 },
  ];

  const ADMISSION_FUNNEL = [
    { name: "Enquiry", value: admissionStats.totalEnquiries || 0 },
    { name: "Applied", value: admissionStats.totalApplications || 0 },
    { name: "Confirmed", value: admissionStats.confirmedAdmissions || 0 },
  ];

  return (
    <div className="p-0 space-y-2 bg-gray-100 min-h-screen">

      {/* ===== TOP MAJOR MODULES ===== */}
      <div className="grid grid-cols-6 gap-3">
        {visibleTopModules.map((mod) => {
          const statBlock =
            mod.valueKey === "sis"
              ? sisStats
              : mod.valueKey === "communication"
                ? commStats
                : mod.valueKey === "calendar"
                  ? { totalEvents: UPCOMING_EVENTS.length }
                  : mod.valueKey === "admission"
                    ? admissionStats
                    : mod.valueKey === "hr"
                      ? hrStats
                      : stats?.fees;
          return (
            <TopCard
              key={mod.title}
              title={mod.title}
              value={mod.format(statBlock)}
              to={mod.path}
            />
          );
        })}
      </div>

      {/* ===== SIS ===== */}
      <Section title="Student Information System">
        <Grid3>
          <Card title="Students by Class">
            {STUDENTS_BY_CLASS.length > 0 ? <PieBlock data={STUDENTS_BY_CLASS} /> : <div className="h-44 flex items-center justify-center text-gray-400">No data</div>}
          </Card>

          <Card title="Weekly Attendance">
            {ATTENDANCE_TREND.length > 0 ? <BarBlock data={ATTENDANCE_TREND} x="day" /> : <div className="h-44 flex items-center justify-center text-gray-400">No attendance data</div>}
          </Card>

          <Card title="Gender Ratio">
            {GENDER_RATIO.length > 0 ? <PieBlock data={GENDER_RATIO} /> : <div className="h-44 flex items-center justify-center text-gray-400">No data</div>}
          </Card>
        </Grid3>
      </Section>

      {/* ===== COMMUNICATION ===== */}
      <Section title="Communication">
        <Grid3>
          <Card title="Communication Count">
            <BarBlock data={COMM_STATS} x="name" />
          </Card>

          <Card title="Quick Access">
            <List>
              <Item to="/communication/notices">Notices ({commStats.totalNotices || 0})</Item>
              <Item to="/communication/messages">Messages ({commStats.totalMessages || 0})</Item>
              <Item to="/communication/complaints">Complaints ({commStats.totalComplaints || 0})</Item>
              <Item to="/communication/logs">Logs ({commStats.totalLogs || 0})</Item>
            </List>
          </Card>

          <Card title="Module Status">
            <div className="space-y-2">
                <p className="text-sm">Notices: <span className="font-bold text-green-600">{commStats.totalNotices || 0}</span></p>
                <p className="text-sm">Complaints: <span className="font-bold text-red-600">{commStats.totalComplaints || 0}</span></p>
            </div>
          </Card>
        </Grid3>
      </Section>

      {/* ===== CALENDAR ===== */}
      <Section title="Calendar">
        <Grid3>
          <Card title="Upcoming Events">
            {eventsLoading ? (
              <Muted>Loading events...</Muted>
            ) : UPCOMING_EVENTS.length === 0 ? (
              <Muted>No upcoming events</Muted>
            ) : (
              UPCOMING_EVENTS.map((ev) => (
                <div key={ev._id} className="mb-2 last:mb-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{ev.title}</span>{" "}
                    <span className="text-gray-500">– {format(ev.start, "d MMM yyyy")}</span>
                  </p>
                  {ev.type && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {ev.type}
                    </span>
                  )}
                </div>
              ))
            )}
            <LinkText to="/admin/calendar/annual" className="mt-2 block">Open Calendar</LinkText>
          </Card>

          <Card title="Event Summary">
              <Big>{UPCOMING_EVENTS.length}</Big>
              <Muted>Upcoming Events</Muted>
          </Card>
        </Grid3>
      </Section>

      {/* ===== FEES ===== */}
      <Section title="Fees & Finance">
        <Grid3>
          <Card title="Collection Summary">
            <Muted>Collected: ₹{stats?.fees?.collected || 0}</Muted>
            <Muted>Pending: ₹{stats?.fees?.pending || 0}</Muted>
            <LinkText to="/admin/fees">Go to Fees</LinkText>
          </Card>
        </Grid3>
      </Section>

      {/* ===== ADMISSION ===== */}
      <Section title="Admission">
        <Grid3>
          <Card title="Admission Funnel">
            <PieBlock data={ADMISSION_FUNNEL} />
          </Card>

          <Card title="Status">
            <Muted>New Enquiries: {admissionStats.totalEnquiries || 0}</Muted>
            <Muted>Applications: {admissionStats.totalApplications || 0}</Muted>
            <Muted>Confirmed: {admissionStats.confirmedAdmissions || 0}</Muted>
            <LinkText to="/admission">Open Admission</LinkText>
          </Card>

          <Card title="Quick Links">
              <List>
                  <Item to="/admission/admission-enquiry">Enquiries</Item>
                  <Item to="/admission/application-list">Applications</Item>
              </List>
          </Card>
        </Grid3>
      </Section>

    </div>
  );
}

/* REUSABLE  */

const TopCard = ({ title, value, to }) => (
  <Link to={to} className="bg-white p-4 rounded-xl shadow hover:shadow-md">
    <p className="text-sm text-indigo-600">{title}</p>
    <p className="font-bold text-lg">{value}</p>
  </Link>
);

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </section>
);

const Grid3 = ({ children }) => (
  <div className="grid grid-cols-3 gap-4">{children}</div>
);

const Card = ({ title, children }) => (
  <div className="bg-white p-4 rounded-xl shadow">
    <h3 className="font-medium mb-3">{title}</h3>
    {children}
  </div>
);

const PieBlock = ({ data }) => (
  <div className="h-44">
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" outerRadius={70}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
);

const BarBlock = ({ data, x }) => (
  <div className="h-44">
    <ResponsiveContainer>
      <BarChart data={data}>
        <XAxis dataKey={x} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const List = ({ children }) => <div className="space-y-2">{children}</div>;

const Item = ({ to, children }) => (
  <Link to={to} className="block text-blue-600 hover:underline">
    {children}
  </Link>
);

const Big = ({ children }) => (
  <div className="text-4xl font-bold text-indigo-600">{children}</div>
);

const Muted = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

const LinkText = ({ to, className = "", children }) => (
  <Link to={to} className={`text-sm text-blue-600 underline ${className}`}>
    {children}
  </Link>
);
