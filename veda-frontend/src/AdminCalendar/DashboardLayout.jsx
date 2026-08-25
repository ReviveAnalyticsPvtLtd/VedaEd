import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../SIS/Navbar";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import AdminCalendarSidebar from "./Sidebar";

export default function AdminCalendarLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      {/* FIXED NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-40">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* SIDEBAR */}
      <AdminCalendarSidebar
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