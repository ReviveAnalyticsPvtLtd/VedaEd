import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import api from "../services/apiClient";

/* ================= COLORS ================= */
const COLORS = ["#4F46E5", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444"];

/* ================= DASHBOARD ================= */

export default function SuperAdminMasterDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/master-stats")
      .then((res) => setStats(res.data.stats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-4 bg-gray-100 min-h-screen">
        <p className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 inline-block text-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">

      {/* ===== TOP MODULE CARDS ===== */}
      <div className="grid grid-cols-6 gap-3">
        <TopCard title="Admin SIS" value={`${stats?.sis?.totalStudents ?? 0} Students`} to="/superadmin/admin" />
        <TopCard title="Communication" value={`${(stats?.communication?.totalNotices ?? 0) + (stats?.communication?.totalComplaints ?? 0)} Logs`} to="/superadmin/communication" />
        <TopCard title="Calendar" value={`${stats?.calendar?.totalEvents ?? 0} Events`} to="/superadmin/calendar" />
        <TopCard title="Admission" value={`${stats?.admission?.confirmedAdmissions ?? 0} Confirmed`} to="/superadmin/admission" />
        <TopCard title="HR Module" value={`${stats?.hr?.totalStaff ?? 0} Staff`} to="/superadmin/hr" />
        <TopCard title="Fees" value={`₹${stats?.fees?.collected ?? 0}`} to="/superadmin/fees" />
      </div>

      {/* ===== SIS ===== */}
      <Section title="Student Information System">
        <Grid3>
          <Card title="Students by Class">
            <PieBlock data={stats?.sis?.studentsByClass ?? []} />
          </Card>

          <Card title="Weekly Attendance">
            <BarBlock
              data={[
                { day: "Mon", value: 88 },
                { day: "Tue", value: 92 },
                { day: "Wed", value: 80 },
                { day: "Thu", value: 95 },
                { day: "Fri", value: 86 },
              ]}
              x="day"
            />
          </Card>

          <Card title="Gender Ratio">
            <PieBlock data={stats?.sis?.genderRatio ?? []} />
          </Card>
        </Grid3>
      </Section>

      {/* ===== COMMUNICATION ===== */}
      <Section title="Communication">
        <Grid3>
          <Card title="Activity Count">
            <BarBlock
              data={[
                { name: "Notices", value: stats?.communication?.totalNotices ?? 0 },
                { name: "Complaints", value: stats?.communication?.totalComplaints ?? 0 },
                { name: "Messages", value: stats?.communication?.totalMessages ?? 0 },
              ]}
              x="name"
            />
          </Card>

          <Card title="Quick Access">
            <List>
              <Item to="/superadmin/communication/notices">Notices</Item>
              <Item to="/superadmin/communication/messages">Messages</Item>
              <Item to="/superadmin/communication/complaints">Complaints</Item>
            </List>
          </Card>

          <Card title="Status">
            <Muted>Notices: {stats?.communication?.totalNotices ?? 0}</Muted>
            <Muted>Complaints: {stats?.communication?.totalComplaints ?? 0}</Muted>
            <Muted>Messages: {stats?.communication?.totalMessages ?? 0}</Muted>
          </Card>
        </Grid3>
      </Section>

      {/* ===== CALENDAR ===== */}
      <Section title="Calendar">
        <Grid3>
          <Card title="Events Summary">
            <Big>{stats?.calendar?.totalEvents ?? 0}</Big>
            <Muted>Total Events</Muted>
            <LinkText to="/superadmin/calendar">Open Calendar</LinkText>
          </Card>
        </Grid3>
      </Section>

      {/* ===== ADMISSION ===== */}
      <Section title="Admission">
        <Grid3>
          <Card title="Admission Funnel">
            <PieBlock
              data={[
                { name: "Enquiry", value: stats?.admission?.totalEnquiries ?? 0 },
                { name: "Applied", value: stats?.admission?.totalApplications ?? 0 },
                { name: "Confirmed", value: stats?.admission?.confirmedAdmissions ?? 0 },
              ]}
            />
          </Card>

          <Card title="Overview">
            <Muted>Enquiries: {stats?.admission?.totalEnquiries ?? 0}</Muted>
            <Muted>Applications: {stats?.admission?.totalApplications ?? 0}</Muted>
            <Muted>Confirmed: {stats?.admission?.confirmedAdmissions ?? 0}</Muted>
            <LinkText to="/superadmin/admission">Open Admission</LinkText>
          </Card>
        </Grid3>
      </Section>

    </div>
  );
}

/* ================= REUSABLE ================= */

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