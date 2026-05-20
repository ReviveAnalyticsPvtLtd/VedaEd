import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useState } from "react";

export default function DashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      {/* FIXED NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* SIDEBAR (toggles inside itself) */}
      <Sidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div
        className="flex-1 min-w-0 min-h-0 pt-16 overflow-y-auto transition-all"
        style={{
          marginLeft: isSidebarOpen ? "256px" : "56px",
          transition: "margin-left 0.3s"
        }}
      >
        <div className="p-3 w-full max-w-full min-w-0 min-h-full flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
