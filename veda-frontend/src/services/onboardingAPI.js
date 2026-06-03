import axios from "axios";
import config from "../config";
import { getAuthToken } from "../utils/authSession";

const API_URL = `${config.API_BASE_URL}/onboarding`;

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const googleOnboardingAuth = async (credential) => {
  const { data } = await axios.post(`${API_URL}/auth/google`, { credential });
  return data;
};

export const emailOnboardingAuth = async ({
  fullName,
  email,
  password,
  confirmPassword,
}) => {
  const { data } = await axios.post(`${API_URL}/auth/email`, {
    fullName,
    email,
    password,
    confirmPassword,
  });
  return data;
};

export const getOnboardingProgress = async () => {
  const { data } = await axios.get(`${API_URL}/progress`, {
    headers: authHeaders(),
  });
  return data;
};

export const advanceOnboardingStep = async (step) => {
  const { data } = await axios.patch(
    `${API_URL}/progress`,
    { step },
    { headers: authHeaders() }
  );
  return data;
};

export const getSchoolInformation = async () => {
  const { data } = await axios.get(`${API_URL}/school-information`, {
    headers: authHeaders(),
  });
  return data;
};

export const saveSchoolInformation = async ({ schoolName, workspaceSlug }) => {
  const { data } = await axios.post(
    `${API_URL}/school-information`,
    { schoolName, workspaceSlug },
    { headers: authHeaders() }
  );
  return data;
};

export const getAdminDetails = async () => {
  const { data } = await axios.get(`${API_URL}/admin-details`, {
    headers: authHeaders(),
  });
  return data;
};

export const saveAdminDetails = async ({
  fullName,
  email,
  countryCode,
  mobileNumber,
}) => {
  const { data } = await axios.post(
    `${API_URL}/admin-details`,
    { fullName, email, countryCode, mobileNumber },
    { headers: authHeaders() }
  );
  return data;
};

export const getCreatePassword = async () => {
  const { data } = await axios.get(`${API_URL}/create-password`, {
    headers: authHeaders(),
  });
  return data;
};

export const saveCreatePassword = async ({ password, confirmPassword }) => {
  const { data } = await axios.post(
    `${API_URL}/create-password`,
    { password, confirmPassword },
    { headers: authHeaders() }
  );
  return data;
};

export const getEmailVerification = async () => {
  const { data } = await axios.get(`${API_URL}/email-verification`, {
    headers: authHeaders(),
  });
  return data;
};

export const sendEmailOtp = async () => {
  const { data } = await axios.post(
    `${API_URL}/send-email-otp`,
    {},
    { headers: authHeaders() }
  );
  return data;
};

export const resendEmailOtp = async () => {
  const { data } = await axios.post(
    `${API_URL}/resend-email-otp`,
    {},
    { headers: authHeaders() }
  );
  return data;
};

export const verifyEmailOtp = async ({ otp }) => {
  const { data } = await axios.post(
    `${API_URL}/verify-email-otp`,
    { otp },
    { headers: authHeaders() }
  );
  return data;
};

export const getOnboardingWorkspace = async () => {
  const { data } = await axios.get(`${API_URL}/workspace`, {
    headers: authHeaders(),
  });
  return data;
};

export const completeOnboarding = async () => {
  const { data } = await axios.post(
    `${API_URL}/complete`,
    {},
    { headers: authHeaders() }
  );
  return data;
};
