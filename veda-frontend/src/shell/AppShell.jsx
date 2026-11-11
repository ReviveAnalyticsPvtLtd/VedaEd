import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import AppSidebar from "./AppSidebar";

/**
 * Unified App Shell for both Admin and SuperAdmin panels.
 * Renders the fixed top Navbar, the dynamic role-aware AppSidebar,
 * and the primary content outlet.
 */
export default function AppShell({ role }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">
      {/* FIXED TOP NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-30">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* DYNAMIC ROLE-AWARE SIDEBAR */}
      <AppSidebar
        searchQuery={searchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        role={role}
      />

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 min-w-0 min-h-0 pt-16 overflow-y-auto overflow-x-hidden">
        <div className="p-3 w-full max-w-full min-w-0 min-h-full flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

