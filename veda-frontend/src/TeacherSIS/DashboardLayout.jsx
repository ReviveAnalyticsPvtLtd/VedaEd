import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import TeacherSidebar from "./Sidebar";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { useState } from "react";

export default function TeacherDashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      {/* FIXED NAVBAR (same as Admin layout) */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* SIDEBAR (Admin style) */}
      <TeacherSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT AREA */}
      <div
        className="flex-1 pt-16 overflow-y-auto transition-all"
        style={{
          marginLeft: isSidebarOpen ? "256px" : "56px",
          transition: "margin-left 0.3s"
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
