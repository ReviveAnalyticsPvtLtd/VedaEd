import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import StudentSidebar from "./Sidebar";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { useState, useEffect } from "react";

import { studentAPI } from "../services/studentAPI"; // Import API

export default function StudentDashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // DEV: Auto-login as first student if no user found
  useEffect(() => {
    const checkUser = async () => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            try {
                const students = await studentAPI.getAllStudents();
                // API returns { success: true, students: [...] } or just array? 
                // Based on previous tool output, studentAPI.getAllStudents returns response.json().
                // And studentController returns { success: true, students: [...] }.
                
                const list = students.students || students || [];
                if (list.length > 0) {
                    const firstStudent = list[0];
                    const userObj = {
                        _id: firstStudent._id,
                        role: "Student",
                        name: firstStudent.personalInfo?.fullName || firstStudent.personalInfo?.name,
                        email: firstStudent.personalInfo?.email
                    };
                    localStorage.setItem("user", JSON.stringify(userObj));
                    console.log("DEV: Auto-logged in as", userObj.name);
                    // Force reload to ensure components pick it up? Or just let it be for next navigation.
                }
            } catch (e) {
                console.error("DEV: Auto-login failed", e);
            }
        }
    };
    checkUser();
  }, []);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">
      
      {/* FIXED NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* SIDEBAR */}
      <StudentSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div
        className="flex-1 pt-16 overflow-y-auto transition-all"
        style={{
          marginLeft: isSidebarOpen ? "256px" : "56px",
          transition: "margin-left 0.3s",
        }}
      >
        <div className="p-3">
           <Breadcrumbs />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
