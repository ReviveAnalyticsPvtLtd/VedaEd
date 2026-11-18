import { authFetch } from "./apiClient";
import config from "../config";
 
// Keep config import for side-effects/consistency; base URL is handled in authFetch.
void config;

// Student API functions
export const studentAPI = {
  // Get all students
  getAllStudents: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `/students?${queryParams}` : `/students`;
      const response = await authFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get single student by ID
  getStudent: async (studentId) => {
    try {
      const response = await authFetch(`/students/${studentId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  // Get student statistics
  getStudentStats: async () => {
    try {
      const response = await authFetch(`/students/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  }
};
