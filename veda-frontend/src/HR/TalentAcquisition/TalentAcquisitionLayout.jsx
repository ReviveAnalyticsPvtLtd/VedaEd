import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { FiBriefcase, FiUsers, FiUserPlus, FiList } from "react-icons/fi";

export default function TalentAcquisitionLayout() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Talent Acquisition</h1>
        <p className="text-gray-500">Manage vacancies, applications, and onboarding</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
        <NavLink 
          to="/hr/talent-acquisition/dashboard"
          className={({isActive}) => `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-100 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <FiBriefcase size={16} /> Vacancies Dashboard
        </NavLink>
        <NavLink 
          to="/hr/talent-acquisition/pipeline"
          className={({isActive}) => `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-100 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <FiList size={16} /> Application Pipeline
        </NavLink>
        <NavLink 
          to="/hr/talent-acquisition/apply"
          className={({isActive}) => `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-100 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <FiUserPlus size={16} /> Candidate Form
        </NavLink>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
