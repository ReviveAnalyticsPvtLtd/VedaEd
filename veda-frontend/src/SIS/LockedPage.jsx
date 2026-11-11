import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiArrowLeft } from "react-icons/fi";

export default function LockedPage({ message = "This page is locked or currently unavailable." }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4 shadow-sm">
        <FiLock size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h2>
      <p className="text-gray-500 max-w-md mb-6 text-sm">{message}</p>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
      >
        <FiArrowLeft size={16} /> Go Back
      </button>
    </div>
  );
}

