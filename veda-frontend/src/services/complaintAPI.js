import api from "../services/apiClient";
import config from '../config';

const API_URL = `${config.API_BASE_URL}/communication`; // Adjust as needed

const complaintAPI = {
    createComplaint: async (data) => {
        const response = await api.post(`${API_URL}/complaints`, data);
        return response.data;
    },

    getComplaints: async (params) => {
        const response = await api.get(`${API_URL}/complaints`, { params });
        return response.data;
    },

    getUserComplaints: async (userId, userModel, params) => {
        const response = await api.get(`${API_URL}/complaints/user/${userId}/${userModel}`, { params });
        return response.data;
    },

    getComplaint: async (complaintId, params) => {
        const response = await api.get(`${API_URL}/complaints/${complaintId}`, { params });
        return response.data;
    },

    updateStatus: async (complaintId, data) => {
        const response = await api.put(`${API_URL}/complaints/${complaintId}/status`, data);
        return response.data;
    },

    assignComplaint: async (complaintId, data) => {
        const response = await api.put(`${API_URL}/complaints/${complaintId}/assign`, data);
        return response.data;
    },

    addResponse: async (complaintId, data) => {
        const response = await api.put(`${API_URL}/complaints/${complaintId}/response`, data);
        return response.data;
    },

    resolveComplaint: async (complaintId, data) => {
        const response = await api.put(`${API_URL}/complaints/${complaintId}/resolve`, data);
        return response.data;
    },

    deleteComplaint: async (complaintId) => {
        const response = await api.delete(`${API_URL}/complaints/${complaintId}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get(`${API_URL}/complaints/stats/summary`);
        return response.data;
    }
};

export default complaintAPI;
