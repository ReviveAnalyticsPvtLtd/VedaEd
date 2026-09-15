import React from "react";
import { FiUsers, FiClock } from "react-icons/fi";

const SuperAdminHRStaffDirectory = () => {
  return (
    <div className="p-2">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        HR <span className="mx-2">›</span> Staff Directory
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Staff Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view staff information
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[450px] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">
            <FiUsers className="text-blue-600" size={30} />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Staff Directory
          </h2>

          <div className="flex items-center justify-center gap-2 text-blue-600 mb-3">
            <FiClock size={18} />
            <span className="font-medium">Coming Soon</span>
          </div>

          <p className="text-sm text-gray-500 leading-6">
            The Staff Directory module is currently under development.
            This section will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminHRStaffDirectory;