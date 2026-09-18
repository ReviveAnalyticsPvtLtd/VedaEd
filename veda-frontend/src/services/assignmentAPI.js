// API service for assignments
import config from '../config';
import { authFetch } from "./apiClient";
const API_BASE_URL = config.API_BASE_URL;

// Assignment API functions
export const assignmentAPI = {
  // Get all assignments with optional filters
  getAssignments: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
      if (filters.studentId) queryParams.append('studentId', filters.studentId);

      const response = await authFetch(`/assignments${queryParams.toString() ? '?' + queryParams.toString() : ''}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Get single assignment by ID
  getAssignmentById: async (id) => {
    try {
      const response = await authFetch(`/assignments/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  // Create new assignment
  createAssignment: async (assignmentData) => {
    try {
      const formData = new FormData();

      console.log('Creating assignment with data:', assignmentData);

      // Append all form fields
      Object.keys(assignmentData).forEach(key => {
        if (key === 'file' && assignmentData[key]) {
          formData.append('document', assignmentData[key]);
          console.log('Added file:', assignmentData[key].name);
        } else if (assignmentData[key] !== null && assignmentData[key] !== undefined) {
          formData.append(key, assignmentData[key]);
        }
      });

      const response = await authFetch(`/assignments`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Assignment creation failed:', result);
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Assignment created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (id, assignmentData) => {
    try {
      const formData = new FormData();

      // Append all form fields
      Object.keys(assignmentData).forEach(key => {
        if (key === 'file' && assignmentData[key]) {
          formData.append('document', assignmentData[key]);
        } else if (assignmentData[key] !== null && assignmentData[key] !== undefined) {
          formData.append(key, assignmentData[key]);
        }
      });

      const response = await authFetch(`/assignments/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  // Submit assignment file (student)
  submitAssignment: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch(`/assignments/${id}/submit`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  },

  // Delete student's own submission
  deleteSubmission: async (id) => {
    try {
      const response = await authFetch(`/assignments/${id}/submission`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  },

  // Grade a submission (teacher)
  gradeSubmission: async (assignmentId, submissionId, payload) => {
    try {
      const response = await authFetch(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (id) => {
    try {
      const response = await authFetch(`/assignments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }
};

// Dropdown data API functions
export const dropdownAPI = {
  // Get all classes
  getClasses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result; // Return data field if exists, otherwise return the whole response
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  // Get all sections
  getSections: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sections`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result; // Return data field if exists, otherwise return the whole response
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  },

  // Get sections for a specific class
  getSectionsByClass: async (classId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sections?classId=${classId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching class sections:', error);
      throw error;
    }
  },

  // Get all subjects (backend requires JWT — same as assignmentAPI)
  getSubjects: async () => {
    try {
      const response = await authFetch('/subjects');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result; // Return data field if exists, otherwise return the whole response
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  // Get all subject groups (class-subject mapping)
  getSubjectGroups: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subGroups`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching subject groups:', error);
      throw error;
    }
  },
};
