import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
} from "react-icons/fi";
import axios from "axios";
import config from "../../config";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function SuperAdminAdmissionDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("6months");
  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState([]);
  const [applications, setApplications] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [entranceRecords, setEntranceRecords] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [enquiryRes, applicationRes, vacancyRes, entranceRes, studentsRes] =
          await Promise.allSettled([
            axios.get(`${config.API_BASE_URL}/admission-enquiry`),
            axios.get(`${config.API_BASE_URL}/admission/application`),
            axios.get(`${config.API_BASE_URL}/admission/vacancy`),
            axios.get(`${config.API_BASE_URL}/admission/entrance-exam`),
            axios.get(`${config.API_BASE_URL}/students`),
          ]);

        if (enquiryRes.status === "fulfilled") {
          setEnquiries(Array.isArray(enquiryRes.value.data) ? enquiryRes.value.data : []);
        }

        if (applicationRes.status === "fulfilled") {
          setApplications(applicationRes.value.data?.data || []);
        }

        if (vacancyRes.status === "fulfilled") {
          setVacancies(vacancyRes.value.data?.data || []);
        }

        if (entranceRes.status === "fulfilled") {
          setEntranceRecords(entranceRes.value.data?.data || []);
        }

        if (studentsRes.status === "fulfilled") {
          const studentPayload = studentsRes.value.data;
          const studentsList = Array.isArray(studentPayload)
            ? studentPayload
            : studentPayload?.data || [];
          setTotalStudents(Array.isArray(studentsList) ? studentsList.length : 0);
        }
      } catch (error) {
        console.error("Failed to load admission dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const normalizedStatus = (statusValue) => String(statusValue || "").toLowerCase();
  const pendingCount = applications.filter(
    (a) => normalizedStatus(a.applicationStatus) === "pending"
  ).length;
  const rejectedCount = applications.filter(
    (a) => normalizedStatus(a.applicationStatus) === "rejected"
  ).length;
  const selectedCount = applications.filter(
    (a) => normalizedStatus(a.applicationStatus) === "approved"
  ).length;
  const verifiedDocCount = applications.filter(
    (a) => normalizedStatus(a.documentVerificationStatus) === "verified"
  ).length;
  const qualifiedCount = entranceRecords.filter(
    (x) => normalizedStatus(x.result) === "qualified"
  ).length;

  /* ===================== STATS ===================== */
  const stats = [
    { title: "Admission Enquiries", value: enquiries.length, icon: <FiBookOpen size={20} /> },
    { title: "Total Applications", value: applications.length, icon: <FiFileText size={20} /> },
    { title: "Selected Students", value: selectedCount, icon: <FiUserCheck size={20} /> },
    { title: "Documents Verified", value: verifiedDocCount, icon: <FiCheckCircle size={20} /> },
    { title: "Entrance Qualified", value: qualifiedCount, icon: <FiTrendingUp size={20} /> },
    { title: "Pending Applications", value: pendingCount, icon: <FiClock size={20} /> },
    { title: "Rejected", value: rejectedCount, icon: <FiAlertCircle size={20} /> },
    { title: "Total Students", value: totalStudents, icon: <FiUsers size={20} /> },
  ];

  /* ===================== MONTHLY DATA ===================== */
  const monthlyData = useMemo(() => {
    const monthCount = dateRange === "1year" ? 12 : 6;
    const now = new Date();
    const bucketKeys = [];
    const bucketMap = {};

    for (let i = monthCount - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      bucketKeys.push(key);
      bucketMap[key] = {
        month: d.toLocaleString("en-US", { month: "short" }),
        enquiries: 0,
        applications: 0,
      };
    }

    enquiries.forEach((entry) => {
      if (!entry?.createdAt) return;
      const d = new Date(entry.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (bucketMap[key]) bucketMap[key].enquiries += 1;
    });

    applications.forEach((entry) => {
      if (!entry?.createdAt) return;
      const d = new Date(entry.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (bucketMap[key]) bucketMap[key].applications += 1;
    });

    return bucketKeys.map((k) => bucketMap[k]);
  }, [applications, enquiries, dateRange]);

  /* ===================== PIE STATUS DATA ===================== */
  const statusData = [
    { name: "Selected", value: selectedCount },
    { name: "Pending", value: pendingCount },
    { name: "Rejected", value: rejectedCount },
  ];
  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  /* ===================== CLASS VACANCY ===================== */
  const vacancyData = vacancies.map((item) => ({
    class: item.className || "N/A",
    seats: Number(item.totalSeats || 0),
    filled: Math.max(0, Number(item.totalSeats || 0) - Number(item.availableSeats || 0)),
  }));

  /* ===================== RECENT APPLICATIONS ===================== */
  const recentApplications = applications.slice(0, 8).map((app) => ({
    id: app.applicationId || app._id,
    name: app.personalInfo?.name || "-",
    classApplied: app.personalInfo?.classApplied || app.earlierAcademic?.lastClass || "-",
    status: app.applicationStatus || "Pending",
  }));

  return (
    <div className="p-0 m-0 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
         
        </h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last 1 Year</option>
        </select>
      </div>

      {/* ===================== STAT CARDS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl border border-gray-200"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">{item.title}</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-1">
                  {item.value}
                </h2>
              </div>
              <div className="text-gray-400">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===================== CHART SECTION ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">
            Monthly Enquiries & Applications
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enquiries" fill="#6366f1" />
                <Bar dataKey="applications" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-semibold mb-4">Application Status</h2>
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===================== CLASS VACANCY ===================== */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <h2 className="font-semibold mb-4">Class-wise Seat Vacancy</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vacancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="seats" fill="#94a3b8" />
              <Bar dataKey="filled" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===================== APPLICATION TABLE ===================== */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="font-semibold mb-4">Application List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-3">ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 text-center text-gray-500" colSpan={4}>
                    Loading applications...
                  </td>
                </tr>
              ) : recentApplications.length === 0 ? (
                <tr>
                  <td className="py-3 text-center text-gray-500" colSpan={4}>
                    No applications found
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{app.id}</td>
                  <td>{app.name}</td>
                  <td>{app.classApplied}</td>
                  <td className="font-medium">{app.status}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
