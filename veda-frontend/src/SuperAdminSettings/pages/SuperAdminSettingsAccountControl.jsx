import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SuperAdminSettingsAccountControl = () => {
  const navigate = useNavigate();

  const [dataSharing, setDataSharing] =
    useState(true);

  const [analytics, setAnalytics] =
    useState(true);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/superadmin/settings/security")}
        className="flex items-center gap-2 text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Security
      </button>

      <div>
        <h1 className="text-3xl font-bold">
          Account Control
        </h1>

        <p className="text-slate-500">
          Privacy and data management settings.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              Data Sharing
            </h3>

            <p className="text-sm text-slate-500">
              Share anonymized usage data.
            </p>
          </div>

          <input
            type="checkbox"
            checked={dataSharing}
            onChange={() =>
              setDataSharing(!dataSharing)
            }
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              Analytics Tracking
            </h3>

            <p className="text-sm text-slate-500">
              Help improve the platform.
            </p>
          </div>

          <input
            type="checkbox"
            checked={analytics}
            onChange={() =>
              setAnalytics(!analytics)
            }
          />
        </div>

        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SuperAdminSettingsAccountControl;