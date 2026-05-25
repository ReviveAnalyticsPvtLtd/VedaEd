import axios from "axios";
import config from "../config";

const API_URL = `${config.API_BASE_URL}/setup-wizard`;

/** Fetch saved setup wizard progress (start page + prefill) */
export const getSetupProgress = async () => {
  const response = await axios.get(`${API_URL}/progress`);
  return response.data;
};

/** Initialize a new setup session */
export const initializeSetup = async () => {
  const response = await axios.post(`${API_URL}/initialize`);
  return response.data;
};

/** Fetch full wizard document for step pages */
export const getSetupWizard = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

/** Save step 1 data */
export const saveSetupProgress = async (payload) => {
  const response = await axios.post(API_URL, payload);
  return response.data;
};

/** Save step 2 organization type */
export const saveOrganizationType = async (payload) => {
  const response = await axios.post(`${API_URL}/step-2`, payload);
  return response.data;
};

/** Upload school logo for step 3 */
export const uploadSchoolLogo = async (file) => {
  const formData = new FormData();
  formData.append("schoolLogo", file);
  const response = await axios.post(`${API_URL}/step-3/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/** Save step 3 school profile */
export const saveSchoolProfile = async (payload) => {
  const response = await axios.post(`${API_URL}/step-3`, payload);
  return response.data;
};

/** Save step 4 school type & curriculum */
export const saveSchoolTypeCurriculum = async (payload) => {
  const response = await axios.post(`${API_URL}/step-4`, payload);
  return response.data;
};

/** Generate curriculum recommendation from current selections */
export const generateSetupRecommendation = async (payload) => {
  const response = await axios.post(`${API_URL}/recommendation/generate`, payload);
  return response.data;
};

/** Fetch stored / regenerated recommendation for step 4 */
export const getSetupRecommendation = async () => {
  const response = await axios.get(`${API_URL}/recommendation`);
  return response.data;
};

/** Save step 5 module selection */
export const saveModuleSelection = async (payload) => {
  const response = await axios.post(`${API_URL}/step-5`, payload);
  return response.data;
};

/** Save step 6 academic structure */
export const saveAcademicStructure = async (payload) => {
  const response = await axios.post(`${API_URL}/step-6`, payload);
  return response.data;
};

/** Fetch step 7 roles & HR foundation */
export const getRolesHrFoundation = async () => {
  const response = await axios.get(`${API_URL}/step-7`);
  return response.data;
};

/** Save step 7 roles & HR foundation */
export const saveRolesHrFoundation = async (payload) => {
  const response = await axios.post(`${API_URL}/step-7`, payload);
  return response.data;
};

/** Update a single optional role toggle */
export const updateStep7Role = async (payload) => {
  const response = await axios.put(`${API_URL}/step-7/roles`, payload);
  return response.data;
};

/** Remove an optional role */
export const deleteStep7Role = async (roleKey) => {
  const encoded = encodeURIComponent(roleKey);
  const response = await axios.delete(`${API_URL}/step-7/roles/${encoded}`);
  return response.data;
};

/** Fetch step 8 attendance rules */
export const getAttendanceRules = async () => {
  const response = await axios.get(`${API_URL}/step-8`);
  return response.data;
};

/** Save step 8 attendance rules */
export const saveAttendanceRules = async (payload) => {
  const response = await axios.post(`${API_URL}/step-8`, payload);
  return response.data;
};

/** Update step 8 attendance rules */
export const updateAttendanceRules = async (payload) => {
  const response = await axios.put(`${API_URL}/step-8`, payload);
  return response.data;
};

/** Patch step 8 permission/notification toggles */
export const patchAttendanceToggle = async (payload) => {
  const response = await axios.patch(`${API_URL}/step-8/toggles`, payload);
  return response.data;
};

/** Fetch step 9 examination & gradebook setup */
export const getExaminationGradebookSetup = async () => {
  const response = await axios.get(`${API_URL}/step-9`);
  return response.data;
};

/** Save step 9 examination & gradebook setup */
export const saveExaminationGradebookSetup = async (payload) => {
  const response = await axios.post(`${API_URL}/step-9`, payload);
  return response.data;
};

/** Update step 9 examination & gradebook setup */
export const updateExaminationGradebookSetup = async (payload) => {
  const response = await axios.put(`${API_URL}/step-9`, payload);
  return response.data;
};

/** Patch grade scale settings independently */
export const patchExaminationGradeScale = async (payload) => {
  const response = await axios.patch(`${API_URL}/step-9/grade-scale`, payload);
  return response.data;
};

/** Remove one grade row */
export const deleteExaminationGradeRow = async (rowId) => {
  const encoded = encodeURIComponent(rowId);
  const response = await axios.delete(`${API_URL}/step-9/grade-rows/${encoded}`);
  return response.data;
};

/** Remove one assessment weightage row */
export const deleteExaminationWeightageRow = async (rowId) => {
  const encoded = encodeURIComponent(rowId);
  const response = await axios.delete(
    `${API_URL}/step-9/weightage-rows/${encoded}`
  );
/** Save step 10 fee setup */
export const saveFeeSetup = async (payload) => {
  const response = await axios.post(`${API_URL}/step-10`, payload);
  return response.data;
};

/** Save step 11 communication setup */
export const saveCommunicationSetup = async (payload) => {
  const response = await axios.post(`${API_URL}/step-11`, payload);
  return response.data;
};

/** Get step 12 review summary */
export const getSetupReview = async () => {
  const response = await axios.get(`${API_URL}/step-12/review`);
  return response.data;
};

/** Launch school setup (step 12) */
export const launchSchoolSetup = async (payload) => {
  const response = await axios.post(`${API_URL}/step-12/launch`, payload);
  return response.data;
};
