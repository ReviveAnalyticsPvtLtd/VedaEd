import React, { useState } from "react";
import { initialTemplates } from "./templateData";

export default function Templates({ templates, setTemplates }) {
  const [localTemplates, setLocalTemplates] = useState(initialTemplates);

  const templateList = templates ?? localTemplates;
  const updateTemplates = setTemplates ?? setLocalTemplates;

  const [selectedType, setSelectedType] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates = templateList.filter((template) => {
    const typeMatch = selectedType === "All" || template.type === selectedType;
    const categoryMatch =
      selectedCategory === "All" || template.category === selectedCategory;
    return typeMatch && categoryMatch;
  });

  const handleEditTemplate = (templateId) => {
    // TODO: Implement edit functionality
    console.log("Edit template:", templateId);
  };

  const handleDeleteTemplate = (templateId) => {
    updateTemplates(templateList.filter((t) => t.id !== templateId));
  };

  const handleUseTemplate = (template) => {
    // TODO: Navigate to message form with template content
    console.log("Use template:", template);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Message Templates (Teacher)</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
           + Create New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-3">
        <div>
          <label className="block  font-medium text-gray-600 mb-1">
            Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="SMS">SMS</option>
            <option value="Email">Email</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2  focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Communication">Communication</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {template.name}
                    </h4>
                    <span
                      className={`px-2 py-1  rounded ${
                        template.type === "SMS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {template.type}
                    </span>
                    <span className="px-2 py-1  rounded bg-gray-100 text-gray-800">
                      {template.category}
                    </span>
                  </div>
                  <p className=" text-gray-600 mb-3">
                    {template.content}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="bg-blue-600 text-white px-3 py-1 rounded  hover:bg-blue-700 transition"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template.id)}
                    className="bg-gray-600 text-white px-3 py-1 rounded  hover:bg-gray-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded  hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No templates found matching the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
