import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CommunicationAPI from "../communicationAPI";
import classAPI from "../../services/classAPI";
import { FiEye, FiCheckCircle, FiFileText } from "react-icons/fi";

export default function PostNotices() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [publishOn, setPublishOn] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audience selection state
  const [audienceType, setAudienceType] = useState("all"); // 'all', 'roles', 'classes'
  const [selectedRoles, setSelectedRoles] = useState({
    Student: false,
    Parent: false,
    Teacher: false,
    Staff: false
  });
  
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSections, setSelectedSections] = useState([]); // List of section IDs
  const [availableSections, setAvailableSections] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user profile & classes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);

    const loadClasses = async () => {
      try {
        const response = await classAPI.getAllClasses();
        if (response?.success) {
          setClassList(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    };
    loadClasses();
  }, []);

  // Update sections when class changes
  useEffect(() => {
    if (selectedClass) {
      const selectedClsObj = classList.find(c => c._id === selectedClass);
      if (selectedClsObj) {
        setAvailableSections(selectedClsObj.sections || []);
        setSelectedSections([]);
      }
    } else {
      setAvailableSections([]);
      setSelectedSections([]);
    }
  }, [selectedClass, classList]);

  const toggleRole = (role) => {
    setSelectedRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const toggleSection = (sectionId) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setAttachmentName(file ? file.name : "");
    setAttachmentFile(file);
  };

  // Compile notice data object
  const getNoticeData = () => {
    // Map audience type to model fields
    let targetAudience = "all";
    let specificTargets = [];
    let specificTargetModel = null;
    let tags = [];

    if (audienceType === "roles") {
      const activeRoles = Object.keys(selectedRoles).filter(r => selectedRoles[r]);
      tags = activeRoles;
      if (activeRoles.length === 1) {
        targetAudience = activeRoles[0].toLowerCase() + "s";
      } else {
        targetAudience = "all";
      }
    } else if (audienceType === "classes") {
      if (selectedSections.length > 0) {
        targetAudience = "specific_class";
        specificTargets = selectedSections;
        specificTargetModel = "Section";
      } else if (selectedClass) {
        targetAudience = "specific_class";
        specificTargets = [selectedClass];
        specificTargetModel = "Class";
      }
    }

    // Dynamic Author mapping
    const authorId = (currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "superadmin")
      ? currentUser?._id
      : currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
    const authorModel = currentUser?.role?.toLowerCase() === "teacher" 
      ? "Teacher" 
      : (currentUser?.role?.toLowerCase() === "admin" || currentUser?.role?.toLowerCase() === "superadmin")
      ? "Admin"
      : "Staff";

    return {
      title: title.trim(),
      content: message.trim(),
      author: authorId,
      authorModel: authorModel,
      category,
      priority,
      targetAudience,
      specificTargets,
      specificTargetModel,
      attachments: [],
      publishDate: publishOn ? new Date(publishOn).toISOString() : new Date().toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      isPinned: false,
      tags,
      status: "draft"
    };
  };

  const canSubmit = () => {
    if (!title.trim() || !message.trim()) return false;
    if (audienceType === "roles") {
      return Object.values(selectedRoles).some(val => val);
    }
    if (audienceType === "classes") {
      return !!selectedClass;
    }
    return true;
  };

  const handleSubmit = async (e, shouldPublishDirectly = false) => {
    if (e) e.preventDefault();
    if (!canSubmit() || isLoading) return;

    setIsLoading(true);
    try {
      const noticeData = getNoticeData();

      // Upload attachment if present
      if (attachmentFile) {
        try {
          const uploadResponse = await CommunicationAPI.uploadAttachment(attachmentFile);
          if (uploadResponse?.success) {
            noticeData.attachments = [
              {
                filename: uploadResponse.data.filename,
                originalName: uploadResponse.data.originalName,
                path: uploadResponse.data.path,
                size: uploadResponse.data.size,
              }
            ];
          }
        } catch (uploadError) {
          console.error("Error uploading attachment:", uploadError);
        }
      }

      // 1. Create notice as draft
      const createResponse = await CommunicationAPI.createNotice(noticeData);

      // 2. Publish direct if requested
      if (shouldPublishDirectly && createResponse?.success) {
        const authorId = currentUser?.refId || currentUser?._id || "68c1b2977fa6e0a4c8af3242";
        const authorModel = currentUser?.role?.toLowerCase() === "teacher" ? "Teacher" : "Staff";
        
        await CommunicationAPI.publishNotice(
          createResponse.data._id,
          authorId,
          authorModel
        );
        alert("Notice published successfully!");
      } else {
        alert("Notice saved as draft successfully!");
      }

      navigate("/communication/logs");
    } catch (error) {
      console.error("Error submitting notice:", error);
      alert(`Failed to save notice: ${error.message}`);
    } finally {
      setIsLoading(false);
      setPreviewOpen(false);
    }
  };

  return (
    <div className="p-0 m-0 space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiFileText className="text-blue-600" /> Compose Announcement Notice
        </h3>
        
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notice Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notice title"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notice Category
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="general">General Notices</option>
                <option value="academic">Academic Notices</option>
                <option value="exam">Examination Notices</option>
                <option value="event">Event Updates</option>
                <option value="emergency">Emergency Alerts</option>
                <option value="maintenance">Maintenance/Ops Notices</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Priority Level
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publish Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Publish Date (Immediate if blank)
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={publishOn}
                onChange={(e) => setPublishOn(e.target.value)}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notice Details Message <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type the announcement details here..."
              required
            />
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              File Attachment (PDF or Image)
            </label>
            <input 
              type="file" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {attachmentName && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                Selected: {attachmentName}
              </p>
            )}
          </div>

          {/* Target Audience Logic */}
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h4 className="text-md font-semibold text-gray-800 mb-3">Target Audience</h4>
            
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="radio"
                  name="audienceType"
                  value="all"
                  checked={audienceType === "all"}
                  onChange={() => setAudienceType("all")}
                  className="w-4 h-4 text-blue-600"
                />
                Everyone
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="radio"
                  name="audienceType"
                  value="roles"
                  checked={audienceType === "roles"}
                  onChange={() => setAudienceType("roles")}
                  className="w-4 h-4 text-blue-600"
                />
                Specific User Roles
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <input
                  type="radio"
                  name="audienceType"
                  value="classes"
                  checked={audienceType === "classes"}
                  onChange={() => setAudienceType("classes")}
                  className="w-4 h-4 text-blue-600"
                />
                Specific Classes / Sections
              </label>
            </div>

            {/* Conditional Roles boxes */}
            {audienceType === "roles" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-150">
                {Object.keys(selectedRoles).map(role => (
                  <label key={role} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedRoles[role]}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    {role}
                  </label>
                ))}
              </div>
            )}

            {/* Conditional Classes boxes */}
            {audienceType === "classes" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-150">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Select Target Class</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Choose Class...</option>
                    {classList.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {selectedClass && availableSections.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Select Target Sections (Optional - Broad Class if empty)</label>
                    <div className="flex gap-4">
                      {availableSections.map(sec => (
                        <label key={sec._id} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <input
                            type="checkbox"
                            checked={selectedSections.includes(sec._id)}
                            onChange={() => toggleSection(sec._id)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          Section {sec.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Action Controls */}
          <div className="flex gap-3 justify-end border-t border-gray-100 pt-5 mt-5">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!canSubmit() || isLoading}
              className={`px-4 py-2 border rounded-lg font-medium text-sm flex items-center gap-2 transition ${
                canSubmit() && !isLoading
                  ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
              }`}
            >
              <FiEye /> Notice Preview
            </button>

            <button
              type="submit"
              className={`px-5 py-2 rounded-lg font-semibold text-white text-sm transition ${
                canSubmit() && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-300 cursor-not-allowed"
              }`}
              disabled={!canSubmit() || isLoading}
            >
              {isLoading ? "Saving..." : "Save Draft"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              className={`px-5 py-2 rounded-lg font-semibold text-white text-sm transition ${
                canSubmit() && !isLoading
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-green-300 cursor-not-allowed"
              }`}
              disabled={!canSubmit() || isLoading}
            >
              {isLoading ? "Publishing..." : "Publish & Send Now"}
            </button>
          </div>
        </form>
      </div>

      {/* Notice Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FiEye className="text-blue-600" /> Announcement Preview
              </h3>
              <button 
                onClick={() => setPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition text-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  priority === 'urgent' || priority === 'high'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : priority === 'medium'
                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                    : 'bg-green-50 text-green-600 border border-green-100'
                }`}>
                  {priority} Priority
                </span>
                
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold uppercase border border-blue-100">
                  {category} Notice
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 leading-snug">{title || "Untitled Announcement"}</h2>
              
              <div className="text-xs text-gray-400 space-y-1">
                <p>Audience Segment: <span className="font-semibold text-gray-600 capitalize">{audienceType === 'all' ? 'Everyone' : audienceType}</span></p>
                <p>Publish Timing: <span className="font-semibold text-gray-600">{publishOn ? new Date(publishOn).toLocaleString() : 'Immediate Dispatched'}</span></p>
              </div>

              <div className="text-sm text-gray-700 border-t border-b border-gray-100 py-4 whitespace-pre-line leading-relaxed">
                {message || "No announcement content entered yet."}
              </div>

              {attachmentName && (
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                  <FiFileText /> Attached Document: {attachmentName}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 border rounded-lg font-medium text-sm hover:bg-gray-100 transition"
              >
                Go Back to Editing
              </button>
              
              <button
                type="button"
                onClick={() => handleSubmit(null, true)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-1.5"
              >
                <FiCheckCircle /> Send Notice Immediately
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
