import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiEdit2, FiUserCheck, FiUserX } from "react-icons/fi";
import PageHeader from "./components/PageHeader";
import AdminForm from "./components/AdminForm";
import AccessSummary from "./components/AccessSummary";
import { superadminIdentityAPI } from "../../services/superadminIdentityAPI";
import useIdentityMeta from "./hooks/useIdentityMeta";
import { getAdminStatusDisplay } from "./utils/adminStatusDisplay";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const BASE = "/superadmin-front/identity-access";

export default function ViewAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { meta } = useIdentityMeta();
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    superadminIdentityAPI
      .getAdmin(id)
      .then((res) => setAdmin(res.data))
      .catch((err) => setError(err.message));
  }, [id]);

  const toggleStatus = async () => {
    if (!admin) return;
    const next = admin.status === "active" ? "inactive" : "active";
    try {
      await superadminIdentityAPI.updateStatus(id, next);
      setAdmin((a) => ({ ...a, status: next }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!admin && !error) {
    return (
      <div className="p-6 text-gray-500">
        Loading...
      </div>
    );
  }

  if (error && !admin) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  const statusLabel = getAdminStatusDisplay(admin).label;

  const handleResendInvite = async () => {
    setBusy(true);
    try {
      const res = await superadminIdentityAPI.resendInvite(id);
      setAdmin(res.data);
      setToast(res.message || "Invitation resent successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-full bg-gray-100 p-4 md:p-6"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Identity & Access", to: `${BASE}/admins` },
          { label: admin.fullName },
        ]}
        title="View Admin"
        subtitle={admin.email}
        action={
          <div className="flex flex-wrap gap-2">
            {(admin.inviteStatus === "pending" || admin.inviteStatus === "sent") && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResendInvite}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {busy ? "Sending..." : "Resend Invite"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`${BASE}/admins/${id}/invite-preview`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                >
                  View Invite
                </button>
              </>
            )}
            {!admin.isDraft && (
              <button
                type="button"
                onClick={toggleStatus}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                  admin.status === "active"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {admin.status === "active" ? (
                  <>
                    <FiUserX /> Deactivate
                  </>
                ) : (
                  <>
                    <FiUserCheck /> Activate
                  </>
                )}
              </button>
            )}
            <Link
              to={`${BASE}/admins/${id}/edit`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white
                px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <FiEdit2 /> Edit
            </Link>
          </div>
        }
      />

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminForm
            form={admin}
            meta={meta}
            onChange={() => {}}
            readOnly
          />
        </div>
        <AccessSummary form={admin} statusLabel={statusLabel} variant="view" />
      </div>

      <button
        type="button"
        onClick={() => navigate(`${BASE}/admins`)}
        className="mt-6 text-sm text-indigo-600 hover:underline"
      >
        ← Back to admin list
      </button>
    </div>
  );
}
