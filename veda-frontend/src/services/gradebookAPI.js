import api from './apiClient';
import config from '../config';

const API_URL = `${config.API_BASE_URL}/gradebook`;

const gradebookAPI = {
    saveMarks: async (data) => {
        try {
            const response = await api.post(`${API_URL}/save`, data);
            return response.data;
        } catch (error) {
            console.error('Error saving marks:', error);
            throw error;
        }
    },

    getMarks: async (params) => {
        try {
            const response = await api.get(`${API_URL}/marks`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching marks:', error);
            throw error;
        }
    },

    getStudents: async (params) => {
        try {
            const response = await api.get(`${API_URL}/students`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching students for gradebook:', error);
            throw error;
        }
    }
};

export default gradebookAPI;

