import React, { useState, useEffect } from "react";
import { Link, useParams , useNavigate } from "react-router-dom";
import config from "../../../config";

const SuperAdminSISClassDetailPage = () => {
  const navigate = useNavigate();
  const { classId, sectionId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch class details from backend
  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await fetch(
          `${config.API_BASE_URL}/classes/${classId}/sections/${sectionId}`
        );
        const data = await response.json();
        if (data.success) {
          setClassInfo(data.data);
        }
      } catch (error) {
        console.error("Error fetching class details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId && sectionId) {
      fetchClassDetails();
    }
  }, [classId, sectionId]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading class details...</p>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error loading class details</p>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      
      <button
  onClick={() => navigate("/superadmin/sis/classes-schedules/classes")}
  className="fixed  right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg"
>
  ← Back
</button>

      {/* Page Title */}
      <h2 className="text-2xl font-bold mb-6">
         {classInfo.classname?.name} - Section{" "}
        {classInfo.sectionName?.name}
      </h2>

      {/* Overview */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Overview</h3>
        <p>
          <strong>Room:</strong> N/A
        </p>
        <p>
          <strong>Capacity:</strong> N/A
        </p>
       <p>
  <strong>Class Teacher:</strong>{" "}
  {classInfo.classTeacher?.personalInfo?.name || "N/A"}
</p>
      </section>

      {/* Subjects */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Subjects</h3>
        <ul className="list-disc pl-6">
          {classInfo.timetableWithPeriods &&
          classInfo.timetableWithPeriods.length > 0 ? (
            [
              ...new Set(
                classInfo.timetableWithPeriods
                  .map((item) => item.subject)
                  .filter(Boolean)
              ),
            ].map((subject, idx) => <li key={idx}>{subject}</li>)
          ) : (
            <li>No subjects assigned</li>
          )}
        </ul>
      </section>

      {/* Students */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Students</h3>
        <p>Total Students: {classInfo.students?.length || 0}</p>
        <table className="w-full border mt-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Roll No</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Gender</th>
            </tr>
          </thead>
          <tbody>
            {classInfo.students && classInfo.students.length > 0 ? (
              classInfo.students.map((s) => (
                <tr key={s._id}>
                  <td className="border px-2 py-1">
                    {s.personalInfo?.rollNo || "N/A"}
                  </td>
                  <td className="border px-2 py-1">
                    {s.personalInfo?.name || "N/A"}
                  </td>
                  <td className="border px-2 py-1">
                    {s.personalInfo?.gender || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="border px-2 py-1 text-center text-gray-500"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Timetable */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Timetable</h3>
        {classInfo.timetableWithPeriods &&
        classInfo.timetableWithPeriods.length > 0 ? (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Day</th>
                <th className="border px-2 py-1">Period</th>
                <th className="border px-2 py-1">Time</th>
                <th className="border px-2 py-1">Subject</th>
                <th className="border px-2 py-1">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {classInfo.timetableWithPeriods.map((item, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{item.day}</td>
                  <td className="border px-2 py-1">{item.period}</td>
                  <td className="border px-2 py-1">
                    {item.timeFrom} - {item.timeTo}
                  </td>
                  <td className="border px-2 py-1">{item.subject || "N/A"}</td>
                  <td className="border px-2 py-1">{item.teacher || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No timetable available</p>
        )}
      </section>

      {/* Exams */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Exams</h3>
        <p className="text-gray-500">No exam data available</p>
      </section>

      {/* Assignments */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Assignments</h3>
        {classInfo.assignmentData && classInfo.assignmentData.length > 0 ? (
          <ul className="list-disc pl-6">
            {classInfo.assignmentData.map((a, i) => (
              <li key={i}>
                {a.title} (Due: {new Date(a.dueDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No assignments available</p>
        )}
      </section>
    </div>
  );
};

export default SuperAdminSISClassDetailPage;
