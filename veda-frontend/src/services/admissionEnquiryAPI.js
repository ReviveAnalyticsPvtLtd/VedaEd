import api from "../services/apiClient";
import config from '../config';

const API_URL = `${config.API_BASE_URL}/admission-enquiry`;

export const getEnquiries = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const createEnquiry = async (enquiryData) => {
    const response = await api.post(API_URL, enquiryData);
    return response.data;
};

export const updateEnquiry = async (id, enquiryData) => {
    const response = await api.put(`${API_URL}/${id}`, enquiryData);
    return response.data;
};

export const deleteEnquiry = async (id) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};
