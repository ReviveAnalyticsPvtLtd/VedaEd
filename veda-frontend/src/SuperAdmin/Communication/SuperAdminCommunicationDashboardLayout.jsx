import { Outlet } from "react-router-dom";
import Navbar from "../../SIS/Navbar";
import SuperAdminCommunicationSidebar from "./SuperAdminCommunicationSidebar";
import { useState } from "react";

export default function SuperAdminCommunicationDashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-40">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      <SuperAdminCommunicationSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className="flex-1 pt-16 overflow-y-auto transition-all"
        style={{ marginLeft: isSidebarOpen ? "256px" : "56px" }}
      >
        <div className="p-3">
          <Outlet />
        </div>
      </div>

    </div>
  );
}