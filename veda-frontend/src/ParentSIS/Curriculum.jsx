import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { getSubjects } from "../services/subjectAPI";
import HelpInfo from "../components/HelpInfo"; 

// Subject Card Component
const SubjectCard = ({ subject }) => {
  const subjectName = subject.subjectName || subject.name || "Unknown";

  const getSubjectColor = (name) => {
    const colors = {
      Mathematics: "bg-red-500",
      English: "bg-green-500",
      Science: "bg-blue-500",
      "Social Science": "bg-gray-600",
      Hindi: "bg-orange-600",
      IT: "bg-gray-700",
      "Computer Science": "bg-purple-500",
      Physics: "bg-indigo-500",
      Chemistry: "bg-yellow-500",
      Biology: "bg-emerald-500",
      History: "bg-amber-600",
      Geography: "bg-teal-500",
      Economics: "bg-pink-500",
      "Business Studies": "bg-cyan-500",
      Art: "bg-rose-500",
      Music: "bg-violet-500",
      "Physical Education": "bg-lime-500",
    };
    return colors[name] || "bg-gray-500";
  };

  const getSubjectImage = (name) => {
    const images = {
      Mathematics:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
      English:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      Science:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
      "Social Science":
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      Hindi:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      IT: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
      "Computer Science":
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop",
      Physics:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
      Chemistry:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
      Biology:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
      History:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      Geography:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      Economics:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      "Business Studies":
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      Art: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
      Music:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      "Physical Education":
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    };
    return (
      images[name] ||
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop"
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={getSubjectImage(subjectName)}
          alt={subjectName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      <div className={`${getSubjectColor(subjectName)} p-4 text-white relative`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{subjectName}</h3>
            <p className="text-sm opacity-90">{subject.subjectCode}</p>
          </div>
          <div className="text-right">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                subject.type === "Theory"
                  ? "bg-white bg-opacity-20"
                  : "bg-yellow-400 bg-opacity-30"
              }`}
            >
              {subject.type || "Theory"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Curriculum() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    const fetchParentInfo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId) return;

        const authHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers: authHeaders });
        
        if (res.data && res.data.success && res.data.parent.children) {
          const kids = res.data.parent.children;
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };
    fetchParentInfo();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedChildId) return;
      try {
        setLoading(true);
        const data = await getSubjects({ studentId: selectedChildId });
        if (data.success) {
          setSubjects(data.subjects || []);
        }
      } catch (err) {
        console.error("Error loading subjects:", err);
        setError("Error loading subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedChildId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="p-0 m-0 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {selectedChildId 
            ? `${children.find(c => c._id === selectedChildId)?.personalInfo?.name || "Child"}'s Curriculum` 
            : "Curriculum"}
        </h2>
        <div className="flex gap-2">
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="border px-3 py-1 rounded bg-blue-50 text-blue-700 font-medium"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.personalInfo?.name || child.name}
                </option>
              ))}
            </select>
          )}
          <HelpInfo
  title="Curriculum"
  description={`4.2 Curriculum (Subject Overview)

Explore all subjects included in your child’s curriculum, along with subject type, codes, and details.

Sections:
- Summary Cards: Quick stats showing total subjects, theory subjects, and practical subjects
- Subject Grid: Displays all subjects with images, names, and subject codes
- Subject Type Labels: Clear indication whether the subject is Theory or Practical
- Subject Overview Cards: Visual cards with subject thumbnails and essential details
- Detailed Subject View: Open individual subject pages for syllabus, topics, and resources
`}
  steps={[
    "View the total number of subjects in the curriculum",
    "Check how many theory and practical subjects are included",
    "Browse visually rich subject cards for quick understanding",
    "Identify subject type using labels (Theory/Practical)",
    "Open a subject card to view full syllabus and learning materials"
  ]}
/>

</div>
</div>
          
        

      {/* Content */}
             
          
        {subjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Subjects Available
            </h3>
            <p className="text-gray-500">
              No subjects have been added to the curriculum yet.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
              <div className="bg-white mb-4 p-3 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Curriculum </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-sm p-4
              shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center">
                  <div className="p-3 text-sm bg-blue-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Subjects
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subjects.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Theory Subjects
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subjects.filter((s) => s.type === "Theory").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Practical Subjects
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subjects.filter((s) => s.type === "Practical").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Subjects Grid */}
            <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {subjects.map((subject) => (
                <SubjectCard key={subject._id} subject={subject} />
              ))}
            </div>
            </div>
          </>
        )}
      
    </div>
  );
}
