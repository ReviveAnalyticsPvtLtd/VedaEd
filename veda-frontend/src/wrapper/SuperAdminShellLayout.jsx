import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { useState } from "react";

export default function SuperAdminShellLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      {/* FIXED NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* SUPER ADMIN SIDEBAR */}
      <SuperAdminSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 pt-16 overflow-y-auto transition-all">
        <div className="p-3">
          <Outlet />
        </div>
      </div>

    </div>
  );
}