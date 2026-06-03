# Google Sign-In setup

This app uses **@react-oauth/google** (Google Identity Services button). It returns an ID token in the browser — **not** a redirect to `/callback/google`.

## Fix "The given origin is not allowed for the given client ID"

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Edit your OAuth 2.0 Client ID (type must be **Web application**).
3. Under **Authorized JavaScript origins**, add exactly:
   - `http://localhost:3000`
   - Your production URL when deployed (e.g. `https://veda-ed.vercel.app`)
4. Save and wait 1–5 minutes for changes to propagate.
5. Open the app at `http://localhost:3000` (not `127.0.0.1`) unless you also add `http://127.0.0.1:3000` as an origin.

## Redirect URIs (usually not needed here)

**Authorized redirect URIs** such as `http://localhost:3000/callback/google` do **not** fix the origin error for this flow. This project has no `/callback/google` route.

You only need redirect URIs if you switch to a server-side OAuth redirect flow later.

## Environment variables

- **Frontend** (`veda-frontend/.env`): `REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
- **Backend** (`veda-backend/.env`): `GOOGLE_CLIENT_ID` must match the same client ID.

Restart both `npm start` (frontend) and `npm run dev` (backend) after changing `.env` files.
