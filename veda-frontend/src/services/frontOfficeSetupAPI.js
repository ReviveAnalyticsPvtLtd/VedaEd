import api from "../services/apiClient";
import config from "../config";

const API_URL = `${config.API_BASE_URL}/front-office-setup`;

export const getSetups = async (type) => {
    const response = await api.get(`${API_URL}?type=${type}`);
    return response.data;
};

export const createSetup = async (setupData) => {
    const response = await api.post(API_URL, setupData);
    return response.data;
};

export const updateSetup = async (id, setupData) => {
    const response = await api.put(`${API_URL}/${id}`, setupData);
    return response.data;
};

export const deleteSetup = async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};
