import { INVITE_STATUS } from "../constants";

/**
 * Inactive (deactivated) overrides Accepted when SuperAdmin disables the account.
 * Accepted = invite completed and account is still active.
 * Invitation Sent / Pending = invite onboarding (not yet usable).
 * Active = direct admin or accepted and enabled.
 */
export function getAdminStatusDisplay(admin) {
  if (!admin) {
    return { label: "—", tone: "neutral" };
  }

  const hasAcceptedInvite =
    admin.inviteStatus === "accepted" && Boolean(admin.acceptedAt);

  if (admin.status === "inactive" && hasAcceptedInvite) {
    return { label: "Inactive", tone: "neutral" };
  }

  if (hasAcceptedInvite) {
    return { label: INVITE_STATUS.accepted, tone: "success" };
  }

  if (admin.inviteStatus === "sent" || admin.invitedAt) {
    return { label: INVITE_STATUS.sent, tone: "warning" };
  }

  if (admin.inviteStatus === "pending" && admin.status === "inactive") {
    return { label: INVITE_STATUS.pending, tone: "neutral" };
  }

  if (admin.status === "active") {
    return { label: "Active", tone: "success" };
  }

  return { label: "Inactive", tone: "neutral" };
}

const TONE_CLASSES = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  neutral: "bg-gray-100 text-gray-600",
};

export function adminStatusBadgeClass(tone) {
  return `text-xs px-2 py-0.5 rounded-full ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`;
}
