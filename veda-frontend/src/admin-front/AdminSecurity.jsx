
import { useEffect, useState } from "react";
import axios from "axios";
import {
  TriangleAlert,
  Key,
  Smartphone,
  Activity,
  Shield,
  ChevronRight,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

// import config from "../config";
import { useNavigate } from "react-router-dom";

export default function AdminSecurity() {
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();


const handlePasswordChange = () => {
  navigate("/admin-front/settings/security/password");
};

const handleTwoFactor = () => {
  navigate("/admin-front/settings/security/two-factor-auth");
};

const handleSessionManagement = () => {
  navigate("/admin-front/settings/security/sessions");
};

const handleAccountControl = () => {
  navigate("/admin-front/settings/security/account-control");
};

  const [securityData, setSecurityData] = useState({
    suspiciousLogin: {
      active: true,
      location: "London, UK",
      message:
        "We noticed an unusual login from London, UK. If this wasn't you, please review your active sessions and change your password.",
    },

    password: {
      lastChanged: "3 months ago",
    },

    twoFactor: {
      enabled: true,
      method: "Authenticator App",
    },

    sessions: [],

    events: [],
  });

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);

      /*
      const res = await axios.get(
        `${config.API_BASE_URL}/settings/security`
      );

      setSecurityData(res.data);
      */

      // Dummy Data

      setSecurityData({
        suspiciousLogin: {
          active: true,
          location: "London, UK",
          message:
            "We noticed an unusual login from London, UK. If this wasn't you, please review your active sessions and change your password.",
        },

        password: {
          lastChanged: "3 months ago",
        },

        twoFactor: {
          enabled: true,
          method: "Authenticator App",
        },

        sessions: [
          {
            id: 1,
            device: "Chrome on Windows",
            location: "Lucknow, India",
            current: true,
            lastActive: "Now",
          },

          {
            id: 2,
            device: "Chrome on Android",
            location: "Lucknow, India",
            current: false,
            lastActive: "2 hours ago",
          },

          {
            id: 3,
            device: "Safari on Mac",
            location: "Delhi, India",
            current: false,
            lastActive: "3 days ago",
          },
        ],

        events: [
          {
            id: 1,
            type: "success",
            title: "Password changed",
            date: "Mar 15, 2024",
          },

          {
            id: 2,
            type: "info",
            title: "New login from Chrome on macOS",
            date: "Mar 12, 2024",
          },

          {
            id: 3,
            type: "warning",
            title: "Failed login attempt from 182.1.2.3",
            date: "Mar 10, 2024",
          },
        ],
      });
    } catch (error) {
      console.error(
        "Error fetching security settings:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

 

 

  



  if (loading) {
    return (
      <div className="bg-white rounded-xl p-10 text-center">
        Loading Security Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h2 className="text-3xl font-bold">
          Security
        </h2>

        <p className="text-slate-500 mt-2">
          Manage your account security,
          sessions and data privacy.
        </p>
      </div>

      {/* SUSPICIOUS LOGIN ALERT */}

      {securityData.suspiciousLogin.active && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
            <TriangleAlert size={20} />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">
              Suspicious login detected
            </h4>

            <p className="text-xs text-amber-700 mt-1">
              {
                securityData.suspiciousLogin
                  .message
              }
            </p>

            <button
              onClick={handleSessionManagement}
              className="mt-3 text-xs font-bold text-amber-600 hover:underline"
            >
              Review Activity
            </button>
          </div>
        </div>
      )}

      {/* SECURITY CARDS */}

      <div className="flex flex-col gap-3">

        {/* PASSWORD */}

        <button
          onClick={handlePasswordChange}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-left group"
        >
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Key size={20} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Password
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              Last changed{" "}
              {
                securityData.password
                  .lastChanged
              }
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-blue-600"
          />
        </button>

        {/* TWO FACTOR */}

        <button
          onClick={handleTwoFactor}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-left group"
        >
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Smartphone size={20} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                Two-Factor Auth
              </h3>

              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
                {securityData.twoFactor.enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {
                securityData.twoFactor
                  .method
              }
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-blue-600"
          />
        </button>

        {/* ACTIVE SESSIONS */}

        <button
          onClick={handleSessionManagement}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-left group"
        >
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Activity size={20} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Active Sessions
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              {
                securityData.sessions.length
              }{" "}
              devices connected
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-blue-600"
          />
        </button>

        {/* ACCOUNT CONTROL */}

        <button
          onClick={handleAccountControl}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-left group"
        >
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Shield size={20} />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Account Control
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              Privacy & Data Management
            </p>
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-blue-600"
          />
        </button>

      </div>      {/* ACTIVE SESSIONS DETAILS */}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Sessions
          </h3>

          <button
            onClick={() =>
              alert("Logout all devices")
            }
            className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg font-semibold"
          >
            Logout All
          </button>
        </div>

        <div className="space-y-3">
          {securityData.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
            >
              <div>
                <h4 className="font-semibold text-slate-900">
                  {session.device}
                </h4>

                <p className="text-xs text-slate-500 mt-1">
                  {session.location}
                </p>

                <p className="text-xs text-slate-400">
                  Last Active: {session.lastActive}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {session.current && (
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">
                    CURRENT
                  </span>
                )}

                {!session.current && (
                  <button
                    onClick={() =>
                      alert(
                        `Logout ${session.device}`
                      )
                    }
                    className="text-red-600 text-sm font-medium"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT SECURITY EVENTS */}

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Recent Security Events
        </h3>

        <div className="space-y-4">
          {securityData.events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
            >
              <div className="flex items-center gap-3">

                {event.type === "success" && (
                  <CircleCheck
                    size={16}
                    className="text-emerald-500"
                  />
                )}

                {event.type === "info" && (
                  <CircleAlert
                    size={16}
                    className="text-blue-500"
                  />
                )}

                {event.type === "warning" && (
                  <TriangleAlert
                    size={16}
                    className="text-amber-500"
                  />
                )}

                <span className="text-sm text-slate-700">
                  {event.title}
                </span>
              </div>

              <span className="text-xs text-slate-400">
                {event.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Quick Security Actions
        </h3>

        <div className="grid md:grid-cols-3 gap-4">

          <button
            onClick={handlePasswordChange}
            className="border border-slate-200 rounded-xl p-4 hover:border-blue-600 hover:bg-blue-50 transition-all"
          >
            <h4 className="font-semibold">
              Change Password
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Update your account password
            </p>
          </button>

          <button
            onClick={handleTwoFactor}
            className="border border-slate-200 rounded-xl p-4 hover:border-blue-600 hover:bg-blue-50 transition-all"
          >
            <h4 className="font-semibold">
              Manage 2FA
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Configure authentication
            </p>
          </button>

          <button
            onClick={handleSessionManagement}
            className="border border-slate-200 rounded-xl p-4 hover:border-blue-600 hover:bg-blue-50 transition-all"
          >
            <h4 className="font-semibold">
              Review Sessions
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Manage logged-in devices
            </p>
          </button>

        </div>
      </div>

    </div>
  );
}