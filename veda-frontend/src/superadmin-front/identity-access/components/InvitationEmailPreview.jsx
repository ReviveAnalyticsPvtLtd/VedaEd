import { INVITE_EXPIRY_HOURS } from "../constants";

export default function InvitationEmailPreview({ admin }) {
  if (!admin) return null;

  const campusScope =
    admin.campus && admin.scope
      ? `${admin.campus}, ${admin.scope}`
      : admin.campus || admin.scope || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Invitation Email Preview</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
          Link expires in {INVITE_EXPIRY_HOURS}h
        </span>
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 md:p-8">
          <p className="text-lg font-bold text-blue-600 mb-4">RA VedaSchool</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to VedaSchool</h2>
          <p className="text-gray-700 mb-3">Hello {admin.fullName},</p>
          <p className="text-gray-700 mb-3">
            You have been invited as an{" "}
            <span className="font-semibold">{admin.adminType}</span> for{" "}
            <span className="font-semibold">{admin.school || "your institution"}</span>.
          </p>
          {campusScope && (
            <p className="text-gray-700 mb-3">
              Your access is limited to <span className="font-semibold">{campusScope}</span>.
            </p>
          )}
          <p className="text-gray-700 mb-6">
            Please accept the invitation to activate your account. Sign in with the
            initial password set by your administrator—you can change it after logging in.
          </p>
          <div className="text-center my-6">
            <span
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg
                text-sm font-semibold shadow-sm"
            >
              Accept Invitation
            </span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            This secure invite link will expire in {INVITE_EXPIRY_HOURS} hours. If you did
            not expect this invitation, contact the school administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
