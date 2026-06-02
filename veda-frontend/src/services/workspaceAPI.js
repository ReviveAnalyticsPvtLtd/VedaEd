import axios from "axios";
import config from "../config";
import { getAuthToken } from "../utils/authSession";

const API_URL = `${config.API_BASE_URL}/workspace`;

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkWorkspaceAvailability = async ({ schoolName, workspaceSlug }) => {
  const { data } = await axios.post(
    `${API_URL}/check`,
    { schoolName, workspaceSlug },
    { headers: authHeaders() }
  );
  return data;
};
