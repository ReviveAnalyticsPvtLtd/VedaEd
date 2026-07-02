import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { superadminIdentityAPI } from "../services/superadminIdentityAPI";
import {
  PASSWORD_MIN_LENGTH,
  validatePasswordFields,
} from "../superadmin-front/identity-access/constants";
import { toastBannerClassName } from "../utils/toastMessageStyle";
import { saveAuthSession } from "../utils/authSession";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordPreSet = invite?.passwordPreSet;

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
      return;
    }
    superadminIdentityAPI
      .validateInviteToken(token)
      .then((res) => setInvite(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();

    if (!passwordPreSet) {
      const passwordError = validatePasswordFields(password, confirmPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await superadminIdentityAPI.acceptInvite({
        token,
        ...(passwordPreSet ? {} : { password }),
      });
      if (res.session) {
        saveAuthSession(res.session);
      }
      setToast(res.message || "Invitation accepted successfully");
      setTimeout(() => navigate("/setup/start"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        Validating invitation...
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm font-medium">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const campusScope =
    invite.campus && invite.scope
      ? `${invite.campus}, ${invite.scope}`
      : invite.campus || invite.scope || "";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="p-8">
            <p className="text-lg font-bold text-blue-600 mb-2">RA VedaSchool</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept your invitation</h1>
            <p className="text-gray-600 mb-1">Hello {invite.fullName},</p>
            <p className="text-sm text-gray-600">
              You were invited as <span className="font-semibold">{invite.adminType}</span> for{" "}
              <span className="font-semibold">{invite.school}</span>.
            </p>
            {campusScope && (
              <p className="text-sm text-gray-600 mt-1">
                Access scope: <span className="font-semibold">{campusScope}</span>
              </p>
            )}
          </div>
        </div>

        {toast && (
          <p
            className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
          >
            {toast}
          </p>
        )}

        <form
          onSubmit={handleAccept}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
        >
          {passwordPreSet ? (
            <>
              <h2 className="font-semibold text-gray-900">Activate your account</h2>
              <p className="text-sm text-gray-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                Your SuperAdmin has already set your initial login password. After
                accepting, sign in with that password. You can change it anytime from
                your profile settings.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900">Create your password</h2>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </>
          )}

          {passwordPreSet && error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold
              hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
          >
            {submitting ? "Accepting..." : "Accept Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
