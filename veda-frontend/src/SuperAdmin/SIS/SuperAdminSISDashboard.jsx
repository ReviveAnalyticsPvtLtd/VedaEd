import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../../config";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SuperAdminSISDashboard() {
  const [loading, setLoading] = useState(true);

  const [dashboardStats, setDashboardStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    activeStudents: 0,
    sections: 0,
  });

  const [studentChartData, setStudentChartData] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  const COLORS = [
    "#4F46E5",
    "#3B82F6",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#14B8A6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      const headers = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      // =========================
      // FETCH ALL DATA
      // =========================

      const [
        dashboardRes,
        studentsRes,
        studentStatsRes,
      ] = await Promise.all([
        axios
          .get(
            `${config.API_BASE_URL}/dashboard/stats`,
            headers
          )
          .catch(() => ({ data: {} })),

        axios
          .get(
            `${config.API_BASE_URL}/students`,
            headers
          )
          .catch(() => ({
            data: {
              students: [],
              count: 0,
            },
          })),

        axios
          .get(
            `${config.API_BASE_URL}/students/stats`,
            headers
          )
          .catch(() => ({
            data: {
              stats: {},
            },
          })),
      ]);

      // =========================
      // STUDENTS DATA
      // =========================

      const students =
        studentsRes?.data?.students || [];

      // =========================
      // DASHBOARD STATS
      // =========================

      setDashboardStats({
        students:
          dashboardRes?.data?.students ||
          studentsRes?.data?.count ||
          students.length ||
          0,

        teachers:
          dashboardRes?.data?.teachers || 0,

        classes:
          dashboardRes?.data?.classes || 0,

        sections:
          dashboardRes?.data?.sections || 0,

        activeStudents:
          studentStatsRes?.data?.stats?.activeStudents ||
          students.length ||
          0,
      });

      // =========================
      // STUDENTS BY CLASS
      // =========================

      const classMap = {};

      students.forEach((student) => {
        const className =
          student?.personalInfo?.class || "Unknown";

        if (!classMap[className]) {
          classMap[className] = 0;
        }

        classMap[className] += 1;
      });

      const formattedChartData = Object.keys(
        classMap
      ).map((key) => ({
        name: key,
        value: classMap[key],
      }));

      setStudentChartData(formattedChartData);

      // =========================
      // RECENT STUDENTS
      // =========================

      setRecentStudents(students.slice(0, 5));

      // =========================
      // TEACHER ASSIGNED CLASSES
      // =========================

      try {
        const assignRes = await axios.get(
          `${config.API_BASE_URL}/assignTeachers`,
          headers
        );

        if (assignRes?.data?.success) {
          const assignedClasses =
            assignRes?.data?.data || [];

          const formattedAssignedClasses =
            assignedClasses.map((item) => {
              const className =
                item?.class?.name || "N/A";

              const sectionName =
                item?.section?.name || "";

              const classTeacher =
                item?.classTeacher?.personalInfo?.name ||
                "Not Assigned";

              const studentsCount =
                students.filter(
                  (student) =>
                    student?.personalInfo?.class ===
                      className &&
                    student?.personalInfo?.section ===
                      sectionName
                ).length;

              return {
                id: item._id,
                className,
                sectionName,
                classTeacher,
                studentsCount,
              };
            });

          setTeacherClasses(formattedAssignedClasses);
        }
      } catch (error) {
        console.log(
          "Assign Teacher API Not Found"
        );
      }
    } catch (error) {
      console.error(
        "SuperAdmin SIS Dashboard Fetch Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ========================= */}
      {/* TOP CARDS */}
      {/* ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

        {/* TOTAL STUDENTS */}

        <Link
          to="/superadmin/sis/students"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <p className="text-sm text-gray-500 font-medium">
            Total Students
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {loading
              ? "..."
              : dashboardStats.students}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            Real-time records
          </p>
        </Link>

        {/* TEACHERS */}

        <Link
          to="/superadmin/sis/staff"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <p className="text-sm text-gray-500 font-medium">
            Teachers
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {loading
              ? "..."
              : dashboardStats.teachers}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            Total staff members
          </p>
        </Link>

        {/* CLASSES */}

        <Link
          to="/superadmin/sis/classes-schedules"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <p className="text-sm text-gray-500 font-medium">
            Classes
          </p>

          <h2 className="text-3xl font-bold text-purple-600 mt-2">
            {loading
              ? "..."
              : dashboardStats.classes}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            Active classes
          </p>
        </Link>

        {/* ACTIVE STUDENTS */}

        <Link
          to="/superadmin/sis/students"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <p className="text-sm text-gray-500 font-medium">
            Active Students
          </p>

          <h2 className="text-3xl font-bold text-cyan-600 mt-2">
            {loading
              ? "..."
              : dashboardStats.activeStudents}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            Current active records
          </p>
        </Link>

        {/* OTHERS */}

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">
            Others
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Others
          </p>
        </div>

      </div>

      {/* ========================= */}
      {/* ANALYTICS */}
      {/* ========================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* STUDENT CHART */}

        <div className="bg-white border rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-lg font-semibold">
              Students by Class
            </h2>

            <span className="text-xs text-gray-500">
              {studentChartData.length} Classes
            </span>

          </div>

          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={studentChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {studentChartData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index % COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* RECENT STUDENTS */}

        <div className="bg-white border rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-lg font-semibold">
              Recent Students
            </h2>

            <Link
              to="/superadmin/sis/students"
              className="text-sm text-blue-600"
            >
              View All
            </Link>

          </div>

          <div className="space-y-3">

            {recentStudents.length > 0 ? (
              recentStudents.map((student) => (
                <div
                  key={student._id}
                  className="border rounded-xl p-3 hover:bg-gray-50"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-medium text-sm">
                        {
                          student
                            ?.personalInfo
                            ?.name
                        }
                      </p>

                      <p className="text-xs text-gray-500 mt-1">

                        Class{" "}
                        {
                          student
                            ?.personalInfo
                            ?.class
                        }

                        {" • "}

                        Section{" "}
                        {
                          student
                            ?.personalInfo
                            ?.section
                        }

                      </p>

                    </div>

                    <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">

                      Roll{" "}
                      {
                        student
                          ?.personalInfo
                          ?.rollNo
                      }

                    </div>

                  </div>

                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">
                No Students Found
              </div>
            )}

          </div>

        </div>

        {/* SCHOOL UPDATES */}

        <div className="bg-white border rounded-2xl p-5 shadow-sm">

          <h2 className="text-lg font-semibold mb-4">
            School Updates
          </h2>

          <div className="space-y-4">

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">

              <p className="font-medium text-sm">
                Student Admissions
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Admission records synced
                with dashboard.
              </p>

            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4">

              <p className="font-medium text-sm">
                Teacher Assignments
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Assigned teacher classes
                updated.
              </p>

            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">

              <p className="font-medium text-sm">
                Timetable Module
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Manage schedules from
                timetable panel.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ========================= */}
      {/* ASSIGNED TEACHER CLASSES */}
      {/* ========================= */}

      <div className="bg-white border rounded-2xl p-5 shadow-sm">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold">
            Teacher Assigned Classes
          </h2>

          <Link
            to="/superadmin/sis/classes-schedules"
            className="text-sm text-blue-600"
          >
            Manage
          </Link>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {teacherClasses.length > 0 ? (
            teacherClasses.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 hover:shadow-md transition"
              >

                <div className="flex items-center justify-between">

                  <h3 className="font-semibold text-lg">
                    {item.className}
                    {item.sectionName}
                  </h3>

                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                    {item.studentsCount} Students
                  </span>

                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Class Teacher
                </p>

                <p className="font-medium mt-1">
                  {item.classTeacher}
                </p>

              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">
              No Assigned Classes Found
            </div>
          )}

        </div>

      </div>

      {/* ========================= */}
      {/* BOTTOM SECTION */}
      {/* ========================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* QUICK ACTIONS */}

        <div className="bg-white border rounded-2xl p-5 shadow-sm xl:col-span-2">

          <h2 className="text-lg font-semibold mb-5">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">

            <Link
              to="/superadmin/sis/students"
              className="px-5 py-3 border rounded-xl hover:bg-gray-50 font-medium"
            >
              Add Student
            </Link>

            <Link
              to="/superadmin/sis/staff"
              className="px-5 py-3 border rounded-xl hover:bg-gray-50 font-medium"
            >
              Add Staff
            </Link>

            <Link
              to="/superadmin/sis/classes-schedules"
              className="px-5 py-3 border rounded-xl hover:bg-gray-50 font-medium"
            >
              Assign Teacher
            </Link>

            <Link
              to="/superadmin/sis/classes-schedules"
              className="px-5 py-3 border rounded-xl hover:bg-gray-50 font-medium"
            >
              Manage Timetable
            </Link>

          </div>

        </div>

        {/* ACADEMIC REPORTS */}

        <Link
          to="/superadmin/sis/reports"
          className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >

          <h2 className="text-lg font-semibold">
            Academic Reports
          </h2>

          <p className="text-sm text-gray-500 mt-3">
            Monitor student progress,
            attendance and academic
            performance.
          </p>

          <div className="mt-5 text-blue-600 text-sm font-medium">
            Open Reports →
          </div>

        </Link>

      </div>

    </div>
  );
}