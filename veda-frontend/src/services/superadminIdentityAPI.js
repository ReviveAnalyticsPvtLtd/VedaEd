import config from "../config";

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const parseResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload;
};

const base = `${config.API_BASE_URL}/superadmin/identity`;

export const superadminIdentityAPI = {
  getMeta: async () => {
    const response = await fetch(`${base}/meta`, {
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to load options");
  },

  getNextEmployeeId: async () => {
    const response = await fetch(`${base}/next-employee-id`, {
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to generate employee ID");
  },

  listAdmins: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${base}/admins?${query}`, {
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to fetch admins");
  },

  getAdmin: async (id) => {
    const response = await fetch(`${base}/admins/${id}`, {
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to fetch admin");
  },

  createAdmin: async (data) => {
    const response = await fetch(`${base}/admins`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return parseResponse(response, "Failed to create admin");
  },

  updateAdmin: async (id, data) => {
    const response = await fetch(`${base}/admins/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return parseResponse(response, "Failed to update admin");
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${base}/admins/${id}/status`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });
    return parseResponse(response, "Failed to update status");
  },

  validateAccess: async (data) => {
    const response = await fetch(`${base}/validate`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return parseResponse(response, "Validation failed");
  },

  getDefaultPermissions: async (adminType) => {
    const response = await fetch(
      `${base}/permissions/default?adminType=${encodeURIComponent(adminType)}`,
      { headers: authHeaders({ "Content-Type": "application/json" }) }
    );
    return parseResponse(response, "Failed to load permissions");
  },

  sendInvite: async (id) => {
    const response = await fetch(`${base}/admins/${id}/send-invite`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to send invitation");
  },

  resendInvite: async (id) => {
    const response = await fetch(`${base}/admins/${id}/resend-invite`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
    });
    return parseResponse(response, "Failed to resend invitation");
  },

  validateInviteToken: async (token) => {
    const response = await fetch(
      `${base}/invite/validate?token=${encodeURIComponent(token)}`
    );
    return parseResponse(response, "Invalid invitation link");
  },

  acceptInvite: async ({ token, password }) => {
    const response = await fetch(`${base}/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    return parseResponse(response, "Failed to accept invitation");
  },
};
