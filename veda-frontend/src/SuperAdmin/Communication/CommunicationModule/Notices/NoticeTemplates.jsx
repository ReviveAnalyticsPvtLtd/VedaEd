import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import TemplateModal from "../components/TemplateModal";
import CommunicationAPI from "../communicationAPI";

export default function NoticeTemplates() {
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await CommunicationAPI.getNoticeTemplates();
      setTemplates(response?.data || []);
    } catch (error) {
      console.error("Error fetching notice templates:", error);
      alert(`Failed to fetch notice templates: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (templateData) => {
    try {
      const response = await CommunicationAPI.createNoticeTemplate(templateData);
      setTemplates((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error("Error creating notice template:", error);
      alert(`Failed to create template: ${error.message}`);
      throw error;
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleUpdateTemplate = async (templateData) => {
    if (!editingTemplate?._id) return;

    try {
      const response = await CommunicationAPI.updateNoticeTemplate(
        editingTemplate._id,
        templateData
      );

      setTemplates((prev) =>
        prev.map((template) =>
          template._id === editingTemplate._id ? response.data : template
        )
      );
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error updating notice template:", error);
      alert(`Failed to update template: ${error.message}`);
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      await CommunicationAPI.deleteNoticeTemplate(templateId);
      setTemplates((prev) => prev.filter((template) => template._id !== templateId));
    } catch (error) {
      console.error("Error deleting notice template:", error);
      alert(`Failed to delete template: ${error.message}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-gray-500">
        Loading templates...
      </div>
    );
  }

  return (
       <div className="bg-white rounded-lg shadow">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg p-4 font-semibold">Notice Templates</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center m-4 gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FiPlus size={16} />
          Create Template
        </button>
      </div>

      {/* Templates List */}
      <div className="">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No templates created yet.</p>
            <p className="">
              Click "Create Template" to add your first template.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template._id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {template.title}
                    </h4>
                    <p className="text-gray-600  leading-relaxed">
                      {template.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Edit template"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete template"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        title={editingTemplate ? "Edit Template" : "Add Notice Template"}
        initialTitle={editingTemplate?.title || ""}
        initialMessage={editingTemplate?.message || ""}
      />
    </div>
  );
}
