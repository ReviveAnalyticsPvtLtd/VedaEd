const crypto = require("crypto");
const { sendAdminInvitationEmail } = require("../../services/emailService");

const INVITE_EXPIRY_HOURS = () => Number(process.env.INVITE_EXPIRY_HOURS || 48);

const buildAcceptUrl = (token) => {
  const base = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/accept-invitation?token=${encodeURIComponent(token)}`;
};

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

const getInviteExpiryDate = () => {
  const expires = new Date();
  expires.setHours(expires.getHours() + INVITE_EXPIRY_HOURS());
  return expires;
};

const issueAndSendInvite = async (admin) => {
  const token = generateInviteToken();
  const inviteTokenExpiresAt = getInviteExpiryDate();
  const acceptUrl = buildAcceptUrl(token);

  await sendAdminInvitationEmail({
    to: admin.email,
    fullName: admin.fullName,
    adminType: admin.adminType,
    school: admin.school,
    campus: admin.campus,
    scope: admin.scope,
    acceptUrl,
  });

  admin.inviteToken = token;
  admin.inviteTokenExpiresAt = inviteTokenExpiresAt;
  admin.invitedAt = new Date();
  admin.inviteStatus = "sent";
  await admin.save();

  return { acceptUrl, expiresAt: inviteTokenExpiresAt };
};

const findAdminByInviteToken = async (token) => {
  if (!token) return null;
  return require("../../models/PlatformAdmin")
    .findOne({ inviteToken: token })
    .select("+inviteToken");
};

const isInviteTokenValid = (admin) => {
  if (!admin?.inviteTokenExpiresAt) return false;
  return new Date() < new Date(admin.inviteTokenExpiresAt);
};

module.exports = {
  INVITE_EXPIRY_HOURS,
  buildAcceptUrl,
  issueAndSendInvite,
  findAdminByInviteToken,
  isInviteTokenValid,
};
