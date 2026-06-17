import config from '../../../config';
const API_BASE_URL = `${config.API_BASE_URL}/communication`;

class CommunicationAPI {
  // Notice API methods
  static async createNotice(noticeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notice:', error);
      throw error;
    }
  }

  static async getNotices(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/notices?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notices:', error);
      throw error;
    }
  }

  static async getPublishedNotices(userId, userModel, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/notices/published/${userId}/${userModel}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch published notices');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching published notices:', error);
      throw error;
    }
  }

  static async getNotice(noticeId, userId = null, userModel = null) {
    try {
      const queryParams = new URLSearchParams();
      if (userId && userModel) {
        queryParams.append('userId', userId);
        queryParams.append('userModel', userModel);
      }

      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notice:', error);
      throw error;
    }
  }

  static async updateNotice(noticeId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notice:', error);
      throw error;
    }
  }

  static async publishNotice(noticeId, userId, userModel) {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userModel })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish notice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error publishing notice:', error);
      throw error;
    }
  }

  static async deleteNotice(noticeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notice:', error);
      throw error;
    }
  }

  // Notice template API methods
  static async createNoticeTemplate(templateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notice-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notice template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notice template:', error);
      throw error;
    }
  }

  static async getNoticeTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/notice-templates`);

      if (!response.ok) {
        throw new Error('Failed to fetch notice templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notice templates:', error);
      throw error;
    }
  }

  static async updateNoticeTemplate(templateId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notice template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notice template:', error);
      throw error;
    }
  }

  static async deleteNoticeTemplate(templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notice template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notice template:', error);
      throw error;
    }
  }

  // Message API methods
  static async createMessage(messageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  static async getMessages(userId, userModel, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/messages/${userId}/${userModel}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async getSentMessages(userId, userModel, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/messages/sent/${userId}/${userModel}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sent messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      throw error;
    }
  }

  // Complaint API methods
  static async createComplaint(complaintData) {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create complaint');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  static async getComplaints(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/complaints?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  }

  static async getUserComplaints(userId, userModel, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/complaints/user/${userId}/${userModel}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user complaints');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user complaints:', error);
      throw error;
    }
  }

  // File upload
  static async uploadAttachment(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/attachment`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Communication logs
  static async getCommunicationLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/logs?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch communication logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      throw error;
    }
  }

  static async getUserLogs(userId, userModel, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/logs/user/${userId}/${userModel}?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user logs:', error);
      throw error;
    }
  }

  static async getCommunicationStats(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_BASE_URL}/logs/stats/summary?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch communication stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      throw error;
    }
  }
}

export default CommunicationAPI;
