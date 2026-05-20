const buildAdminInviteEmail = ({
  fullName,
  adminType,
  school,
  campus,
  scope,
  acceptUrl,
  expiresHours = 48,
}) => {
  const campusLine =
    campus && scope
      ? `Your access is limited to <strong>${campus}, ${scope}</strong>.`
      : campus
      ? `Your access is limited to <strong>${campus}</strong>.`
      : scope
      ? `Your access is limited to <strong>${scope}</strong>.`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:24px;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="padding:28px 32px 24px;">
      <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#2563eb;">RA VedaSchool</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Welcome to VedaSchool</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello ${fullName},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">
        You have been invited as an <strong>${adminType}</strong> for <strong>${school || "your institution"}</strong>.
      </p>
      ${campusLine ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${campusLine}</p>` : ""}
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        Please accept the invitation to activate your account. Sign in with the initial password provided by your administrator—you can change it anytime after logging in.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${acceptUrl}"
          style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
          padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
          Accept Invitation
        </a>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
        This secure invite link will expire in ${expiresHours} hours.
        If you did not expect this invitation, contact the school administrator.
      </p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { buildAdminInviteEmail };
