import api from "./apiClient";

const API_URL = "/calendar/events";

export const getAllEvents = async () => {
    try {
        const response = await api.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
    }
};

export const createEvent = async (eventData) => {
    try {
        const response = await api.post(API_URL, eventData);
        return response.data;
    } catch (error) {
        console.error("Error creating calendar event:", error);
        throw error;
    }
};

export const updateEvent = async (id, eventData) => {
    try {
        const response = await api.put(`${API_URL}/${id}`, eventData);
        return response.data;
    } catch (error) {
        console.error("Error updating calendar event:", error);
        throw error;
    }
};

export const deleteEvent = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        throw error;
    }
};

export const getAcademicYear = async () => {
    try {
        const response = await api.get("/calendar/academic-year");
        return response.data;
    } catch (error) {
        console.error("Error fetching academic year:", error);
        throw error;
    }
};

export const saveAcademicYear = async (data) => {
    try {
        const response = await api.post("/calendar/academic-year", data);
        return response.data;
    } catch (error) {
        console.error("Error saving academic year:", error);
        throw error;
    }
};

