import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config";
import { canViewModule } from "../utils/adminPermissions";
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
  { title: "Communication", key: "Communication", valueKey: "communication", path: "/communication", format: (s) => `${((s?.totalNotices || 0) + (s?.totalComplaints || 0))} Logs` },
  { title: "Calendar", key: "Admin Calendar", valueKey: "calendar", path: "/admincalendar", format: (s) => `${s?.totalEvents || 0} Events` },
  { title: "Admission", key: "Admission", valueKey: "admission", path: "/admission", format: (s) => `${s?.confirmedAdmissions || 0} Confirmed` },
  { title: "HR Module", key: "HR Module", valueKey: "hr", path: "/hr", format: (s) => `${s?.totalStaff || 0} Staff` },
  { title: "Fees", key: "Fees", valueKey: "fees", path: "/fees", format: (s) => `₹${s?.collected || 0} Collected` },
];

export default function AdminMasterDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const visibleTopModules = useMemo(() => TOP_MODULES.filter((m) => canViewModule(m.key)), []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/dashboard/master-stats`);
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
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">

      {/* ===== TOP MAJOR MODULES ===== */}
      <div className="grid grid-cols-6 gap-3">
        {visibleTopModules.map((mod) => {
          const statBlock =
            mod.valueKey === "sis"
              ? sisStats
              : mod.valueKey === "communication"
                ? commStats
                : mod.valueKey === "calendar"
                  ? stats?.calendar
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
            <BarBlock data={[ {day: 'Mon', value: 85}, {day: 'Tue', value: 90}, {day: 'Wed', value: 75}, {day: 'Thu', value: 95}, {day: 'Fri', value: 80} ]} x="day" />
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
            <Muted>• PTM – 18 Feb</Muted>
            <Muted>• Annual Day – 25 Feb</Muted>
            <Muted>• Exam – 5 Mar</Muted>
            <LinkText to="/admincalendar">Open Calendar</LinkText>
          </Card>

          <Card title="Event Summary">
              <Big>{stats?.calendar?.totalEvents || 0}</Big>
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
            <LinkText to="/fees">Go to Fees</LinkText>
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
                  <Item to="/admission/enquiry">Enquiries</Item>
                  <Item to="/admission/application">Applications</Item>
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

const LinkText = ({ to, children }) => (
  <Link to={to} className="text-sm text-blue-600 underline">
    {children}
  </Link>
);
