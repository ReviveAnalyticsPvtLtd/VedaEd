import api from './apiClient';
import config from '../config';

const API_URL = `${config.API_BASE_URL}/discipline`;

const disciplineAPI = {
    getAllIncidents: async () => {
        const response = await api.get(`${API_URL}`);
        return response.data;
    },

    createIncident: async (data) => {
        const response = await api.post(`${API_URL}`, data);
        return response.data;
    },

    updateIncident: async (id, data) => {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    deleteIncident: async (id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    }
};

export default disciplineAPI;

