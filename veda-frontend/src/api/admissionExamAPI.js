import api from '../services/apiClient';
import config from '../config';

const API_BASE_URL = `${config.API_BASE_URL}/admission`;

// ENTRANCE EXAM

export const getEntranceCandidates = async () => {
    try {
        const response = await api.get(`${API_BASE_URL}/entrance-exam`);
        return response.data;
    } catch (error) {
        console.error("Error fetching entrance candidates:", error);
        throw error;
    }
};

export const scheduleEntranceExam = async (data) => {
    try {
        const response = await api.post(`${API_BASE_URL}/entrance-exam/schedule`, data);
        return response.data;
    } catch (error) {
        console.error("Error scheduling entrance exam:", error);
        throw error;
    }
};

export const updateEntranceResult = async (id, data) => {
    try {
        const response = await api.put(`${API_BASE_URL}/entrance-exam/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating entrance result:", error);
        throw error;
    }
};

export const declareEntranceResult = async (data) => {
    try {
        const response = await api.post(`${API_BASE_URL}/entrance-exam/result`, data);
        return response.data;
    } catch (error) {
        console.error("Error declaring entrance result:", error);
        throw error;
    }
};

export const getVacancies = async () => {
    try {
        const response = await api.get(`${API_BASE_URL}/vacancy`);
        return response.data;
    } catch (error) {
        console.error("Error fetching vacancies:", error);
        throw error;
    }
};

// INTERVIEW

export const getInterviewCandidates = async () => {
    try {
        const response = await api.get(`${API_BASE_URL}/interview`);
        return response.data;
    } catch (error) {
        console.error("Error fetching interview candidates:", error);
        throw error;
    }
};

export const scheduleInterview = async (data) => {
    try {
        const response = await api.post(`${API_BASE_URL}/interview/schedule`, data);
        return response.data;
    } catch (error) {
        console.error("Error scheduling interview:", error);
        throw error;
    }
};

export const updateInterviewResult = async (id, data) => {
    try {
        const response = await api.put(`${API_BASE_URL}/interview/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating interview result:", error);
        throw error;
    }
};

export const declareInterviewResult = async (data) => {
    try {
        const response = await api.post(`${API_BASE_URL}/interview/result`, data);
        return response.data;
    } catch (error) {
        console.error("Error declaring interview result:", error);
        throw error;
    }
};
