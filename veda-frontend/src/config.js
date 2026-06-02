const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
let API_BASE_URL = process.env.REACT_APP_API_URL || `${SERVER_URL}/api`;

// Ensure API_BASE_URL ends with /api
if (!API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = `${API_BASE_URL}/api`;
}

const GOOGLE_CLIENT_ID = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();

const config = {
    SERVER_URL,
    API_BASE_URL,
    GOOGLE_CLIENT_ID,
};

export default config;
