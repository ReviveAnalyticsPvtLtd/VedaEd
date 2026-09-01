import React, { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import { studentAPI } from "../../services/studentAPI";
import { useNavigate } from "react-router-dom";
import HelpInfo from "../../components/HelpInfo";

export default function StudentDetails() {
  const helpDescription = `Page Description: Receptionists can browse student profiles, verify contact information, and trigger visitor book entries without leaving this page.


14.1 Student Directory Overview

Search or filter students to quickly find the right record.

Sections:
- Breadcrumb & Header: Confirms you are in Receptionist > Student Details
- Filters: Class and Section dropdowns plus search box for name/ID
- Excel Export: Download the filtered student list


14.2 Student Table

Displays essential student profile information.

Sections:
- Columns: Student ID, Name, Class, Section, DOB, Gender, Mobile
- Search Bar: Inline search specifically for the table
- Pagination/Scrolling: Ensures receptionists can scan large lists


14.3 Visitor Book Shortcut

Send visitor meeting details straight to the visitor module.

Sections:
- Action Button: “Add to Visitor Book” next to each student row
- Navigation: Automatically opens the visitor form with the student prefilled`;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const navigate = useNavigate();

  // Fetch students data on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await studentAPI.getAllStudents();
        if (response.success) {
          setStudents(response.students);
        } else {
          setError("Failed to fetch students");
        }
      } catch (err) {
        setError("Error fetching students: " + err.message);
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const transformedStudents = students.map((student) => ({
    studentId: student.personalInfo.stdId,
    name: student.personalInfo.name,
    class: student.personalInfo.class || "N/A",
    section: student.personalInfo.section || "N/A",
    dob: student.personalInfo.DOB || "N/A",
    gender: student.personalInfo.gender || "N/A",
    mobile: student.personalInfo.contactDetails?.mobileNumber || "N/A",
  }));

  const uniqueClasses = [
    ...new Set(
      transformedStudents.map((s) => s.class).filter((c) => c !== "N/A")
    ),
  ];
  const uniqueSections = [
    ...new Set(
      transformedStudents.map((s) => s.section).filter((s) => s !== "N/A")
    ),
  ];

  const filteredStudents = transformedStudents.filter(
    (s) =>
      (selectedClass ? s.class === selectedClass : true) &&
      (selectedSection ? s.section === selectedSection : true) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "StudentDetails.xlsx");
  };

  const handleAddVisitor = (student) => {
    const meetingInfo = `Student (${student.name} - ${student.studentId})`;
    navigate("/receptionist/visitor-book", {
      state: { meetingWith: meetingInfo },
    });
  };

  if (loading) {
    return (
      <div className="p-0 m-0 min-h-screen">
        <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
          <span>Receptionist</span>
          <span>&gt;</span>
          <span>Student Details</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Student Details</h2>
          <HelpInfo
            title="Student Details Help"
            description={helpDescription}
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">
            Loading student details...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-0 m-0 min-h-screen">
       
        <h2 className="text-2xl font-bold mb-4">Student Details</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 m-0 min-h-screen">
      

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Student Details</h2>
        <HelpInfo title="Student Details Help" description={helpDescription} />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border mb-4  ">
        {/* Filters */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold mb-4">Select Criteria</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
            
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((className, index) => (
                  <option key={index} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            <div>
             
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {uniqueSections.map((sectionName, index) => (
                  <option key={index} value={sectionName}>
                    {sectionName}
                  </option>
                ))}
              </select>
            </div>
            <div>
             
              <input
                type="text"
                placeholder="Search by Name or Student ID"
                className="border rounded-md px-3 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
         <div className="flex justify-end items-center mb-3">
                     <button
                       onClick={exportToExcel}
                       className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                     >
                       <FiDownload /> Excel
                     </button>
                   </div>

          <table className="w-full  text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 border border-gray-200">S.No.</th>
                <th className="p-2 border ">Student ID</th>
                <th className="p-2 border ">Student Name</th>
                <th className="p-2 border ">Class</th>
                <th className="p-2 border ">Section</th>
                <th className="p-2 border ">Date of Birth</th>
                <th className="p-2 border ">Gender</th>
                <th className="p-2 border ">Mobile Number</th>
                <th className="p-2 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {/* S.No. */}
          <td className="p-2 border border-gray-200 text-center">
            {index + 1}
          </td>
                    <td className="p-2 border">{s.studentId}</td>
                    <td className="p-2 border">{s.name}</td>
                    <td className="p-2 border">{s.class}</td>
                    <td className="p-2 border">{s.section}</td>
                    <td className="p-2 border">{s.dob}</td>
                    <td className="p-2 border">{s.gender}</td>
                    <td className="p-2 border">{s.mobile}</td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleAddVisitor(s)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Add to Visitor
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
