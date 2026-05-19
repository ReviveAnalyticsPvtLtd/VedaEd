import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "./components/PageHeader";
import InvitationEmailPreview from "./components/InvitationEmailPreview";
import { superadminIdentityAPI } from "../../services/superadminIdentityAPI";
import { toastBannerClassName } from "../../utils/toastMessageStyle";

const BASE = "/superadmin-front/identity-access";

export default function InvitePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (message, isError = false) => {
    setToast(isError ? `❌ ${message}` : message);
    setTimeout(() => setToast(""), 3500);
  };

  const load = () => {
    setLoading(true);
    superadminIdentityAPI
      .getAdmin(id)
      .then((res) => setAdmin(res.data))
      .catch((err) => showToast(err.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleResend = async () => {
    setBusy(true);
    try {
      const res = await superadminIdentityAPI.resendInvite(id);
      setAdmin(res.data);
      showToast(res.message || "Invitation resent successfully");
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading invitation preview...</div>;
  }

  if (!admin) {
    return <div className="p-6 text-red-600">Admin not found</div>;
  }

  return (
    <div className="min-h-full bg-gray-100 p-4 md:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Identity & Access", to: `${BASE}/admins` },
          { label: "Invitation Preview" },
        ]}
        title="Invitation Email Preview"
        subtitle={`Invite sent to ${admin.email}`}
      />

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}

      <InvitationEmailPreview admin={admin} />

      <div className="flex flex-wrap justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate(`${BASE}/admins`)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
            text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || admin.inviteStatus === "accepted"}
            onClick={handleResend}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
              text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Working..." : "Resend Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
