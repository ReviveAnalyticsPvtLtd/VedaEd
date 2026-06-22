import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import ParentProfileSettingsSidebar from "./ParentProfileSettingsSidebar";
import { useState } from "react";

export default function ParentProfileSettingsDashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      <ParentProfileSettingsSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div
        className="flex-1 pt-16 overflow-y-auto transition-all"
        style={{
          marginLeft: isSidebarOpen ? "256px" : "56px",
          transition: "margin-left 0.3s",
        }}
      >
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}