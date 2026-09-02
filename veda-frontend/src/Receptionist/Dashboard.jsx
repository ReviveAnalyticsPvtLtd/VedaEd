import {
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiDollarSign,
  FiBell,
  FiSearch,
  FiTrendingUp,
  FiPrinter,
  FiCamera,
  FiFileText,
} from "react-icons/fi";
import {
 
  FiCreditCard,
  FiClock,
  FiImage,
  FiMapPin,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ReceptionDashboard() {

  /* ================= KPI DATA ================= */

  const stats = [
    { title: "Today's Visitors", value: 32, icon: <FiUsers size={20}/> },
    { title: "New Enquiries", value: 14, icon: <FiUserPlus size={20}/> },
    { title: "Appointments", value: 7, icon: <FiCalendar size={20}/> },
    { title: "Fee Collection", value: "₹68,500", icon: <FiDollarSign size={20}/> },
  ];

  /* ================= CHART DATA ================= */

  const visitorData = [
    { day: "Mon", visitors: 18 },
    { day: "Tue", visitors: 25 },
    { day: "Wed", visitors: 20 },
    { day: "Thu", visitors: 30 },
    { day: "Fri", visitors: 32 },
  ];

  const enquiryData = [
    { month: "Jan", enquiries: 22 },
    { month: "Feb", enquiries: 35 },
    { month: "Mar", enquiries: 29 },
    { month: "Apr", enquiries: 40 },
  ];

  const attendanceData = [
    { name: "Parents", value: 60 },
    { name: "Vendors", value: 25 },
    { name: "Others", value: 15 },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f97316"];

  return (
    <div className="space-y-6">

      {/* 🔷 HEADER WITH GRADIENT */}
      

      {/* 🔷 KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h2 className="text-2xl font-semibold">{item.value}</h2>
              </div>
              <div className="text-indigo-600">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔷 ANALYTICS SECTION */}
      <div className="grid grid-cols-3 gap-4">

        {/* Visitor Trend */}
        <div className="col-span-2 bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Weekly Visitor Trend</h3>
            <FiTrendingUp />
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={visitorData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor Category Pie */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Visitor Category</h3>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={attendanceData}
                dataKey="value"
                outerRadius={80}
                label
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔷 ENQUIRY TREND */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="font-semibold mb-4">Monthly Admission Enquiries</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={enquiryData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="enquiries" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🔷 QUICK ACTION CENTER */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h3 className="font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-4 gap-4 text-sm">

          <button className="flex items-center gap-2 p-3 bg-indigo-500 text-white rounded-lg hover:opacity-90">
            <FiCamera /> Capture Visitor Photo
          </button>

          <button className="flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:opacity-90">
            <FiPrinter /> Print Visitor Slip
          </button>

          <button className="flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:opacity-90">
            <FiSearch /> Global Search
          </button>

          <button className="flex items-center gap-2 p-3 bg-yellow-500 text-white rounded-lg hover:opacity-90">
            <FiFileText /> Generate Receipt
          </button>

        </div>
      </div>

      {/* 🔷 ACTIVITY + NOTIFICATIONS */}
      <div className="grid grid-cols-2 gap-4">

      <div className="bg-white p-5 rounded-xl shadow">
  <h3 className="font-semibold mb-4">Recent Front Office Activity</h3>

  <ul className="space-y-3 text-sm text-gray-600">
    <li className="flex items-center gap-3">
      <FiUsers className="text-blue-600" size={18} />
      <span>Parent visited for Class 6 enquiry</span>
    </li>

    <li className="flex items-center gap-3">
      <FiCreditCard className="text-green-600" size={18} />
      <span>Fee payment received - ₹12,000</span>
    </li>

    <li className="flex items-center gap-3">
      <FiCalendar className="text-indigo-600" size={18} />
      <span>Appointment scheduled with Principal</span>
    </li>

    <li className="flex items-center gap-3">
      <FiCamera className="text-purple-600" size={18} />
      <span>Visitor photo captured</span>
    </li>
  </ul>
</div>

        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="relative">
              <FiBell size={20} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                3
              </span>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-600">
            <li>📌 2 Visitors waiting</li>
            <li>📌 1 Online Enquiry Received</li>
            <li>📌 Staff Meeting at 2 PM</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
