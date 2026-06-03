const nodemailer = require("nodemailer");
const { buildAdminInviteEmail } = require("./adminInviteEmailTemplate");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("Email service is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
};

const sendAdminInvitationEmail = async ({
  to,
  fullName,
  adminType,
  school,
  campus,
  scope,
  acceptUrl,
}) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const html = buildAdminInviteEmail({
    fullName,
    adminType,
    school,
    campus,
    scope,
    acceptUrl,
    expiresHours: Number(process.env.INVITE_EXPIRY_HOURS || 48),
  });

  const info = await getTransporter().sendMail({
    from: `"VedaSchool" <${from}>`,
    to,
    subject: `You're invited to join ${school || "VedaSchool"} as ${adminType}`,
    html,
    text: [
      `Hello ${fullName},`,
      "",
      `You have been invited as ${adminType} for ${school || "your institution"}.`,
      campus && scope
        ? `Your access is limited to ${campus}, ${scope}.`
        : "",
      "",
      `Accept your invitation: ${acceptUrl}`,
      "",
      `This link expires in ${process.env.INVITE_EXPIRY_HOURS || 48} hours.`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return info;
};

const sendEmailVerificationOtp = async ({ to, otp }) => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const text = [
    "Your verification code is:",
    "",
    otp,
    "",
    "This code will expire in 2 minutes.",
    "",
    "If you did not request this code, please ignore this email.",
  ].join("\n");

  const info = await getTransporter().sendMail({
    from: `"VedaSchool" <${from}>`,
    to,
    subject: "Verify Your Email Address",
    text,
    html: [
      "<p>Your verification code is:</p>",
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:16px 0;">${otp}</p>`,
      "<p>This code will expire in 2 minutes.</p>",
      "<p>If you did not request this code, please ignore this email.</p>",
    ].join(""),
  });

  return info;
};

module.exports = { sendAdminInvitationEmail, sendEmailVerificationOtp };
