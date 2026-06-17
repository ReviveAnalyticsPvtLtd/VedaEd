import React, { useState } from "react";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import TemplateModal from "../components/TemplateModal";

export default function Templates() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      title: "Exam Reminder",
      message:
        "Dear student, please note that your exam is scheduled for tomorrow. Please bring your admit card and arrive 30 minutes early.",
    },
    {
      id: 2,
      title: "Fee Payment",
      message:
        "This is a reminder that your monthly fee payment is due. Please make the payment at your earliest convenience.",
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleCreateTemplate = (templateData) => {
    const newTemplate = {
      id: Date.now(),
      ...templateData,
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleUpdateTemplate = (templateData) => {
    setTemplates(
      templates.map((template) =>
        template.id === editingTemplate.id
          ? { ...template, ...templateData }
          : template
      )
    );
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((template) => template.id !== templateId));
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
              <div key={template.id} className="p-4">
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
                      onClick={() => handleDeleteTemplate(template.id)}
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
