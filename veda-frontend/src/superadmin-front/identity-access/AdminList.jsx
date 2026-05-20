import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiEye, FiEdit2, FiUserCheck, FiUserX } from "react-icons/fi";
import PageHeader from "./components/PageHeader";
import { superadminIdentityAPI } from "../../services/superadminIdentityAPI";
import useIdentityMeta from "./hooks/useIdentityMeta";
import { INVITE_STATUS } from "./constants";
import { toastBannerClassName } from "../../utils/toastMessageStyle";
import AdminStatusBadge from "./components/AdminStatusBadge";

const BASE = "/superadmin-front/identity-access";

export default function AdminList() {
  const navigate = useNavigate();
  const { meta } = useIdentityMeta();
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [adminType, setAdminType] = useState("");
  const [status, setStatus] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    superadminIdentityAPI
      .listAdmins({ search, adminType, status, inviteStatus })
      .then((res) => setAdmins(res.data || []))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, adminType, status, inviteStatus]);

  const toggleStatus = async (admin) => {
    const next = admin.status === "active" ? "inactive" : "active";
    try {
      await superadminIdentityAPI.updateStatus(admin._id, next);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div
      className="min-h-full bg-gray-100 p-4 md:p-6"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Identity & Access" },
        ]}
        title="Access & Admin Management"
        subtitle="Create secure platform, school, campus, finance, academic, and support admins."
        action={
          <Link
            to={`${BASE}/admins/create`}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white
              px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            <FiPlus /> Invite Admin
          </Link>
        }
      />

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}
      {message && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={adminType}
            onChange={(e) => setAdminType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All admin types</option>
            {(meta?.adminTypes || []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={inviteStatus}
            onChange={(e) => setInviteStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All invite statuses</option>
            <option value="pending">{INVITE_STATUS.pending}</option>
            <option value="sent">{INVITE_STATUS.sent}</option>
            <option value="accepted">{INVITE_STATUS.accepted}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Admin Type</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    Loading admins...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No admins found. Create your first admin.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {admin.fullName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {admin.employeeId || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                    <td className="px-4 py-3 text-gray-600">{admin.adminType}</td>
                    <td className="px-4 py-3 text-gray-600">{admin.school || "—"}</td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge admin={admin} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`${BASE}/admins/${admin._id}`)}
                          className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600"
                          title="View"
                        >
                          <FiEye />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`${BASE}/admins/${admin._id}/edit`)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        {!admin.isDraft && (
                          <button
                            type="button"
                            onClick={() => toggleStatus(admin)}
                            className={`p-2 rounded-lg ${
                              admin.status === "active"
                                ? "hover:bg-red-50 text-red-600"
                                : "hover:bg-green-50 text-green-600"
                            }`}
                            title={admin.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {admin.status === "active" ? <FiUserX /> : <FiUserCheck />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
