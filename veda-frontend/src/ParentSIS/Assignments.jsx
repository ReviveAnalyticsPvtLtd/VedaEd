import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDownload, FiClock, FiCheckCircle } from "react-icons/fi";
import { format, parseISO, isPast } from "date-fns";
import HelpInfo from "../components/HelpInfo";

import { assignmentAPI } from "../services/assignmentAPI";
import config from "../config";

const FILE_BASE_URL = config.SERVER_URL;

export default function ParentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    const fetchParentInfo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId) return;

        const authHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers: authHeaders });
        
        if (res.data && res.data.success && res.data.parent.children) {
          const kids = res.data.parent.children;
          setChildren(kids);
          // Don't auto-select if we want to show all initially, 
          // but the user said "same as student" so showing one child at a time is better.
          if (kids.length > 0) {
            setSelectedChildId(kids[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };
    fetchParentInfo();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedChildId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Backend handles merging if no studentId is sent, 
      // but we send it for targeted view.
      const data = await assignmentAPI.getAssignments({ 
        studentId: selectedChildId 
      });
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(false);
    }
  };


  
  const handleDownload = (documentPath) => {
    if (documentPath) {
      const fileUrl = `${FILE_BASE_URL}${documentPath}`;
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {selectedChildId 
            ? `${children.find(c => c._id === selectedChildId)?.personalInfo?.name || "Child"}'s Assignments` 
            : "Child's Assignments"}
        </h2>
        <div className="flex gap-2">
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border px-3 py-1 rounded bg-blue-50 text-blue-700 font-medium"
            >
              <option value="">All Children</option>
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.personalInfo?.name || child.name}
                </option>
              ))}
            </select>
          )}
          <HelpInfo
          title="Child's Assignments"
          description={`4.5 Child's Assignments (Homework & Projects)

View all assignments given to your child, including homework and project tasks, along with their submission status and files.

Sections:
- Assignment List: Displays all assignments with subject-wise grouping
- Submission Status: Shows Submitted, Pending, or Late status
- Due Date: Indicates assignment deadline with late highlight
- Teacher Files: Download files shared by the teacher
- Child Submission Files: View files uploaded by your child
- Pending Area: Shows tasks where submission is not yet uploaded
`}
          steps={[
            "Scroll through the list to view all assignments with subject and type.",
            "Check the submission status to know whether the child has submitted or not.",
            "Download the teacher's file for instructions or study material.",
            "Click on child submission file to view uploaded work.",
            "Note the due date and Late indicator for missed deadlines.",
            "Help your child upload pending submissions before the due date.",
          ]}
        />
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border">
        {assignments.length === 0 ? (
          <p className="text-gray-500">
            No assignments available for your child.
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => {
                return (
                <div
                  key={a._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Title Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {a.title}
                      </h3>
                      <p className=" text-gray-500">
                        {a.subject?.subjectName || a.subject?.name} • {a.assignmentType}
                      </p>
                    </div>
                    <div className=" flex items-center gap-2">
                      <FiClock className="text-gray-500" />
                      <span className="font-medium">
                        {a.dueDate 
                          ? format(typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate), "dd MMM yyyy") 
                          : "No due date"}
                      </span>
                      {a.dueDate && isPast(typeof a.dueDate === 'string' ? parseISO(a.dueDate) : new Date(a.dueDate)) && ! (a.submissions && a.submissions.length > 0) && (
                        <span className="text-red-600 font-medium ml-2">
                          (Late)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-1">
                    {a.submissions && a.submissions.length > 0 ? (
                      <span className="flex items-center gap-1 text-green-600  ">
                        <FiCheckCircle /> Submitted by child
                      </span>
                    ) : (
                      <span className="text-yellow-600  ">
                        Pending submission
                      </span>
                    )}
                  </div>

                  {/* Files */}
                  <div className="mt-2 flex flex-col gap-1">
                    {a.document ? (
                      <button
                        onClick={() => handleDownload(a.document)}
                        className="flex items-center gap-2 text-blue-600  hover:underline"
                      >
                        <FiDownload /> Teacher File: {a.document.split('/').pop()}
                      </button>
                    ) : (
                      <span className="text-gray-400">No teacher file attached</span>
                    )}
                    {a.submissions && a.submissions.length > 0 ? (
                      <button
                        onClick={() => handleDownload(a.submissions[0].document)}
                        className="flex items-center gap-2 text-green-600 hover:underline"
                      >
                        <FiDownload /> Submitted File: {a.submissions[0].document.split('/').pop()}
                      </button>
                    ) : (
                      <span className="text-gray-400 ">
                        No submission uploaded yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
