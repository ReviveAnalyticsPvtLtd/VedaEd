import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

export default function TemplateModal({
  isOpen,
  onClose,
  onSave,
  title = "Add Template",
  initialTitle = "",
  initialMessage = "",
}) {
  const [templateTitle, setTemplateTitle] = useState(initialTitle);
  const [templateMessage, setTemplateMessage] = useState(initialMessage);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTemplateTitle(initialTitle);
      setTemplateMessage(initialMessage);
    }
  }, [isOpen, initialTitle, initialMessage]);

  const handleSave = async () => {
    if (templateTitle.trim() && templateMessage.trim()) {
      try {
        setIsSaving(true);
        await onSave({
          title: templateTitle.trim(),
          message: templateMessage.trim(),
        });
        // Reset form
        setTemplateTitle("");
        setTemplateMessage("");
        onClose();
      } catch (error) {
        // Parent handles the error message; keep modal open for correction/retry.
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setTemplateTitle("");
    setTemplateMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter template title"
              required
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter template message"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!templateTitle.trim() || !templateMessage.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
