import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone } from "lucide-react";

const AdminSettingsTwoFactor = () => {
  const navigate = useNavigate();

  const [enabled, setEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin-front/settings")}
        className="flex items-center gap-2 text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Security
      </button>

      <div>
        <h1 className="text-3xl font-bold">
          Two Factor Authentication
        </h1>

        <p className="text-slate-500">
          Add an extra layer of security.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              Authenticator App
            </h3>

            <p className="text-sm text-slate-500">
              Google Authenticator / Authy
            </p>
          </div>

          <button
            onClick={() =>
              setEnabled(!enabled)
            }
            className={`px-4 py-2 rounded-xl text-white ${
              enabled
                ? "bg-green-600"
                : "bg-slate-500"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsTwoFactor;