// src/Parent/MyClasses.jsx
import React, { useState } from "react";
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
} from "react-icons/fi";

import HelpInfo from "../components/HelpInfo";

export default function ParentClasses() {
  const [selectedClass, setSelectedClass] = useState(null);

  // SAME STRUCTURE AS STUDENT - Just parent perspective
  const classes = [
    {
      id: 1,
      name: "Mathematics - Grade 5",
      teacher: "Mrs. Kavita Sharma",
      time: "Mon–Fri | 09:00–09:45 AM",
      room: "Room 104",
      overview:

      
        "This Mathematics class covers Basics of Geometry, Numbers, Fractions and Worksheets for weekly practice.",
      materials: [
        { title: "Chapter 1 Notes (PDF)", type: "pdf", size: "1 MB" },
        { title: "Fraction Worksheet", type: "doc", size: "300 KB" },
      ],
      assignments: [
        {
          title: "Fractions Worksheet",
          due: "26 Nov",
          status: "Pending",
          marks: "-",
        },
      ],
      attendance: { present: 38, absent: 2 },
      announcements: [{ msg: "Weekly Test on Friday!", date: "18 Nov" }],
    },

    {
      id: 2,
      name: "Science - Grade 5",
      teacher: "Mr. Abhishek Rao",
      time: "Mon–Fri | 10:00–10:45 AM",
      room: "Lab 2",
      overview:
        "Class includes simple experiments, biology basics, and hands-on activities for better understanding.",
      materials: [
        { title: "Science Activity Sheet", type: "pdf", size: "1.2 MB" },
      ],
      assignments: [
        {
          title: "Plant Cell Drawing",
          due: "30 Nov",
          status: "Pending",
          marks: "-",
        },
      ],
      attendance: { present: 36, absent: 4 },
      announcements: [{ msg: "Bring notebook tomorrow.", date: "17 Nov" }],
    },
  ];

  // ----------------------------------------
  // DETAIL VIEW — SAME AS STUDENT VERSION
  // ----------------------------------------
  const DetailView = ({ cls }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* BACK */}
      <button
        onClick={() => setSelectedClass(null)}
        className="flex items-center gap-2 mb-5 text-blue-600 hover:underline"
      >
        <FiArrowLeft /> Back to Classes
      </button>

      {/* TITLE */}
      <h2 className="text-3xl font-semibold flex items-center gap-2">
        <FiBookOpen /> {cls.name}
      </h2>

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiUser /> Teacher: {cls.teacher}
      </p>

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiClock /> {cls.time}
      </p>

      <p className="text-gray-600 mt-2 flex items-center gap-2">
        <FiLayers /> {cls.room}
      </p>

      {/* OVERVIEW */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
          <FiAlertCircle /> Class Overview
        </h3>
        <p className="text-gray-700">{cls.overview}</p>
      </div>

      {/* MATERIALS */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiFolder /> Study Materials
        </h3>

        {cls.materials.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b py-2"
          >
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-gray-500 text-sm">
                {m.type.toUpperCase()} • {m.size}
              </p>
            </div>
            <FiFileText className="text-lg" />
          </div>
        ))}
      </div>

      {/* ASSIGNMENTS */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiBookOpen /> Assignments
        </h3>

        {cls.assignments.map((a, i) => (
          <div key={i} className="border-b py-2">
            <p className="font-medium">{a.title}</p>
            <p className="text-gray-500 text-sm">Due: {a.due}</p>

            <p
              className={`text-sm mt-1 ${
                a.status === "Pending" ? "text-red-500" : "text-green-600"
              }`}
            >
              Status: {a.status}
            </p>

            <p className="text-gray-700">Marks: {a.marks}</p>
          </div>
        ))}
      </div>

      {/* ATTENDANCE */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiCheckCircle /> Attendance
        </h3>

        <p>Present: {cls.attendance.present}</p>
        <p>Absent: {cls.attendance.absent}</p>
      </div>

      {/* ANNOUNCEMENTS */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">
          <FiAlertCircle /> Announcements
        </h3>

        {cls.announcements.map((n, i) => (
          <div key={i} className="border-b py-2">
            <p className="font-medium">{n.msg}</p>
            <p className="text-gray-500 text-sm">Date: {n.date}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ----------------------------------------
  // MAIN PAGE → SAME STRUCTURE AS STUDENT
  // ----------------------------------------
  return (
    <div className="p-0 m-0 min-h-screen">
    {/* HEADING */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Childs Classes</h2>

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
    "Use the page to track your child’s academic schedule"
  ]}
/>

</div>

     

        {/* WHITE INNER WRAPPER */}
        {!selectedClass ? (
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Classes List</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="bg-gray-50 rounded-xl border p-5 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <FiBookOpen className=" text-blue-600" />
                    <FiStar className="text-gray-400" />
                  </div>

                  <h3 className="font-semibold  mt-3">{cls.name}</h3>

                  <p className="text-gray-600      text-base  mt-1 flex items-center gap-2">
                    <FiUser /> {cls.teacher}
                  </p>

                  <p className="text-gray-600 mt-1       flex items-center gap-2">
                    <FiClock /> {cls.time}
                  </p>

                  <p className="text-gray-600 mt-1 flex         items-center gap-2">
                    <FiLayers /> {cls.room}
                  </p>

                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                    View Class
                  </button>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <DetailView cls={selectedClass} />
        )}
      </div>

     
          
        
        
      
    

  );
}
