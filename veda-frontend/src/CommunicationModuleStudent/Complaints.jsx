import React, { useEffect, useState, useMemo } from "react";
import HelpInfo from "../components/HelpInfo";
import { FiSearch, FiPaperclip } from "react-icons/fi";
import complaintAPI from "../services/complaintAPI";
import staffAPI from "../services/staffAPI";

export default function Complaints() {
  const [activeTab, setActiveTab] = useState("raise");

  /* ---------- Raise Form ---------- */
  const [form, setForm] = useState({
    subject: "",
    category: "",
    sendTo: "",
    teacherId: "",
    message: "",
    attachment: null,
  });

  /* ---------- Complaints ---------- */
  const [complaints, setComplaints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [user, setUser] = useState(null);

  // Load User
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  // Load Teachers
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await staffAPI.getAllStaff();
        // response is { success: true, staff: [...] } from backend
        // and staffAPI returns response.data which is that object.
        
        let staffArray = [];
        if (response && response.staff && Array.isArray(response.staff)) {
            staffArray = response.staff;
        } else if (Array.isArray(response)) {
             staffArray = response;
        }

        const teacherList = staffArray.filter(s => {
            const role = s.personalInfo?.role || "";
            const desig = s.personalInfo?.designation || "";
            return role === 'Teacher' || role.toLowerCase() === 'teacher' || desig.toLowerCase().includes('teacher');
        });

        const listToUse = teacherList.length > 0 ? teacherList : staffArray;
        
        setTeachers(listToUse.map(t => ({
            id: t._id,
            name: t.personalInfo?.name || t.personalInfo?.fullName || "Unknown Staff"
        })));
      } catch (error) {
        console.error("Failed to load teachers", error);
      }
    };
    loadTeachers();
  }, []);

  // Fetch Complaints
  const fetchData = async () => {
    if (!user) return;
    const uId = user.refId || user._id;
    const uModel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student";
    try {
      // 1. My Complaints (Raised by me)
      const myResponse = await complaintAPI.getUserComplaints(uId, uModel);
      setComplaints(transformComplaints(myResponse.data, user));

      // 2. Logs (Complaints against me)
      // We use targetUser filter
      // Note: Backend must support filtering by targetUser in getComplaints
      const logsResponse = await complaintAPI.getComplaints({ targetUser: uId });
      setLogs(transformComplaints(logsResponse.data, user));

    } catch (error) {
      console.error("Error fetching complaints", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Transform Backend Data to Frontend Format
  const transformComplaints = (data, currentUser) => {
    if (!Array.isArray(data)) return [];
    return data.map(c => {
        const messages = [];
        // Initial complaint message
        messages.push({
            by: c.complainant?._id === currentUser._id ? "You" : (c.complainant?.personalInfo?.fullName || "Unknown"),
            text: c.description,
            time: new Date(c.createdAt).toLocaleString()
        });
        // Responses
        if (c.responses) {
            c.responses.forEach(r => {
                messages.push({
                    by: r.responder?._id === currentUser._id ? "You" : (r.responder?.personalInfo?.fullName || "Support"),
                    text: r.response,
                    time: new Date(r.responseDate).toLocaleString()
                });
            });
        }

        return {
            id: c._id,
            subject: c.subject,
            sendTo: c.sendTo && c.sendTo.length > 0 ? c.sendTo[0] : (c.assignedToModel || "Admin"), // heuristic
            receiver: c.assignedTo?.personalInfo?.fullName || c.targetUser?.personalInfo?.fullName || "Admin",
            status: c.status,
            createdAt: new Date(c.createdAt).toLocaleString(),
            messages: messages,
            raw: c // keep raw for internal use
        };
    });
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((c) =>
        c.subject.toLowerCase().includes(search.toLowerCase())
      ),
    [search, complaints]
  );

  const handleSubmit = async () => {
    // Basic validation
    let currentUser = user;
    if (!currentUser) {
        // Try reloading one last time
        const stored = localStorage.getItem("user");
        if (stored) {
            currentUser = JSON.parse(stored);
            setUser(currentUser);
        } else {
            alert("You are not logged in or user session expired. Please refresh or login again.");
            return;
        }
    }
    if (!form.subject) {
        alert("Please enter Complaint Detail (Subject)");
        return;
    }
    if (!form.sendTo) {
        alert("Please select Concern To");
        return;
    }
    if(form.sendTo === "Teacher" && !form.teacherId) {
        alert("Please select a Staff member");
        return;
    }
    if (!form.message) {
        alert("Please enter Description");
        return;
    }

    try {
      const payload = {
        complainant: user.refId || user._id,
        complainantModel: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student",
        subject: form.subject,
        description: form.message,
        category: form.category || 'academic', // default
        sendTo: [form.sendTo],
        ...(form.sendTo === 'Teacher' && form.teacherId
          ? { targetUser: form.teacherId, targetUserModel: 'Teacher' }
          : {}),
        // attachments... (need file upload logic, skipping for now or assumed handled if we implemented upload)
      };

      await complaintAPI.createComplaint(payload);

      alert("Complaint submitted");
      setForm({
        subject: "",
        category: "",
        sendTo: "",
        teacherId: "",
        message: "",
        attachment: null,
      });
      fetchData(); // Refresh list
      setActiveTab("my");
    } catch (error) {
      console.error("Error submitting complaint", error);
      alert("Failed to submit complaint");
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedComplaint || !user) return;

    try {
        await complaintAPI.addResponse(selectedComplaint.id, {
            responder: user.refId || user._id,
            responderModel: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student",
            response: reply
        });
        
        setReply("");
        fetchData(); // Refresh to show new message. Note: this might reset selection if not careful.
        // Optimistic update or refetch specific complaint?
        // Simple refetch for now.
        // To keep selection, we should update selectedComplaint. But simplified:
        const updatedMsgs = [...selectedComplaint.messages, {
            by: "You",
            text: reply,
            time: new Date().toLocaleString()
        }];
        setSelectedComplaint(prev => ({ ...prev, messages: updatedMsgs }));

    } catch (error) {
        console.error("Error sending reply", error);
        alert("Failed to send reply");
    }
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Complaints</h2>
        <HelpInfo
          title="Complaints Help"
          description="Raise complaints, track replies, and view complaints raised against you."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        {["raise", "my", "logs"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setActiveTab(t);
              setSelectedComplaint(null);
              setReply("");
            }}
            className={`pb-2 ${
              activeTab === t
                ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                : "hover:text-gray-700"
            }`}
          >
            {t === "raise"
              ? "Raise Complaint"
              : t === "my"
              ? "My Complaints"
              : "Complaint Logs"}
          </button>
        ))}
      </div>

      {activeTab === "raise" && (
  <div className="bg-white p-4 rounded-lg border shadow-sm">

    {/* Category + Complaint To */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div>
        <label className="font-medium text-gray-700 mb-1 block">
          Concern Related to
        </label>
        <select
          className="w-full border px-4 py-2 rounded"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        >
          <option value="">Select concern options </option>
          <option value="academic">Academic</option>
          <option value="facility">Facility</option>
          <option value="behaviour">Behaviour</option>
        </select>
      </div>

      <div>
        <label className="font-medium text-gray-700 mb-1 block">
          Concern To *
        </label>
        <select
          className="w-full border px-4 py-2 rounded"
          value={form.sendTo}
          onChange={(e) =>
            setForm({ ...form, sendTo: e.target.value })
          }
        >
          <option value="">Select recipient</option>
          <option value="Teacher">Teacher</option>
          <option value="Principal">Principal</option>
          <option value="Admin">Admin</option>
          <option value="Librarian">Librarian</option>
        </select>
      </div>
    </div>

    {/* Select Teacher (Complaint To ke neeche) */}
    {form.sendTo === "Teacher" && (
      <div className="mb-3">
        <label className="font-medium text-gray-700 mb-1 block">
          Select Staff
        </label>
        <select
          className="w-full border px-4 py-2 rounded"
          value={form.teacherId}
          onChange={(e) =>
            setForm({ ...form, teacherId: e.target.value })
          }
        >
          <option value="">Choose Staff</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Subject (Complaint Description ke upar, full row) */}
    <div className="mb-3">
      <label className="font-medium text-gray-700 mb-1 block">
        Complaint Detail*
      </label>
      <input
        className="w-full border px-4 py-2 rounded"
        placeholder="Enter Complain Detail "
        value={form.subject}
        onChange={(e) =>
          setForm({ ...form, subject: e.target.value })
        }
      />
    </div>

    {/* Complaint Description */}
    <div className="mb-4">
      <label className="font-medium text-gray-700 mb-1 block">
       Explain the  Concern in Description *
      </label>
      <textarea
        rows={5}
        className="w-full border px-4 py-2 rounded"
        placeholder="Write complaint in detail"
        value={form.message}
        onChange={(e) =>
          setForm({ ...form, message: e.target.value })
        }
      />
    </div>

         <div className="mb-6">
  <label className="flex items-center gap-2 text-blue-600 cursor-pointer">
    <FiPaperclip />
    Attach File
    <input type="file" className="hidden" />
  </label>

  <p className="text-xs text-gray-500 mt-1">
    Supported formats: PNG, JPG, JPEG, PDF, Excel (XLS, XLSX)
  </p>
</div>

          <div className="text-right">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Complaint
            </button>
          </div>
        </div>
      )}

      {/* ================= MY COMPLAINTS ================= */}
      {activeTab === "my" && (
        <div className="grid grid-cols-3 gap-3">
          {/* Left List */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-3 border-b flex items-center gap-2">
              <FiSearch className="text-gray-400" />
              <input
                className="w-full text-sm outline-none"
                placeholder="Search complaint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredComplaints.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm text-center">No complaints found.</div>
            ) : (
                filteredComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-3 border-b cursor-pointer ${
                  selectedComplaint?.id === c.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-sm">{c.subject}</p>
                <p className="text-xs text-gray-500">
                  {c.sendTo} • {c.status}
                </p>
                <p className="text-xs text-gray-400">{c.createdAt}</p>
              </div>
            )))}
          </div>

          {/* Right Detail */}
          <div className="col-span-2 bg-white border rounded-lg shadow-sm p-4">
            {!selectedComplaint ? (
              <p className="text-gray-500 text-sm">
                Select a complaint to view details
              </p>
            ) : (
              <>
                <h3 className="font-semibold text-lg mb-1">
                  {selectedComplaint.subject}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Sent to {selectedComplaint.receiver} •{" "}
                  {selectedComplaint.status}
                </p>

                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                  {selectedComplaint.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded text-sm ${
                        m.by === "You"
                          ? "bg-blue-50"
                          : "bg-gray-100"
                      }`}
                    >
                      <p className="font-medium">{m.by}</p>
                      <p>{m.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {m.time}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <textarea
                    rows={3}
                    className="w-full border px-3 py-2 rounded text-sm mb-2"
                    placeholder="Write your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReply}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= LOGS TAB ================= */}
      {activeTab === "logs" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border rounded-lg shadow-sm">
            {logs.length === 0 ? <div className="p-4 text-center text-gray-500">No logs found.</div> : 
             logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedComplaint(log)}
                className={`p-3 border-b cursor-pointer ${
                  selectedComplaint?.id === log.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-sm">{log.subject}</p>
                <p className="text-xs text-gray-500">
                  Raised By: {log.messages[0]?.by || "Unknown"} • {log.status}
                </p>
                <p className="text-xs text-gray-400">{log.createdAt}</p>
              </div>
            ))}
          </div>

          <div className="col-span-2 bg-white border rounded-lg shadow-sm p-4">
            {!selectedComplaint ? (
              <p className="text-gray-500 text-sm">
                Select a complaint to view details
              </p>
            ) : (
              <>
                <h3 className="font-semibold text-lg mb-2">
                  {selectedComplaint.subject}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Raised By {selectedComplaint.messages[0]?.by} •{" "}
                  {selectedComplaint.status}
                </p>

                <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                  {selectedComplaint.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded text-sm ${
                        m.by === "You" ? "bg-blue-50" : "bg-gray-100"
                      }`}
                    >
                      <p className="font-medium">{m.by}</p>
                      <p>{m.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.time}</p>
                    </div>
                  ))}
                </div>

                <textarea
                  rows={3}
                  className="w-full border px-3 py-2 rounded text-sm mb-2"
                  placeholder="Write your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleReply}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                  >
                    Send Reply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
