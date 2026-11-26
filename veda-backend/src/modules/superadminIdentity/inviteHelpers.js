const crypto = require("crypto");
const { sendAdminInvitationEmail } = require("../../services/emailService");

const INVITE_EXPIRY_HOURS = () => Number(process.env.INVITE_EXPIRY_HOURS || 48);

const DEFAULT_LOCAL_FRONTEND_URL = "http://localhost:3000";
const DEFAULT_PRODUCTION_FRONTEND_URL = "https://veda-ed.vercel.app";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const isLocalHostname = (hostname) => {
  if (!hostname) return false;
  const normalized = String(hostname).trim().toLowerCase();
  if (normalized.startsWith("[::1]")) return true;
  const hostOnly = normalized.split(":")[0];
  return LOCAL_HOSTNAMES.has(hostOnly);
};

const isLocalhostUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(String(value).trim());
    return LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase());
  } catch {
    return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(
      String(value).trim()
    );
  }
};

const readHeader = (req, name) => {
  if (!req) return "";
  if (typeof req.get === "function") return req.get(name) || "";
  return req.headers?.[name.toLowerCase()] || "";
};

const getRequestOrigin = (req) => {
  const origin = String(readHeader(req, "origin")).trim();
  if (origin) return origin;
  const referer = String(readHeader(req, "referer")).trim();
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
};

const getRequestHost = (req) => {
  const forwarded = String(readHeader(req, "x-forwarded-host")).split(",")[0].trim();
  return forwarded || String(readHeader(req, "host")).trim();
};

const isProductionContext = (req = null) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(
      process.env.RAILWAY_ENVIRONMENT ||
        process.env.RAILWAY_ENVIRONMENT_NAME ||
        process.env.RAILWAY_PROJECT_ID ||
        process.env.RAILWAY_PUBLIC_DOMAIN
    )
  ) {
    return true;
  }

  const reqOrigin = getRequestOrigin(req);
  if (reqOrigin && !isLocalhostUrl(reqOrigin)) {
    return true;
  }

  const reqHost = getRequestHost(req);
  if (reqHost && !isLocalHostname(reqHost)) {
    return true;
  }

  return false;
};

const resolveFrontendBaseUrl = (req = null) => {
  const configured = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
  const inProduction = isProductionContext(req);

  if (configured && (!inProduction || !isLocalhostUrl(configured))) {
    return configured;
  }

  if (inProduction) {
    return (process.env.PRODUCTION_FRONTEND_URL || DEFAULT_PRODUCTION_FRONTEND_URL)
      .trim()
      .replace(/\/$/, "");
  }

  return DEFAULT_LOCAL_FRONTEND_URL;
};

const buildAcceptUrl = (token, req = null) => {
  const base = resolveFrontendBaseUrl(req);
  return `${base}/accept-invitation?token=${encodeURIComponent(token)}`;
};

const generateInviteToken = () => crypto.randomBytes(32).toString("hex");

const getInviteExpiryDate = () => {
  const expires = new Date();
  expires.setHours(expires.getHours() + INVITE_EXPIRY_HOURS());
  return expires;
};

const issueAndSendInvite = async (admin, req = null) => {
  const token = generateInviteToken();
  const inviteTokenExpiresAt = getInviteExpiryDate();
  const acceptUrl = buildAcceptUrl(token, req);

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
  DEFAULT_LOCAL_FRONTEND_URL,
  DEFAULT_PRODUCTION_FRONTEND_URL,
  isLocalhostUrl,
  isProductionContext,
  resolveFrontendBaseUrl,
  buildAcceptUrl,
  issueAndSendInvite,
  findAdminByInviteToken,
  isInviteTokenValid,
};
