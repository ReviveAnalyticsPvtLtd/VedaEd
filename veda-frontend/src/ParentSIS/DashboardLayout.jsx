import { Outlet } from "react-router-dom";
import Navbar from "../SIS/Navbar";
import ParentSidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { parentAPI } from "../services/parentAPI";

export default function ParentDashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // DEV: Auto-login as first parent if no user found
  useEffect(() => {
    const checkUser = async () => {
      const stored = localStorage.getItem("user");
      if (!stored) {
        try {
          const parentsResponse = await parentAPI.getAllParents();
          const list = parentsResponse.parents || parentsResponse.data || [];
          if (list.length > 0) {
            const firstParent = list[0];
            const userObj = {
              _id: firstParent._id,
              role: "Parent",
              name: firstParent.name,
              email: firstParent.email
            };
            localStorage.setItem("user", JSON.stringify(userObj));
            console.log("DEV: Auto-logged in as parent", userObj.name);
          }
        } catch (e) {
          console.error("DEV: Parent auto-login failed", e);
        }
      }
    };
    checkUser();
  }, []);

  return (
    <div className="flex w-full h-screen bg-gray-100 overflow-hidden">

      {/* FIXED NAVBAR */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white border-b z-40">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* SIDEBAR */}
      <ParentSidebar
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
