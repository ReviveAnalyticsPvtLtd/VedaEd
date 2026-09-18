import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import TemplateModal from "../components/TemplateModal";
import CommunicationAPI from "../communicationAPI";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await CommunicationAPI.getMessageTemplates();
      setTemplates(response?.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching message templates:", err);
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (templateData) => {
    try {
      const response = await CommunicationAPI.createMessageTemplate(templateData);
      setTemplates((prev) => [response.data, ...prev]);
      setError("");
    } catch (err) {
      console.error("Error creating message template:", err);
      setError("Failed to create template. Please try again.");
      throw err;
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      const response = await CommunicationAPI.updateMessageTemplate(
        editingTemplate._id,
        templateData
      );
      setTemplates((prev) =>
        prev.map((template) =>
          template._id === editingTemplate._id
            ? { ...template, ...response.data }
            : template
        )
      );
      setEditingTemplate(null);
      setError("");
    } catch (err) {
      console.error("Error updating message template:", err);
      setError("Failed to update template. Please try again.");
      throw err;
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await CommunicationAPI.deleteMessageTemplate(templateId);
        setTemplates(templates.filter((template) => template._id !== templateId));
        setError("");
      } catch (err) {
        console.error("Error deleting message template:", err);
        setError("Failed to delete template. Please try again.");
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg p-4 font-semibold">SMS Templates</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 m-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FiPlus size={16} />
          Create Template
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-4 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Templates List */}
      <div className="">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading templates...</div>
        ) : templates.length === 0 ? (
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
        title={editingTemplate ? "Edit Template" : "Add SMS Template"}
        initialTitle={editingTemplate?.title || ""}
        initialMessage={editingTemplate?.message || ""}
      />
    </div>
  );
}