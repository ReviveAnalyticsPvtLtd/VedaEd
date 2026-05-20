import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";

/* ================= COLORS ================= */
const COLORS = ["#4F46E5", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444"];

/* ================= DUMMY DATA ================= */

const SIS = {
  totalStudents: 1240,
  studentsByClass: [
    { name: "Class 1", value: 120 },
    { name: "Class 2", value: 150 },
    { name: "Class 3", value: 180 },
    { name: "Class 4", value: 200 },
  ],
  genderRatio: [
    { name: "Boys", value: 680 },
    { name: "Girls", value: 560 },
  ],
};

const COMMUNICATION = {
  totalNotices: 18,
  totalComplaints: 6,
  totalMessages: 142,
};

const ADMISSION = {
  totalEnquiries: 210,
  totalApplications: 140,
  confirmedAdmissions: 92,
};

const HR = {
  totalStaff: 86,
};

const CALENDAR = {
  totalEvents: 14,
};

const FEES = {
  collected: 1250000,
};

/* ================= DASHBOARD ================= */

export default function SuperAdminMasterDashboard() {
  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">

      {/* ===== TOP MODULE CARDS ===== */}
      <div className="grid grid-cols-6 gap-3">
        <TopCard title="Admin SIS" value={`${SIS.totalStudents} Students`} to="/superadmin/admin" />
        <TopCard title="Communication" value={`${COMMUNICATION.totalNotices + COMMUNICATION.totalComplaints} Logs`} to="/superadmin/communication" />
        <TopCard title="Calendar" value={`${CALENDAR.totalEvents} Events`} to="/superadmin/calendar" />
        <TopCard title="Admission" value={`${ADMISSION.confirmedAdmissions} Confirmed`} to="/superadmin/admission" />
        <TopCard title="HR Module" value={`${HR.totalStaff} Staff`} to="/superadmin/hr" />
        <TopCard title="Fees" value={`₹${FEES.collected}`} to="/superadmin/fees" />
      </div>

      {/* ===== SIS ===== */}
      <Section title="Student Information System">
        <Grid3>
          <Card title="Students by Class">
            <PieBlock data={SIS.studentsByClass} />
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
            <PieBlock data={SIS.genderRatio} />
          </Card>
        </Grid3>
      </Section>

      {/* ===== COMMUNICATION ===== */}
      <Section title="Communication">
        <Grid3>
          <Card title="Activity Count">
            <BarBlock
              data={[
                { name: "Notices", value: COMMUNICATION.totalNotices },
                { name: "Complaints", value: COMMUNICATION.totalComplaints },
                { name: "Messages", value: COMMUNICATION.totalMessages },
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
            <Muted>Notices: {COMMUNICATION.totalNotices}</Muted>
            <Muted>Complaints: {COMMUNICATION.totalComplaints}</Muted>
            <Muted>Messages: {COMMUNICATION.totalMessages}</Muted>
          </Card>
        </Grid3>
      </Section>

      {/* ===== CALENDAR ===== */}
      <Section title="Calendar">
        <Grid3>
          <Card title="Events Summary">
            <Big>{CALENDAR.totalEvents}</Big>
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
                { name: "Enquiry", value: ADMISSION.totalEnquiries },
                { name: "Applied", value: ADMISSION.totalApplications },
                { name: "Confirmed", value: ADMISSION.confirmedAdmissions },
              ]}
            />
          </Card>

          <Card title="Overview">
            <Muted>Enquiries: {ADMISSION.totalEnquiries}</Muted>
            <Muted>Applications: {ADMISSION.totalApplications}</Muted>
            <Muted>Confirmed: {ADMISSION.confirmedAdmissions}</Muted>
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