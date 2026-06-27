import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor } from "lucide-react";

const sessions = [
  {
    device: "Chrome - Windows",
    location: "Lucknow, India",
    current: true,
  },
  {
    device: "Edge - Windows",
    location: "Delhi, India",
    current: false,
  },
  {
    device: "iPhone 15",
    location: "Mumbai, India",
    current: false,
  },
];

const ParentProfileSettingsSessions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/parent/settings/security")}
        className="flex items-center gap-2 text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Security
      </button>

      <h1 className="text-3xl font-bold">
        Active Sessions
      </h1>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div
            key={index}
            className="bg-white border rounded-2xl p-5 flex justify-between"
          >
            <div>
              <h3 className="font-semibold">
                {session.device}
              </h3>

              <p className="text-sm text-slate-500">
                {session.location}
              </p>
            </div>

            {session.current ? (
              <span className="text-green-600 font-semibold">
                Current
              </span>
            ) : (
              <button className="text-red-600 font-medium">
                Logout
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentProfileSettingsSessions;