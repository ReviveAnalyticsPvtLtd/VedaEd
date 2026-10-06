import api from './apiClient'

const classAPI = {
    // Get all classes (includes sections)
    getAllClasses: async () => {
        try {
            const response = await api.get('/classes');
            return response.data;
        } catch (error) {
            console.error('Error fetching classes:', error);
            throw error;
        }
    },

    // Get data for a specific class and section (includes students)
    getClassSectionData: async (classId, sectionId) => {
        try {
            const response = await api.get(`/classes/${classId}/sections/${sectionId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching class section data:', error);
            throw error;
        }
    }
};

export default classAPI;
