import { useMemo, useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiFilter,
  FiPhoneCall,
  FiSearch,
} from "react-icons/fi";
import complaintAPI from "../services/complaintAPI";

const statusPillClasses = {
  submitted: "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const priorityClasses = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-700",
};

const guidance = [
  "Be as specific as possible; include dates, times, and supporting details.",
  "Attach screenshots or receipts when relevant for faster review.",
  "Emergency issues? Call the support helpline for immediate assistance.",
];

export default function ParentComplaints() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState([
    { label: "Complaints Submitted", value: 0, trend: "Total" },
    { label: "Awaiting Response", value: 0, trend: "Pending/Review" },
    { label: "Resolved", value: 0, trend: "Closed" },
    { label: "Escalated", value: 0, trend: "High Priority" },
  ]);

  // Form State
  const [formData, setFormData] = useState({
    studentName: "",
    classSection: "",
    subject: "",
    category: "Academic Support",
    description: "",
    priority: "Medium",
    attachment: null
  });

  // Load User
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch(e) { console.error(e); }
    }
  }, []);

  // Fetch Data
  const fetchComplaints = async () => {
    if(!user) return;
    try {
        const response = await complaintAPI.getUserComplaints(user._id, user.role || 'Parent');
        const data = response.data || [];
        
        const mapped = data.map(c => ({
            id: c._id,
            displayId: `#CMP-${c._id.substr(-4).toUpperCase()}`,
            subject: c.subject,
            description: c.description,
            status: c.status,
            priority: c.priority,
            student: "Student Info in Desc", // Placeholder as backend implementation dependent
            submittedOn: new Date(c.createdAt).toLocaleString(),
            raw: c
        }));
        setComplaints(mapped);

        // Update metrics based on fetched data
        const total = mapped.length;
        const pending = mapped.filter(c => ['submitted', 'under_review', 'Pending'].includes(c.status)).length;
        const resolved = mapped.filter(c => ['resolved', 'closed'].includes(c.status)).length;
        const urgent = mapped.filter(c => ['high', 'urgent'].includes(c.priority)).length;

        setMetrics([
            { label: "Complaints Submitted", value: total, trend: "Total" },
            { label: "Awaiting Response", value: pending, trend: "Pending/Review" },
            { label: "Resolved", value: resolved, trend: "Closed" },
            { label: "Escalated", value: urgent, trend: "High/Urgent" },
        ]);

    } catch (error) {
        console.error("Error fetching complaints", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesStatus =
        selectedStatus === "All" || complaint.status === selectedStatus.toLowerCase() || complaint.status === selectedStatus;
      const matchesSearch =
        complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [selectedStatus, searchTerm, complaints]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(!user) {
        alert("User not logged in");
        return;
    }

    try {
        // Append student info to description
        const fullDescription = `[Student: ${formData.studentName}, Class: ${formData.classSection}]\n${formData.description}`;

        const payload = {
            complainant: user._id,
            complainantModel: user.role || 'Parent',
            subject: formData.subject,
            description: fullDescription,
            category: formData.category, // Map if necessary, else simple string
            priority: formData.priority.toLowerCase(),
            status: 'submitted'
        };

        await complaintAPI.createComplaint(payload);
        alert("Complaint submitted successfully!");
        
        // Reset form
        setFormData({
            studentName: "",
            classSection: "",
            subject: "",
            category: "Academic Support",
            description: "",
            priority: "Medium",
            attachment: null
        });

        // Refresh list
        fetchComplaints();

    } catch (error) {
        console.error("Submission failed", error);
        alert("Failed to submit complaint.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Parent Complaints & Support
            </h2>
            <p className="text-gray-600">
              Track responses and raise concerns directly with the admin team.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
              <FiDownload size={16} />
              Download Summary
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
              <FiPhoneCall size={16} />
              Talk To Support
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-2xl shadow p-5 border border-gray-100"
          >
            <p className=" text-gray-500">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {metric.value}
            </p>
            <p className="font-medium text-emerald-600 mt-1">
              {metric.trend}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 xl:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Submit a New Complaint
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                placeholder="Enter your child's name"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.studentName}
                onChange={e => setFormData({...formData, studentName: e.target.value})}
              />
            </div>
            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Class & Section
              </label>
              <input
                type="text"
                placeholder="e.g., Grade 6C"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.classSection}
                onChange={e => setFormData({...formData, classSection: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block  font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                placeholder="Brief title for the complaint"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="block  font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Academic Support</option>
                <option>Transport & Logistics</option>
                <option>Fees & Finance</option>
                <option>Safety & Welfare</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Provide complete details so we can assist you quickly..."
              className="w-full p-3 rounded-xl border border-gray-300 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block  font-medium text-gray-700 mb-1">
                Attachments (optional)
              </label>
              <input
                type="file"
                className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => setFormData({...formData, attachment: e.target.files[0]})}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="flex gap-3">
                {["Critical", "High", "Medium", "Low"].map((priority) => (
                  <label
                    key={priority}
                    className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center font-medium hover:border-blue-500 ${formData.priority === priority ? 'border-blue-500 bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                  >
                    <input 
                        type="radio" 
                        name="priority" 
                        className="hidden" 
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={() => setFormData({...formData, priority})}
                    />
                    {priority}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition w-full md:w-auto"
          >
            Submit Complaint
          </button>
        </form>

        <aside className="bg-blue-50 rounded-2xl p-6 shadow border border-blue-100 space-y-5">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-blue-600" size={24} />
            <div>
              <h4 className="text-lg font-semibold text-gray-800">
                Support Tips
              </h4>
              <p className="text-gray-600">
                Improve turnaround times with the guidance below.
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {guidance.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-3  text-gray-700"
              >
                <FiAlertTriangle className="mt-0.5 text-blue-500" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <button className="w-full rounded-xl border border-blue-200 py-3  font-semibold text-blue-700 hover:bg-blue-100 transition">
            View Response Policy
          </button>
        </aside>
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Your Recent Complaints
            </h3>
            <p className="text-sm text-gray-500">
              Monitor status updates in real time.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject or ID..."
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["All", "Submitted", "Pending", "In Review", "Resolved"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={`px-3 py-2 rounded-xl text-sm font-medium border ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
              <FiFilter size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredComplaints.length === 0 ? <p className="text-gray-500 p-4 font-center">No complaints found</p> : filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className=" font-medium text-gray-500">
                    {complaint.displayId}
                  </p>
                  <p className=" font-semibold text-gray-900">
                    {complaint.subject}
                  </p>
                  <p className=" text-gray-600 line-clamp-2">
                    {complaint.description}
                  </p>
                  <p className=" text-gray-500 mt-2">
                    {complaint.student} • {complaint.submittedOn}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span
                    className={`px-3 py-1 rounded-full  font-semibold ${
                      statusPillClasses[complaint.status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {complaint.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full  font-semibold ${
                      priorityClasses[complaint.priority] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {complaint.priority} Priority
                  </span>
                  <button className=" font-semibold text-blue-600 hover:text-blue-700">
                    View Timeline →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
