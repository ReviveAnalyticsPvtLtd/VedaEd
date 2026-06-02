/**
 * Google OAuth client ID (public). CRA injects REACT_APP_* at build/start time.
 * Restart `npm start` in veda-frontend after changing .env files.
 */
export const GOOGLE_CLIENT_ID = (
  process.env.REACT_APP_GOOGLE_CLIENT_ID || ""
).trim();

export const isGoogleOAuthConfigured = () => Boolean(GOOGLE_CLIENT_ID);
