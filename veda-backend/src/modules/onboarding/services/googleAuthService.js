const { OAuth2Client } = require("google-auth-library");

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured on the server");
  }
  return new OAuth2Client(clientId);
};

/**
 * Verifies Google ID token from @react-oauth/google credential response.
 */
async function verifyGoogleCredential(credential) {
  if (!credential || typeof credential !== "string") {
    const error = new Error("Google credential is required");
    error.statusCode = 400;
    throw error;
  }

  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    const error = new Error("Invalid Google token");
    error.statusCode = 401;
    throw error;
  }

  if (!payload.email_verified) {
    const error = new Error("Google email is not verified");
    error.statusCode = 401;
    throw error;
  }

  return {
    googleId: payload.sub,
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    profilePicture: payload.picture || "",
  };
}

module.exports = {
  verifyGoogleCredential,
};
