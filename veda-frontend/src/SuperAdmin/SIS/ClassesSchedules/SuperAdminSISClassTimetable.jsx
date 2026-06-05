import React, { useMemo, useState, useEffect } from "react";
import { FiTrash2, FiEdit, FiSearch } from "react-icons/fi";
import axios from "axios";
import api from "../../../services/apiClient";

import config from "../../../config";

const API_BASE = config.API_BASE_URL;
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyRow = () => ({
  id: crypto.randomUUID(),
   mongoId: null, 
  subjectId: "",
  teacherId: "",
  from: "",
  to: "",
  roomNo: "",
});

const TimetableView = ({ cls, section, rows, onEdit, onDelete }) => {
  if (!cls || !section) return null;
  const data = rows || [];

  if (data.length === 0) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-sm border">
        <p className="text-gray-500 italic">
          No timetable found for {cls} {section}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border">
      <h3 className="text-sm font-semibold mb-4">
        Timetable – {cls} {section}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 border text-left">Day</th>
              <th className="p-2 border text-left">Subject</th>
              <th className="p-2 border text-left">Teacher</th>
              <th className="p-2 border text-left">From</th>
              <th className="p-2 border text-left">To</th>
              <th className="p-2 border text-left">Room</th>
              <th className="p-2 border text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r._id || i} className="text-center hover:bg-gray-50">
                <td className="p-2 border text-left">{r.day}</td>
                <td className="p-2 border text-left">
                  {r.subject?.subjectName || "--"}
                </td>
                <td className="p-2 border text-left">
                  {r.teacher?.personalInfo?.name
                    ? `${r.teacher.personalInfo.name}${
                        r.teacher.personalInfo?.department
                          ? ` (${r.teacher.personalInfo.department})`
                          : ""
                      }`
                    : "--"}
                </td>
                <td className="p-2 border text-left">{r.timeFrom}</td>
                <td className="p-2 border text-left">{r.timeTo}</td>
                <td className="p-2 border text-left">{r.roomNo}</td>
                <td className="p-2 border text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 mx-1"
                    onClick={() => onEdit && onEdit(r)}
                    title="Edit timetable entry"
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 mx-1"
                    onClick={() => onDelete && onDelete(r._id)}
                    title="Delete timetable entry"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function cx(...cls) {
  return cls.filter(Boolean).join(" ");
}

export default function SuperAdminSISClassTimetable() {
  // -------- Dropdowns --------
  const [classes, setClasses] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // -------- Criteria --------
  const [criteriaClass, setCriteriaClass] = useState("");
  const [criteriaSection, setCriteriaSection] = useState("");

  const clsName = classes.find((c) => c._id === criteriaClass)?.name || "";
  const secName = sections.find((s) => s._id === criteriaSection)?.name || "";

  // -------- Modal --------
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalClass, setModalClass] = useState("");
  const [modalSection, setModalSection] = useState("");
  const [modalGroup, setModalGroup] = useState("");

  // -------- Editor --------
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeDay, setActiveDay] = useState("Monday");
  const initialTT = useMemo(
    () => DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {}),
    []
  );
  const [timetable, setTimetable] = useState(initialTT);

  const [periodStart, setPeriodStart] = useState("");
  const [duration, setDuration] = useState("");
  const [intervalMin, setIntervalMin] = useState("");
  const [roomNoQuick, setRoomNoQuick] = useState("");

  const [tableData, setTableData] = useState([]);
  const [showDummy, setShowDummy] = useState(false);

  // ---------- helper: fetch teachers ----------
 const fetchTeachers = async (classId, sectionId) => {
  try {
    if (!classId || !sectionId) {
      setTeachers([]);
      return;
    }

    const res = await axios.get(`${API_BASE}/assignTeachers`);

    const assignments = res.data?.data || [];

    const matchedClass = assignments.find(
      (item) =>
        String(item.class?._id) === String(classId) &&
        String(item.section?._id) === String(sectionId)
    );

    if (!matchedClass) {
      setTeachers([]);
      return;
    }

    setTeachers(matchedClass.teachers || []);
  } catch (err) {
    console.error("Error fetching assigned teachers:", err);
    setTeachers([]);
  }
};
  // ---------- Fetch base dropdowns ----------
  useEffect(() => {
    // fetch classes
    fetch(`${API_BASE}/classes`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data))
          setClasses(data.data);
        else if (data && data.success && Array.isArray(data.classes))
          setClasses(data.classes);
      })
      .catch((err) => console.error("Error fetching classes:", err));

    // fetch teachers initially (so dropdown has values on first open)
    fetchTeachers();
  }, []);

  // If the Add Modal or Editor opens, re-fetch teachers so newly added staff appear
 useEffect(() => {
  if (modalClass && modalSection) {
    fetchTeachers(modalClass, modalSection);
  }
}, [modalClass, modalSection]);

  // Criteria: fetch sections for criteriaClass
  useEffect(() => {
    if (!criteriaClass) {
      setSections([]);
      setCriteriaSection("");
      return;
    }
    fetch(`${API_BASE}/sections?classId=${criteriaClass}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data))
          setSections(data.data);
        else if (data && data.success && Array.isArray(data.sections))
          setSections(data.sections);
      })
      .catch((err) => console.error("Error fetching sections:", err));
  }, [criteriaClass]);

  // Modal: fetch sections for modalClass
  useEffect(() => {
    if (!modalClass) return;
    fetch(`${API_BASE}/sections?classId=${modalClass}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data))
          setSections(data.data);
        else if (data && data.success && Array.isArray(data.sections))
          setSections(data.sections);
      })
      .catch((err) => console.error("Error fetching modal sections:", err));
  }, [modalClass]);

  // Modal: fetch groups
  useEffect(() => {
    if (!modalClass || !modalSection) {
      setGroups([]);
      setModalGroup("");
      return;
    }
    fetch(
      `${API_BASE}/subGroups?classId=${modalClass}&sectionId=${modalSection}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data))
          setGroups(data.data);
        else if (data && data.success && Array.isArray(data.groups))
          setGroups(data.groups);
      })
      .catch((err) => console.error("Error fetching groups:", err));
  }, [modalClass, modalSection]);

  // Modal: fetch subjects
  // ✅ Modal: fetch subjects FROM SUBJECT GROUP
useEffect(() => {
  if (!modalGroup) {
    setSubjects([]);
    return;
  }

  axios
    .get(`${API_BASE}/subGroups/${modalGroup}`)
    .then((res) => {
      const groupSubjects = res.data?.data?.subjects || [];
      setSubjects(groupSubjects);
    })
    .catch((err) => {
      console.error("Error fetching subject group subjects:", err);
      setSubjects([]);
    });
}, [modalGroup]);

  // ---------- Table + Save ----------
  const addRowForDay = (day) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), emptyRow()],
    }));
  };

  const updateRow = (day, id, key, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((r) =>
        r.id === id ? { ...r, [key]: value } : r
      ),
    }));
  };

  const deleteRow = (day, id) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((r) => r.id !== id),
    }));
  };

  const searchTimetable = async () => {
    if (!criteriaClass || !criteriaSection) {
      alert("Please select Class & Section.");
      return;
    }
    try {
      const res = await api.get(`/timetables`, {
        params: { classId: criteriaClass, sectionId: criteriaSection },
      });
      setTableData(res.data?.data || []);
      setShowDummy(true);
    } catch (err) {
      console.error(err);
      alert("Error fetching timetable");
    }
  };

  // Edit timetable entry
const handleEditTimetable = async (timetableEntry) => {
  try {
    //  STEP-2A: EDIT MODE ON KARO (YE LINE MISSING THI)
    setIsEditMode(true);

    //  STEP-2B: modal values SET KARNA ZAROORI HAI
    setModalClass(timetableEntry.class?._id || "");
    setModalSection(timetableEntry.section?._id || "");
   setModalGroup(
  timetableEntry.subjectGroup?._id || timetableEntry.subjectGroup || ""
);

    // subjects fetch
   // ✅ fetch subjects from subject group (EDIT MODE)
if (timetableEntry.subjectGroup?._id || timetableEntry.subjectGroupId) {
  const groupId =
    timetableEntry.subjectGroup?._id || timetableEntry.subjectGroupId;

  const res = await axios.get(`${API_BASE}/subGroups/${groupId}`);
  setSubjects(res.data?.data?.subjects || []);
}

    // assigned teachers fetch
    await fetchTeachers(
      timetableEntry.class?._id,
      timetableEntry.section?._id
    );

    // clear old timetable
    const freshTT = DAYS.reduce(
      (acc, d) => ({ ...acc, [d]: [] }),
      {}
    );

    // set editable row
    freshTT[timetableEntry.day] = [
      {
        id: timetableEntry._id,
        mongoId: timetableEntry._id,
        subjectId: timetableEntry.subject?._id || "",
        teacherId: timetableEntry.teacher?._id || "",
        from: timetableEntry.timeFrom || "",
        to: timetableEntry.timeTo || "",
        roomNo: timetableEntry.roomNo || "",
      },
    ];

    setTimetable(freshTT);

    setActiveDay(timetableEntry.day);

    setEditorOpen(true);
  } catch (err) {
    console.error("Edit error:", err);
  }
};
  // Delete timetable entry
  const handleDeleteTimetable = async (timetableId) => {
    if (
      !window.confirm("Are you sure you want to delete this timetable entry?")
    ) {
      return;
    }

    try {
      console.log("Attempting to delete timetable with ID:", timetableId);
      console.log("Delete URL:", `${API_BASE}/timetables/${timetableId}`);

      const res = await axios.delete(`${API_BASE}/timetables/${timetableId}`);
      console.log("Delete response:", res.data);

      if (res.data.success) {
        alert("Timetable entry deleted successfully!");
        // Refresh the timetable list
        await searchTimetable();
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting timetable entry:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete timetable entry";
      alert(`Error: ${errorMessage}`);
    }
  };

  // Helper function to create teacher assignment if it doesn't exist
  const ensureTeacherAssignment = async (classId, sectionId, teacherId) => {
    try {
      console.log("Checking teacher assignment for:", {
        classId,
        sectionId,
        teacherId,
      });

      // Check if assignment exists
      const checkRes = await axios.get(`${API_BASE}/assignTeachers`);
      console.log("Existing assignments response:", checkRes.data);
      const existingAssignments = checkRes.data?.data || [];

      const assignmentExists = existingAssignments.some(
        (assignment) =>
          String(assignment.class._id) === String(classId) &&
          String(assignment.section._id) === String(sectionId)
      );

      console.log("Assignment exists:", assignmentExists);

      if (!assignmentExists) {
        // Create assignment
        const assignmentData = {
          classId,
          sectionId,
          teachers: [teacherId],
          classTeacher: teacherId,
        };

        console.log("Creating assignment with data:", assignmentData);
        const createRes = await axios.post(
          `${API_BASE}/assignTeachers`,
          assignmentData
        );
        console.log("Assignment creation response:", createRes.data);
        console.log(
          "Successfully created teacher assignment for class/section"
        );
      } else {
        console.log("Assignment already exists, skipping creation");
      }
    } catch (error) {
      console.error("Error in ensureTeacherAssignment:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
    }
  };

  const saveAll = async () => {
   if (!isEditMode && (!modalClass || !modalSection || !modalGroup)) {
  alert("Please select Class, Section & Subject Group in the modal.");
  return;
}
    try {
      const requests = [];
      const metas = [];
      const seenKeys = new Set();

      // Teacher assignment validation is temporarily disabled in backend
      // No need to create assignments manually

      for (const day of DAYS) {
        for (const row of timetable[day] || []) {
          // validation: skip incomplete rows
          if (!row.subjectId || !row.teacherId || !row.from || !row.to) {
            console.warn("Skipping incomplete row:", { day, row });
            continue;
          }

          // build dedupe key (prevent sending duplicate identical period)
          const key = `${modalClass}|${modalSection}|${modalGroup}|${day}|${row.from}|${row.to}|${row.subjectId}|${row.teacherId}`;
          if (seenKeys.has(key)) {
            console.warn("Skipping duplicate row (same payload):", {
              day,
              row,
            });
            continue;
          }
          seenKeys.add(key);

          const payload = {
            class: modalClass,
            section: modalSection,
        subjectGroupId: modalGroup || row.subjectGroupId || "",
            day,
            subject: row.subjectId, // ✅ rename
            teacher: row.teacherId, // ✅ rename
            timeFrom: row.from,
            timeTo: row.to,
            roomNo: row.roomNo,
          };

          // log payload for debugging
          console.log("Prepared payload:", JSON.stringify(payload, null, 2));
const isMongoId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

if (isEditMode && row.mongoId && isMongoId(row.mongoId)) {
  // ✅ UPDATE existing timetable
  requests.push(
    axios.put(`${API_BASE}/timetables/${row.mongoId}`, payload)
  );
} else {
  // ✅ CREATE new timetable
  requests.push(
    axios.post(`${API_BASE}/timetables`, payload)
  );
}
          metas.push({ day, ...payload });
        }
      }

      if (requests.length === 0) {
        alert("No valid rows to save.");
        return;
      }

      const results = await Promise.allSettled(requests);

      const failed = [];
      const succeededCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;

      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const err = r.reason;
          const status = err?.response?.status;
          const msg =
            err?.response?.data?.message || err?.message || "Unknown error";
          failed.push({ meta: metas[i], status, message: msg, raw: err });
        }
      });

      // summary
      if (failed.length > 0) {
        console.error("Some rows failed to save:", failed);
        // Build a concise summary of first few failures to help diagnose quickly
        const sample = failed
          .slice(0, 3)
          .map((f, idx) => {
            const d = f?.meta?.day || "?";
            const msg = f?.message || "Unknown error";
            const status = f?.status ? ` [${f.status}]` : "";
            return `${idx + 1}. ${d}: ${msg}${status}`;
          })
          .join("\n");
        const more = failed.length > 3 ? `\n(+${failed.length - 3} more…)` : "";
        alert(
          `Saved with ${failed.length} failure(s).\n\n${sample}${more}\n\nCheck console for full details.`
        );
      } else {
        alert(`Saved! (${succeededCount} rows)`);
      }
setIsEditMode(false);
      setEditorOpen(false);

      // refresh shown timetable if current criteria matches modal
      if (criteriaClass === modalClass && criteriaSection === modalSection) {
        await searchTimetable();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save timetable");
    }
  };

  // ✅ Quick Generate Timetable
  const applyQuickGenerate = () => {
    if (!periodStart || !duration) {
      alert("Please enter start time and duration");
      return;
    }

    const newRows = [];
    let current = periodStart;

    for (let i = 0; i < 8; i++) {
      // 8 periods max (customize as needed)
      const [h, m] = current.split(":").map(Number);
      const start = new Date(0, 0, 0, h, m);
      const durMin = parseInt(duration, 10) || 0;
      const intMin = parseInt(intervalMin, 10) || 0;
      const end = new Date(start.getTime() + durMin * 60000);

      const from = `${String(start.getHours()).padStart(2, "0")}:${String(
        start.getMinutes()
      ).padStart(2, "0")}`;
      const to = `${String(end.getHours()).padStart(2, "0")}:${String(
        end.getMinutes()
      ).padStart(2, "0")}`;

      newRows.push({ ...emptyRow(), from, to, roomNo: roomNoQuick });

      // compute next period start properly (handle minute overflow)
      const next = new Date(end.getTime() + intMin * 60000);
      current = `${String(next.getHours()).padStart(2, "0")}:${String(
        next.getMinutes()
      ).padStart(2, "0")}`;
    }

    setTimetable((prev) => ({ ...prev, [activeDay]: newRows }));
  };

  // -------- UI --------
  const renderMainCriteria = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
      <div className="flex justify-between items-center mb-4 -mt-1">
        <h2 className="text-sm font-semibold">Class TimeTable</h2>
        <button
         onClick={() => {
  setShowAddModal(true);
}}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm"
        >
          + Add
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
       
          <select
            value={criteriaClass}
            onChange={(e) => setCriteriaClass(e.target.value)}
            className=" w-full border px-3 py-2 rounded-md text-sm"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          
          <select
            value={criteriaSection}
            onChange={(e) => setCriteriaSection(e.target.value)}
            className="w-full border px-3 py-2 rounded-md text-sm"
          >
            <option value="">Select Section</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-right">
        <button
  onClick={searchTimetable}
  className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700"
>
  <span className="inline-flex items-center gap-1">
    <FiSearch className="text-sm" />
    Search
  </span>
</button>

      </div>
    </div>
  );

  const renderAddModal = () =>
    showAddModal && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Add Class Criteria</h3>

          <div className="mb-3">
            <label className="block   mb-1">Class</label>
            <select
              value={modalClass}
              onChange={(e) => setModalClass(e.target.value)}
              className="w-full border px-3 py-2 rounded-md "
            >
              <option value="">Select</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block  mb-1">Section</label>
            <select
              value={modalSection}
              onChange={(e) => setModalSection(e.target.value)}
              className="w-full border px-3 py-2 rounded-md "
            >
              <option value="">Select</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block  mb-1">
              Subject Group
            </label>
            <select
              value={modalGroup}
              onChange={(e) => setModalGroup(e.target.value)}
              className="w-full border px-3 py-2 rounded-md "
              disabled={!modalClass || !modalSection}
            >
              <option value="">Select</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-md  bg-gray-500 text-white hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
  onClick={async () => {
    if (!modalClass || !modalSection || !modalGroup) {
      alert("Please select Class, Section & Subject Group");
      return;
    }

    // ✅ STEP-5B: ADD MODE CONFIRM
    setIsEditMode(false);   // 👈 VERY IMPORTANT

    setShowAddModal(false);
    setEditorOpen(true);
  }}
  className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm"
>
  Save
</button>
          </div>
        </div>
      </div>
    );

  const renderEditor = () => (
    <div className="bg-white p-3 rounded-lg shadow-sm border mb-4">
    {/* ✅ CONTEXT INFO */}
<div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
  <p className="text-sm text-blue-800 font-semibold">
    {isEditMode ? "Editing Timetable For" : "Creating Timetable For"}
  </p>
  <p className="text-sm text-blue-700">
    Class:{" "}
    <span className="font-semibold">
      {classes.find(c => c._id === modalClass)?.name || "-"}
    </span>
    {" "} | Section:{" "}
    <span className="font-semibold">
      {sections.find(s => s._id === modalSection)?.name || "-"}
    </span>
  </p>
</div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-3">
          Generate Time Table Quickly
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Period Start *
            </label>
            <input
              type="time"
              className="w-full border px-3 py-2 rounded-md text-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Duration *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="w-full border px-3 py-2 rounded-md text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">min</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Interval *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="w-full border px-3 py-2 rounded-md text-sm"
                value={intervalMin}
                onChange={(e) => setIntervalMin(e.target.value)}
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">min</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Room</label>
            <input
              className="w-full border px-3 py-2 rounded-md text-sm"
              value={roomNoQuick}
              onChange={(e) => setRoomNoQuick(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={applyQuickGenerate}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm w-full hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex gap-4 border-b">
          {DAYS.map((d) => (
            <button
              key={d}
              className={cx(
                "px-3 py-2 -mb-px text-sm",
                activeDay === d
                  ? "border-b-2 border-orange-500 font-semibold"
                  : "text-gray-600"
              )}
              onClick={() => setActiveDay(d)}
            >
              {d}
            </button>
          ))}
          <div className="ml-auto pb-2">
            <button
              onClick={() => addRowForDay(activeDay)}
              className="bg-blue-700 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-800"
            >
              + Add New
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-700 mb-2">
          <div className="col-span-3">Subject</div>
          <div className="col-span-3">Teacher</div>
          <div className="col-span-2">From</div>
          <div className="col-span-2">To</div>
          <div className="col-span-1">Room</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {(!timetable[activeDay] || timetable[activeDay].length === 0) && (
          <div className="text-gray-400 italic">
            No rows. Click “+ Add New”.
          </div>
        )}

        {(timetable[activeDay] || []).map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-12 gap-2 items-center mb-2"
          >
            <select
              className="col-span-3 border px-2 py-2 rounded-md text-sm"
              value={row.subjectId}
              onChange={(e) =>
                updateRow(activeDay, row.id, "subjectId", e.target.value)
              }
            >
              <option value="">Select</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subjectName}
                </option>
              ))}
            </select>

            <select
              className="col-span-3 border px-2 py-2 rounded-md text-sm"
              value={row.teacherId}
              onChange={(e) =>
                updateRow(activeDay, row.id, "teacherId", e.target.value)
              }
            >
              <option value="">Select</option>
              {teachers.map((t) => (
               <option key={t._id} value={t._id}>
  {t.personalInfo?.name || t.name}
</option>
              ))}
            </select>

            <input
              type="time"
              className="col-span-2 border px-2 py-2 rounded-md text-sm"
              value={row.from}
              onChange={(e) =>
                updateRow(activeDay, row.id, "from", e.target.value)
              }
            />
            <input
              type="time"
              className="col-span-2 border px-2 py-2 rounded-md text-sm"
              value={row.to}
              onChange={(e) =>
                updateRow(activeDay, row.id, "to", e.target.value)
              }
            />
            <input
              className="col-span-1 border px-2 py-2 rounded-md text-sm"
              value={row.roomNo}
              onChange={(e) =>
                updateRow(activeDay, row.id, "roomNo", e.target.value)
              }
            />
            <div className="col-span-1 text-right">
              <button
                onClick={() => deleteRow(activeDay, row.id)}
                className="text-red-600 hover:text-red-800"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 flex justify-end">
        <button
          onClick={saveAll}
          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 m-0 min-h-screen">
      {renderMainCriteria()}
      {renderAddModal()}
      {editorOpen && renderEditor()}
      {showDummy && (
        <TimetableView
          cls={clsName}
          section={secName}
          rows={tableData}
          onEdit={handleEditTimetable}
          onDelete={handleDeleteTimetable}
        />
      )}
    </div>
  );
}
