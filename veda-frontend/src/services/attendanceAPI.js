import api from "./apiClient";

const API_URL = `/attendance`;

export const getAttendanceSummary = async () => {
    const response = await api.get(`${API_URL}/summary`);
    return response.data;
};

export const getRecentAttendance = async () => {
    const response = await api.get(`${API_URL}/recent`);
    return response.data;
};

export const getWeeklyStats = async () => {
    const response = await api.get(`${API_URL}/weekly`);
    return response.data;
};

export const markClassAttendance = async (attendanceData) => {
    const response = await api.post(`${API_URL}/class`, attendanceData);
    return response.data;
};

export const getAttendanceByClass = async (classId, sectionId, date) => {
    const response = await api.get(`${API_URL}/class/${classId}/${sectionId}/${date}`);
    return response.data;
};

export const getAttendanceByDate = async (date) => {
    const response = await api.get(`${API_URL}/date/${date}`);
    return response.data;
};

