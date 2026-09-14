import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import {
  FiBookOpen,
  FiUser,
  FiClock,
  FiArrowLeft,
  FiFileText,
  FiStar,
  FiFolder,
  FiAlertCircle,
  FiLayers,
  FiCheckCircle,
  FiInbox,
} from "react-icons/fi";

import HelpInfo from "../components/HelpInfo";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ASSIGNMENT_STATUS_COLORS = {
  Active: "text-green-600",
  "Pending Review": "text-yellow-600",
  "Late Submission": "text-red-500",
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

export default function ParentClasses() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0 });
  const [childName, setChildName] = useState("My Child");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId || !token) {
          if (active) {
            setError("You need to be logged in to view classes.");
            setLoading(false);
          }
          return;
        }

        const authHeaders = { Authorization: `Bearer ${token}` };
        const base = config.API_BASE_URL;

        const parentRes = await axios.get(`${base}/parents/${user.refId}`, { headers: authHeaders });
        const parent = parentRes.data && parentRes.data.parent;
        const children = parent && parent.children ? parent.children : [];

        if (children.length === 0) {
          if (active) {
            setError("No child records found.");
            setLoading(false);
          }
          return;
        }

        const child = children[0];
        const childId = child._id;
        if (!childId) {
          if (active) {
            setError("Could not identify your child's record. Please try again.");
            setLoading(false);
          }
          return;
        }
        const clsRef = child.personalInfo && child.personalInfo.class;
        const childClassId = clsRef && typeof clsRef === "object" ? clsRef._id : clsRef;

        if (active) {
          setChildName(child.personalInfo?.name || child.name || "My Child");
        }

        const [tt, asg, att, mat, ntc] = await Promise.allSettled([
          axios.get(`${base}/timetables?studentId=${childId}`, { headers: authHeaders }),
          axios.get(`${base}/assignments?studentId=${childId}`, { headers: authHeaders }),
          axios.get(`${base}/attendance/student/${childId}`, { headers: authHeaders }),
          childClassId
            ? axios.get(`${base}/curriculum/study-materials/student?classId=${childClassId}`, { headers: authHeaders })
            : Promise.reject(new Error("Child has no class assigned")),
          axios.get(`${base}/communication/notices/published/${user.refId}/Parent`, { headers: authHeaders }),
        ]);

        const timetableRows =
          tt.status === "fulfilled" && tt.value.data && Array.isArray(tt.value.data.data)
            ? tt.value.data.data
            : [];
        const assignmentList =
          asg.status === "fulfilled" && Array.isArray(asg.value.data) ? asg.value.data : [];
        const attendanceList =
          att.status === "fulfilled" && att.value.data && Array.isArray(att.value.data.data)
            ? att.value.data.data
            : [];
        const materialsList =
          mat.status === "fulfilled" && mat.value.data && Array.isArray(mat.value.data.data)
            ? mat.value.data.data
            : [];
        const notices =
          ntc.status === "fulfilled" && ntc.value.data && Array.isArray(ntc.value.data.data)
            ? ntc.value.data.data
            : [];

        const announcements = notices.map((n) => ({
          msg: n.title,
          content: n.content,
          date: formatDate(n.publishDate),
        }));

        const bySubject = {};
        timetableRows.forEach((entry) => {
          const subjectId = entry.subject?._id || entry.subject?.subjectName || "unknown";
          if (!bySubject[subjectId]) bySubject[subjectId] = [];
          bySubject[subjectId].push(entry);
        });

        const built = Object.values(bySubject).map((entries) => {
          const first = entries[0];
          const subj = first.subject || {};
          const subjectId = subj._id;
          const days = DAY_ORDER.filter((d) => entries.some((e) => e.day === d));
          const timeRange = days.length
            ? `${formatTime(entries[0].timeFrom)}–${formatTime(entries[0].timeTo)}`
            : "";
          const subjectAssignments = assignmentList
            .filter(
              (a) =>
                subjectId &&
                a.subject &&
                String(a.subject._id || a.subject) === String(subjectId)
            )
            .map((a) => ({
              title: a.title,
              type: a.assignmentType || "Homework",
              due: formatDate(a.dueDate),
              status: a.status || "Active",
            }));
          const subjectMaterials = materialsList.filter(
            (m) =>
              subjectId &&
              m.subject &&
              String(m.subject._id || m.subject) === String(subjectId)
          );

          return {
            id: subjectId || entries[0]._id,
            name: subj.subjectName || "Subject",
            subtitle: [subj.subjectCode, subj.type].filter(Boolean).join(" • "),
            teacher: first.teacher?.personalInfo?.name || "Not assigned",
            time: days.length ? `${days.join(", ")} | ${timeRange}` : "Schedule not set",
            room: first.roomNo || "N/A",
            periodsPerWeek: entries.length,
            overview: `${
              subj.subjectName || "This subject"
            }${subj.subjectCode ? ` (Code: ${subj.subjectCode})` : ""} — ${entries.length} period(s) per week on ${
              days.join(", ") || "scheduled days"
            }.`,
            materials: subjectMaterials.map((m) => ({
              title: m.title || m.files?.[0]?.fileName || "Study material",
              type: m.files?.[0]?.fileType || "file",
            })),
            assignments: subjectAssignments,
            announcements,
          };
        });

        if (active) {
          setClasses(built);
          setAttendance({
            present: attendanceList.filter((r) => r.status === "Present").length,
            absent: attendanceList.filter((r) => r.status === "Absent").length,
          });
        }
      } catch (err) {
        console.error("Error fetching child classes:", err);
        if (active) {
          setError("Could not load class data. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const DetailView = ({ cls }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <button
        onClick={() => setSelectedClass(null)}
        className="flex items-center gap-2 mb-5 text-blue-600 hover:underline"
      >
        <FiArrowLeft /> Back to Classes
      </button>

      <h2 className="text-3xl font-semibold flex items-center gap-2">
        <FiBookOpen /> {cls.name}
      </h2>

      {cls.subtitle && <p className="text-gray-500 mt-1">{cls.subtitle}</p>}

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiUser /> Teacher: {cls.teacher}
      </p>

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiClock /> {cls.time}
      </p>

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiLayers /> {cls.room}
      </p>

      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
          <FiAlertCircle /> Class Overview
        </h3>
        <p className="text-gray-700">{cls.overview}</p>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiFolder /> Study Materials
        </h3>

        {cls.materials.length > 0 ? (
          cls.materials.map((m, i) => (
            <div key={i} className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-gray-500 text-sm">{m.type.toUpperCase()}</p>
              </div>
              <FiFileText className="text-lg" />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No study materials uploaded yet.</p>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiBookOpen /> Assignments
        </h3>

        {cls.assignments.length > 0 ? (
          cls.assignments.map((a, i) => (
            <div key={i} className="border-b py-2">
              <p className="font-medium">{a.title}</p>
              <p className="text-gray-500 text-sm">
                {a.type} • Due: {a.due}
              </p>
              <p
                className={`text-sm mt-1 ${
                  ASSIGNMENT_STATUS_COLORS[a.status] || "text-gray-600"
                }`}
              >
                Status: {a.status}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No assignments yet.</p>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiCheckCircle /> Attendance
        </h3>

        <p>Present: {attendance.present}</p>
        <p>Absent: {attendance.absent}</p>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiAlertCircle /> Announcements
        </h3>

        {cls.announcements.length > 0 ? (
          cls.announcements.map((n, i) => (
            <div key={i} className="border-b py-2">
              <p className="font-medium">{n.msg}</p>
              <p className="text-gray-500 text-sm">{n.content}</p>
              <p className="text-gray-400 text-xs mt-1">Date: {n.date}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No announcements yet.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Child's Classes</h2>

        <HelpInfo
          title="My Child's Classes"
          description={`4.1 My Child's Classes (Class Overview)

View all the classes your child is currently enrolled in, along with teacher details, timings, and classroom information.

Sections:
- Class Cards: Displays each subject/class with complete details
- Teacher Information: Shows the name of the assigned teacher
- Class Timings: Day-wise schedule with start and end time
- Room / Lab Information: Displays the room or lab assigned for the class
- View Class Button: Open detailed class information, syllabus, and learning materials
`}
          steps={[
            "Browse all subjects your child is enrolled in",
            "Check teacher name, class timing, and room details",
            "Identify daily schedule and subject timings",
            "Click 'View Class' to see detailed class information",
            "Use the page to track your child's academic schedule",
          ]}
        />
      </div>

      {loading ? (
        <div className="bg-white p-3 rounded-lg shadow-sm border text-center text-gray-500">
          Loading classes for {childName}...
        </div>
      ) : error ? (
        <div className="bg-white p-3 rounded-lg shadow-sm border text-center text-gray-500">
          {error}
        </div>
      ) : !selectedClass ? (
        <div className="bg-white p-3 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            Classes List {childName !== "My Child" ? `for ${childName}` : ""}
          </h3>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="bg-gray-50 rounded-xl border p-5 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <FiBookOpen className="text-blue-600" />
                    <FiStar className="text-gray-400" />
                  </div>

                  <h3 className="font-semibold mt-3">{cls.name}</h3>
                  {cls.subtitle && (
                    <p className="text-gray-500 text-sm mt-1">{cls.subtitle}</p>
                  )}

                  <p className="text-gray-600 text-base mt-1 flex items-center gap-2">
                    <FiUser /> {cls.teacher}
                  </p>

                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <FiClock /> {cls.time}
                  </p>

                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <FiLayers /> {cls.room}
                  </p>

                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                    View Class
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
              <FiInbox className="text-3xl" />
              <p>No classes scheduled for your child yet.</p>
            </div>
          )}
        </div>
      ) : (
        <DetailView cls={selectedClass} />
      )}
    </div>
  );
}