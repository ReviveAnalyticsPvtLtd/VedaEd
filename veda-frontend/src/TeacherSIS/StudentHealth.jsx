// import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
// import {
//   FiUser,
//   FiEdit,
//   FiAlertCircle,
//   FiActivity,
//   FiDownload,
//   FiUpload,
//   FiX,
//   FiEye,
//   FiSearch,
//   FiCheckCircle,
// } from "react-icons/fi";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import api from "../services/apiClient";
// import HelpInfo from "../components/HelpInfo";

// const ROWS_PER_PAGE = 10;

// const formatDisplayDate = (d) => {
//   if (!d || Number.isNaN(d.getTime())) return "Pending";
//   return d.toLocaleDateString("en-GB", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const calcBMINumber = (h, w) => {
//   if (!h || !w) return null;
//   const m = h / 100;
//   return Number((w / (m * m)).toFixed(1));
// };

// const deriveHealthStatus = (height, weight, allergies, chronic, vaccination) => {
//   const vac = (vaccination || "").toLowerCase();
//   const al = (allergies || "").trim();
//   const ch = (chronic || "").trim();
//   const bmi = calcBMINumber(height, weight);

//   if (!height || !weight) return "Pending";
//   if (
//     vac.includes("pending") ||
//     ch !== "None" ||
//     (al && al.toLowerCase() !== "none") ||
//     (bmi != null && (bmi < 14 || bmi > 25))
//   ) {
//     return "Follow-up";
//   }
//   return "Normal";
// };

// const deriveFollowUpFromStatus = (healthStatus) => {
//   if (healthStatus === "Follow-up") return "Yes";
//   if (healthStatus === "Pending") return "Pending";
//   return "No";
// };

// const visionToSelect = (raw) => {
//   const v = (raw || "").trim();
//   if (!v || v === "Not Checked") return "Not Checked";
//   if (/need|check|refer|problem|weak|poor/i.test(v)) return "Needs Checkup";
//   return "Normal";
// };

// const selectToCampVision = (val) => {
//   if (val === "Not Checked") return "";
//   if (val === "Needs Checkup") return "Needs Checkup";
//   return val === "Normal" ? "Normal" : val;
// };

// const VISION_SELECT_OPTS = new Set(["Normal", "Needs Checkup", "Not Checked"]);
// const GENERAL_HEALTH_OPTS = new Set(["Normal", "Follow-up", "Pending"]);
// const FOLLOW_UP_OPTS = new Set(["Yes", "No", "Pending"]);
// const PARENT_VISIBLE_OPTS = new Set(["Yes", "No"]);

// const clampToSelect = (val, allowedSet, fallback) =>
//   allowedSet.has(val) ? val : fallback;

// const draftKey = (studentId) => `teacher-health-draft:${studentId}`;

// const campLineStyle = (text) => {
//   if (!text || text === "Not Checked") return "text-gray-500";
//   if (/need|check|refer|problem|weak|poor/i.test(text)) return "text-amber-700 font-medium";
//   if (/normal|ok|clear|good/i.test(text)) return "text-green-700";
//   return "text-gray-800";
// };

// const healthPillClass = (status) => {
//   if (status === "Normal") return "bg-green-100 text-green-800";
//   if (status === "Follow-up") return "bg-amber-100 text-amber-800";
//   return "bg-red-100 text-red-800";
// };

// const followPillClass = (follow) => {
//   if (follow === "Yes") return "bg-amber-100 text-amber-800";
//   if (follow === "Pending") return "bg-red-100 text-red-800";
//   return "bg-green-100 text-green-800";
// };

// const mapStudentToState = (s) => {
//   const p = s.personalInfo || {};
//   const h = s.health || {};
//   const className =
//     typeof p.class === "string" ? p.class : p.class?.name || "";
//   const sectionName =
//     typeof p.section === "string" ? p.section : p.section?.name || "";

//   const height = Number(h.height) || 0;
//   const weight = Number(h.weight) || 0;
//   const allergies = h.allergies || "None";
//   const chronic = h.chronic || "None";
//   const vaccination = h.vaccination || "Up to Date";
//   const camp = h.campReport || {};
//   const eyeRaw = (camp.eye || "").trim();
//   const dentalRaw = (camp.dental || "").trim();
//   const vision = eyeRaw || "Not Checked";
//   const dental = dentalRaw || "Not Checked";

//   const derivedHealthStatus = deriveHealthStatus(
//     height,
//     weight,
//     allergies,
//     chronic,
//     vaccination
//   );
//   const teacherGH = (h.teacherGeneralHealth || "").trim();
//   const teacherFU = (h.teacherFollowUp || "").trim();
//   const healthStatus = teacherGH || derivedHealthStatus;
//   const followUp =
//     teacherFU === "Yes" || teacherFU === "No" || teacherFU === "Pending"
//       ? teacherFU
//       : deriveFollowUpFromStatus(healthStatus);

//   const updatedAt = s.updatedAt ? new Date(s.updatedAt) : null;
//   const bmiNum = calcBMINumber(height, weight);
//   const parentPhone =
//     s.parent?.contactDetails?.phone ||
//     s.parent?.contactDetails?.mobileNumber ||
//     p.contactDetails?.mobileNumber ||
//     "";

//   const ec = s.emergencyContact || {};
//   const emergencyPhone =
//     (ec.phone || "").trim() ||
//     (p.contactDetails?.alternatePhone || "").trim() ||
//     parentPhone ||
//     "";

//   return {
//     _id: s._id,
//     id: String(s._id),
//     stdId: p.stdId || "",
//     name: p.name || "",
//     class: className,
//     section: sectionName,
//     roll: p.rollNo || "",
//     // Prefer profile blood (admin SIS updates personalInfo); fall back to health record
//     blood: (p.bloodGroup || h.bloodGroup || "").trim(),
//     height,
//     weight,
//     allergies,
//     chronic,
//     medication: h.medication || "None",
//     vaccination,
//     notes: h.notes || "",
//     campReport: {
//       bp: camp.bp || "",
//       hb: camp.hb || "",
//       eye: camp.eye || "",
//       dental: camp.dental || "",
//       notes: camp.notes || "",
//     },
//     history: Array.isArray(h.history) ? h.history : [],
//     _rawHealth: { ...h },
//     bmiNum,
//     derivedHealthStatus,
//     healthStatus,
//     followUp,
//     vision,
//     dental,
//     updatedAt,
//     updatedLabel: formatDisplayDate(updatedAt),
//     lastReportDate: h.lastReportDate || "",
//     parentVisible: h.parentVisible === "No" ? "No" : "Yes",
//     parentPhone,
//     emergencyPhone,
//     emergencyContactName: (ec.name || "").trim(),
//     emergencyContactRelation: (ec.relation || "").trim(),
//   };
// };

// const assignedLabelFromStudents = (rows) => {
//   const keys = new Set(
//     rows.map((r) => `${r.class || ""}\t${r.section || ""}`.trim())
//   );
//   const filtered = [...keys].filter((k) => k && k !== "\t");
//   if (filtered.length === 0) return "—";
//   if (filtered.length === 1) {
//     const [c, sec] = filtered[0].split("\t");
//     const cn = (c || "").trim();
//     const sn = (sec || "").trim();
//     return sn ? `${cn}${sn}` : cn || "—";
//   }
//   return `${filtered.length} classes`;
// };

// const emptyEditForm = () => ({
//   reportDate: "",
//   blood: "",
//   height: "",
//   weight: "",
//   allergies: "",
//   chronic: "",
//   medication: "",
//   vaccination: "",
//   visionStatus: "Normal",
//   dentalStatus: "Normal",
//   generalHealth: "Normal",
//   followUpRequired: "No",
//   parentVisible: "Yes",
//   notes: "",
// });

// export default function StudentHealth() {
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState(null);
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sortBy, setSortBy] = useState("name");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [openEdit, setOpenEdit] = useState(false);
//   const [openView, setOpenView] = useState(false);
//   const [selectedIds, setSelectedIds] = useState(() => new Set());
//   const importInputRef = useRef(null);

//   const [editForm, setEditForm] = useState(emptyEditForm);

//   const fetchStudents = useCallback(async () => {
//     try {
//       setLoading(true);
//       setLoadError(null);
//       const res = await api.get(`/students`);
//       if (res.data.success) {
//         const list = res.data.students || [];
//         const sisOnly = list.filter((s) => s.source !== "Admission");
//         setStudents(sisOnly.map(mapStudentToState));
//       } else {
//         setLoadError("Could not load students.");
//       }
//     } catch (err) {
//       console.error("Error fetching students:", err);
//       setLoadError(
//         err.response?.data?.message || err.message || "Failed to load students."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStudents();
//   }, [fetchStudents]);

//   const updateField = (key, val) => {
//     setEditForm((prev) => ({ ...prev, [key]: val }));
//   };

//   const buildEditFormFromStudent = (stu) => {
//     const h = stu._rawHealth || {};
//     const today = new Date().toISOString().slice(0, 10);
//     let draft = null;
//     try {
//       const raw = sessionStorage.getItem(draftKey(stu.id));
//       if (raw) draft = JSON.parse(raw);
//     } catch {
//       draft = null;
//     }
//     const visionBase = visionToSelect(stu.campReport?.eye || stu.vision);
//     const dentalBase = visionToSelect(stu.campReport?.dental || stu.dental);
//     const ghBase = h.teacherGeneralHealth || stu.derivedHealthStatus;
//     const fuBase = stu.followUp || "No";
//     const base = {
//       reportDate: h.lastReportDate || today,
//       blood: stu.blood || "",
//       height: stu.height || "",
//       weight: stu.weight || "",
//       allergies: stu.allergies || "",
//       chronic: stu.chronic || "",
//       medication: stu.medication || "",
//       vaccination: stu.vaccination || "",
//       visionStatus: clampToSelect(visionBase, VISION_SELECT_OPTS, "Normal"),
//       dentalStatus: clampToSelect(dentalBase, VISION_SELECT_OPTS, "Normal"),
//       generalHealth: clampToSelect(ghBase, GENERAL_HEALTH_OPTS, "Normal"),
//       followUpRequired: clampToSelect(fuBase, FOLLOW_UP_OPTS, "No"),
//       parentVisible: clampToSelect(
//         stu.parentVisible || "Yes",
//         PARENT_VISIBLE_OPTS,
//         "Yes"
//       ),
//       notes: stu.notes || "",
//     };
//     if (!draft) return base;
//     const merged = { ...base, ...draft };
//     merged.visionStatus = clampToSelect(
//       merged.visionStatus,
//       VISION_SELECT_OPTS,
//       base.visionStatus
//     );
//     merged.dentalStatus = clampToSelect(
//       merged.dentalStatus,
//       VISION_SELECT_OPTS,
//       base.dentalStatus
//     );
//     merged.generalHealth = clampToSelect(
//       merged.generalHealth,
//       GENERAL_HEALTH_OPTS,
//       base.generalHealth
//     );
//     merged.followUpRequired = clampToSelect(
//       merged.followUpRequired,
//       FOLLOW_UP_OPTS,
//       base.followUpRequired
//     );
//     merged.parentVisible = clampToSelect(
//       merged.parentVisible,
//       PARENT_VISIBLE_OPTS,
//       base.parentVisible
//     );
//     return merged;
//   };

//   const handleView = (stu) => {
//     setSelectedStudent(stu);
//     setOpenView(true);
//   };

//   const handleEdit = (stu) => {
//     setSelectedStudent(stu);
//     setEditForm(buildEditFormFromStudent(stu));
//     setOpenEdit(true);
//   };

//   const saveDraft = () => {
//     if (!selectedStudent) return;
//     try {
//       sessionStorage.setItem(draftKey(selectedStudent.id), JSON.stringify(editForm));
//       alert("Draft saved on this device.");
//     } catch (e) {
//       console.error(e);
//       alert("Could not save draft.");
//     }
//   };

//   const buildHistoryDetail = (form, bmiVal) => {
//     const parts = [];
//     if (form.height && form.weight) {
//       parts.push(`Height ${form.height} cm, weight ${form.weight} kg`);
//       if (bmiVal != null) parts.push(`BMI ${bmiVal}`);
//     }
//     parts.push(`General health ${form.generalHealth}. Follow-up ${form.followUpRequired}.`);
//     if (form.visionStatus && form.visionStatus !== "Not Checked") {
//       parts.push(`Vision: ${form.visionStatus}.`);
//     }
//     if (form.dentalStatus && form.dentalStatus !== "Not Checked") {
//       parts.push(`Dental: ${form.dentalStatus}.`);
//     }
//     return parts.join(" ");
//   };

//   const saveChanges = async () => {
//     if (!selectedStudent) return;
//     const base = selectedStudent._rawHealth || {};
//     const camp = { ...(base.campReport || {}) };
//     camp.eye = selectToCampVision(editForm.visionStatus);
//     camp.dental = selectToCampVision(editForm.dentalStatus);

//     const hVal = Number(editForm.height);
//     const wVal = Number(editForm.weight);
//     const bmiVal =
//       hVal > 0 && wVal > 0 ? calcBMINumber(hVal, wVal) : null;

//     const historyEntry = {
//       date: formatDisplayDate(new Date()),
//       updateType: "Health report updated",
//       issue: "Health report updated",
//       action: buildHistoryDetail(editForm, bmiVal),
//       updatedBy: "Class Teacher",
//     };
//     const prevHistory = Array.isArray(base.history) ? [...base.history] : [];

//     const healthPayload = {
//       ...base,
//       height: hVal || 0,
//       weight: wVal || 0,
//       bloodGroup: editForm.blood,
//       allergies: editForm.allergies,
//       chronic: editForm.chronic,
//       medication: editForm.medication,
//       vaccination: editForm.vaccination,
//       notes: editForm.notes,
//       campReport: camp,
//       lastReportDate: editForm.reportDate || "",
//       parentVisible: editForm.parentVisible,
//       teacherGeneralHealth: editForm.generalHealth,
//       teacherFollowUp: editForm.followUpRequired,
//       history: [...prevHistory, historyEntry],
//     };

//     const payload = {
//       personalInfo: {
//         name: selectedStudent.name,
//         class: selectedStudent.class,
//         section: selectedStudent.section,
//         rollNo: selectedStudent.roll,
//         bloodGroup: editForm.blood,
//       },
//       health: healthPayload,
//     };
//     try {
//       const res = await api.put(`/students/${selectedStudent._id}/health`, payload);
//       if (res.data.success) {
//         try {
//           sessionStorage.removeItem(draftKey(selectedStudent.id));
//         } catch {
//           /* ignore */
//         }
//         await fetchStudents();
//         setOpenEdit(false);
//         setSelectedStudent(null);
//       }
//     } catch (err) {
//       console.error(err);
//       alert(err.response?.data?.message || "Failed to update record");
//     }
//   };

//   const parseCsvRows = (text) => {
//     const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
//     if (lines.length < 2) return [];
//     const splitLine = (line) => {
//       const out = [];
//       let cur = "";
//       let q = false;
//       for (let i = 0; i < line.length; i++) {
//         const ch = line[i];
//         if (ch === '"') {
//           q = !q;
//         } else if ((ch === "," && !q) || ch === "\t") {
//           out.push(cur.trim());
//           cur = "";
//         } else cur += ch;
//       }
//       out.push(cur.trim());
//       return out;
//     };
//     const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
//     const rows = [];
//     for (let i = 1; i < lines.length; i++) {
//       const cells = splitLine(lines[i]);
//       const row = {};
//       headers.forEach((h, j) => {
//         row[h] = cells[j] ?? "";
//       });
//       rows.push(row);
//     }
//     return rows;
//   };

//   const onImportFile = async (e) => {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (!file) return;
//     try {
//       const text = await file.text();
//       const rows = parseCsvRows(text);
//       if (!rows.length) {
//         alert("No data rows found. Use stdId column to match students.");
//         return;
//       }
//       let ok = 0;
//       let skipped = 0;
//       for (const row of rows) {
//         const stdId = (
//           row.stdid ||
//           row["student id"] ||
//           row.studentid ||
//           ""
//         ).trim();
//         if (!stdId) {
//           skipped++;
//           continue;
//         }
//         const stu = students.find(
//           (s) => (s.stdId || "").toLowerCase() === stdId.toLowerCase()
//         );
//         if (!stu) {
//           skipped++;
//           continue;
//         }
//         const base = stu._rawHealth || {};
//         const camp = { ...(base.campReport || {}) };
//         const g = (row.generalhealth || row["general health"] || "").trim();
//         const fu = (row.followup || row["follow-up"] || row.followuprequired || "").trim();
//         const pv = (row.parentvisible || "").trim();
//         if (row.vision) camp.eye = row.vision.trim();
//         if (row.dental) camp.dental = row.dental.trim();
//         const healthPayload = {
//           ...base,
//           height: row.height ? Number(row.height) : stu.height,
//           weight: row.weight ? Number(row.weight) : stu.weight,
//           bloodGroup: row.blood || row.bloodgroup || stu.blood,
//           allergies: row.allergies || stu.allergies,
//           chronic: row.chronic || stu.chronic,
//           medication: row.medication || stu.medication,
//           vaccination: row.vaccination || stu.vaccination,
//           notes: row.notes !== undefined && row.notes !== "" ? row.notes : stu.notes,
//           campReport: camp,
//           lastReportDate: row.reportdate || row["report date"] || base.lastReportDate || "",
//           parentVisible: pv === "No" ? "No" : pv === "Yes" ? "Yes" : stu.parentVisible,
//           teacherGeneralHealth:
//             g && ["Normal", "Follow-up", "Pending"].includes(g)
//               ? g
//               : base.teacherGeneralHealth || "",
//           teacherFollowUp:
//             fu && ["Yes", "No", "Pending"].includes(fu)
//               ? fu
//               : base.teacherFollowUp || "",
//         };
//         try {
//           await api.put(`/students/${stu._id}/health`, {
//             personalInfo: {
//               name: stu.name,
//               class: stu.class,
//               section: stu.section,
//               rollNo: stu.roll,
//               bloodGroup: healthPayload.bloodGroup,
//             },
//             health: healthPayload,
//           });
//           ok++;
//         } catch (err) {
//           console.error(err);
//           skipped++;
//         }
//       }
//       await fetchStudents();
//       alert(`Import finished. Updated ${ok} student(s). Skipped ${skipped}.`);
//     } catch (err) {
//       console.error(err);
//       alert("Could not read import file.");
//     }
//   };

//   const downloadImportTemplate = () => {
//     const header =
//       "stdId,height,weight,vision,dental,blood,allergies,chronic,medication,vaccination,notes,generalHealth,followUp,parentVisible,reportDate";
//     const blob = new Blob([header + "\n"], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "health_import_template.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const searchLower = search.trim().toLowerCase();
//   const filteredBySearch = useMemo(() => {
//     if (!searchLower) return students;
//     return students.filter((s) => {
//       const roll = String(s.roll || "").toLowerCase();
//       const sid = String(s.stdId || "").toLowerCase();
//       const name = (s.name || "").toLowerCase();
//       return (
//         name.includes(searchLower) ||
//         roll.includes(searchLower) ||
//         sid.includes(searchLower)
//       );
//     });
//   }, [students, searchLower]);

//   const filteredStudents = useMemo(() => {
//     let list =
//       statusFilter === "All"
//         ? filteredBySearch
//         : filteredBySearch.filter((s) => s.healthStatus === statusFilter);

//     const copy = [...list];
//     if (sortBy === "name") {
//       copy.sort((a, b) =>
//         (a.name || "").localeCompare(b.name || "", undefined, {
//           sensitivity: "base",
//         })
//       );
//     } else if (sortBy === "bmi") {
//       copy.sort((a, b) => {
//         const av = a.bmiNum;
//         const bv = b.bmiNum;
//         if (av == null && bv == null) return 0;
//         if (av == null) return 1;
//         if (bv == null) return -1;
//         return av - bv;
//       });
//     } else if (sortBy === "health") {
//       const order = { Pending: 0, "Follow-up": 1, Normal: 2 };
//       copy.sort(
//         (a, b) =>
//           (order[a.healthStatus] ?? 9) - (order[b.healthStatus] ?? 9)
//       );
//     } else if (sortBy === "updated") {
//       copy.sort((a, b) => {
//         const ta = a.updatedAt ? a.updatedAt.getTime() : 0;
//         const tb = b.updatedAt ? b.updatedAt.getTime() : 0;
//         return tb - ta;
//       });
//     }
//     return copy;
//   }, [filteredBySearch, statusFilter, sortBy]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [search, statusFilter, sortBy]);

//   const indexOfLast = currentPage * ROWS_PER_PAGE;
//   const indexOfFirst = indexOfLast - ROWS_PER_PAGE;
//   const currentRows = filteredStudents.slice(indexOfFirst, indexOfLast);
//   const totalPages = Math.max(
//     1,
//     Math.ceil(filteredStudents.length / ROWS_PER_PAGE)
//   );

//   const assignedLabel = useMemo(
//     () => assignedLabelFromStudents(students),
//     [students]
//   );

//   const reportsUpdatedCount = useMemo(
//     () => students.filter((s) => s.height > 0 && s.weight > 0).length,
//     [students]
//   );

//   const followUpCount = useMemo(
//     () => students.filter((s) => s.healthStatus === "Follow-up").length,
//     [students]
//   );

//   const summaryCards = useMemo(
//     () => [
//       {
//         label: "Assigned Class",
//         value: assignedLabel,
//         bg: "bg-blue-50",
//         icon: <FiUser className="text-blue-600" />,
//       },
//       {
//         label: "Total Students",
//         value: students.length,
//         bg: "bg-slate-50",
//         icon: <FiActivity className="text-slate-600" />,
//       },
//       {
//         label: "Reports Updated",
//         value: reportsUpdatedCount,
//         bg: "bg-emerald-50",
//         icon: <FiCheckCircle className="text-emerald-600" />,
//       },
//       {
//         label: "Follow-up Required",
//         value: String(followUpCount).padStart(2, "0"),
//         bg: "bg-amber-50",
//         icon: <FiAlertCircle className="text-amber-600" />,
//       },
//     ],
//     [assignedLabel, students.length, reportsUpdatedCount, followUpCount]
//   );

//   const toggleSelect = (id) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   };

//   const toggleSelectAllOnPage = () => {
//     const pageIds = currentRows.map((r) => r.id);
//     const allOn = pageIds.length && pageIds.every((id) => selectedIds.has(id));
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (allOn) pageIds.forEach((id) => next.delete(id));
//       else pageIds.forEach((id) => next.add(id));
//       return next;
//     });
//   };

//   const exportReports = () => {
//     const sourceRows =
//       selectedIds.size > 0
//         ? filteredStudents.filter((s) => selectedIds.has(s.id))
//         : filteredStudents;
//     if (!sourceRows.length) {
//       alert("No students to export.");
//       return;
//     }
//     try {
//       const doc = new jsPDF({ orientation: "landscape" });
//       doc.setFontSize(14);
//       doc.text("Class health reports", 14, 12);
//       doc.setFontSize(10);
//       doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 18);
//       const head = [
//         [
//           "Student ID",
//           "Name",
//           "Class",
//           "Roll",
//           "Blood",
//           "H/W",
//           "BMI",
//           "Allergies",
//           "General",
//           "Follow-up",
//           "Vision",
//           "Dental",
//           "Last updated",
//         ],
//       ];
//       const body = sourceRows.map((s) => [
//         s.stdId || "—",
//         s.name,
//         `${s.class || ""}${s.section ? ` ${s.section}` : ""}`.trim(),
//         s.roll || "—",
//         s.blood || "—",
//         s.height && s.weight ? `${s.height}cm / ${s.weight}kg` : "—",
//         s.bmiNum != null ? String(s.bmiNum) : "—",
//         s.allergies,
//         s.healthStatus,
//         s.followUp,
//         s.vision,
//         s.dental,
//         s.updatedLabel,
//       ]);
//       autoTable(doc, {
//         head,
//         body,
//         startY: 24,
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [37, 99, 235] },
//       });
//       const safe = assignedLabel.replace(/[^\w-]+/g, "_");
//       doc.save(`Class_health_reports_${safe || "export"}.pdf`);
//     } catch (e) {
//       console.error(e);
//       alert("Export failed. Please try again.");
//     }
//   };

//   const sectionTitle =
//     assignedLabel === "—"
//       ? "Student Health List"
//       : /^class\b/i.test(assignedLabel.trim())
//       ? `${assignedLabel.trim()} Student Health List`
//       : `Class ${assignedLabel} Student Health List`;

//   if (loading) {
//     return (
//       <div className="min-w-0 px-3 py-10 text-center text-gray-600 sm:px-4">
//         Loading health records…
//       </div>
//     );
//   }

//   if (loadError) {
//     return (
//       <div className="min-w-0 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 sm:p-6">
//         <p className="font-semibold">Could not load data</p>
//         <p className="text-sm mt-1">{loadError}</p>
//         <button
//           type="button"
//           onClick={() => fetchStudents()}
//           className="mt-3 px-4 py-2 bg-red-700 text-white rounded-md text-sm hover:bg-red-800"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="p-0 m-0 min-h-screen w-full min-w-0 max-w-[1600px] mx-auto">
//       <div className="text-gray-500 text-sm mb-2 flex flex-wrap items-center gap-1">
//         <span>Student Health</span>
//         <span>&gt;</span>
//         <span>My class</span>
//       </div>

//       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 min-w-0">
//         <div className="min-w-0 flex-1">
//           <h2 className="text-xl font-bold text-gray-900 break-words sm:text-2xl">
//             My Class Health Reports
//           </h2>
//         </div>
//         <div className="shrink-0 self-start sm:self-auto">
//         <HelpInfo
//           title="Teacher — Student Health"
//           description={`2.x Student Health (Class overview)

// View and update basic health data for students rostered to your assigned class and section.

// Sections:
// - Summary: Assigned class, roster size, how many students have height/weight entered, follow-ups
// - Filters: Search by name, roll number, or student ID; filter by derived health status; sort the table
// - Table: Vision and dental reflect the latest camp check fields when recorded
// - Export: PDF of the current filtered list, or only rows you selected via checkboxes

// Medical diagnosis remains with qualified medical staff; this screen is for school health records only.`}
//         />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 min-w-0 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
//         {summaryCards.map((item, i) => (
//           <div
//             key={i}
//             className={`min-w-0 rounded-lg border border-gray-200 shadow-sm p-4 ${item.bg}`}
//           >
//             <div className="flex items-center gap-3">
//               <div className="shrink-0">{item.icon}</div>
//               <div className="min-w-0 flex-1">
//                 <p className="text-gray-600 text-sm">{item.label}</p>
//                 <p className="text-lg font-semibold text-gray-900 mt-0.5 break-words sm:text-xl">
//                   {item.value}
//                 </p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
//         <div className="space-y-4 border-b border-gray-100 px-3 py-4 sm:px-4">
//           <h3 className="m-0 break-words text-base font-semibold text-[#1c2c4a] sm:text-lg">
//             {sectionTitle}
//           </h3>
//           <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
//             <div className="relative w-full min-w-0 xl:max-w-2xl xl:flex-1">
//               <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input
//                 type="search"
//                 placeholder="Search student name or roll no."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:w-auto xl:shrink-0">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-44"
//                 aria-label="Filter by status"
//               >
//                 <option value="All">All Status</option>
//                 <option value="Normal">Normal</option>
//                 <option value="Follow-up">Follow-up</option>
//                 <option value="Pending">Pending</option>
//               </select>
//               <div className="flex min-w-0 w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 sm:min-w-[200px] sm:max-w-xs sm:flex-1">
//                 <span className="shrink-0 text-sm text-gray-600">Sort by:</span>
//                 <select
//                   value={sortBy}
//                   onChange={(e) => setSortBy(e.target.value)}
//                   className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
//                   aria-label="Sort students"
//                 >
//                   <option value="name">Student name</option>
//                   <option value="bmi">BMI</option>
//                   <option value="health">Health status</option>
//                   <option value="updated">Last updated</option>
//                 </select>
//               </div>
//               <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
//                 <input
//                   ref={importInputRef}
//                   type="file"
//                   accept=".csv,text/csv"
//                   className="hidden"
//                   onChange={onImportFile}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => importInputRef.current?.click()}
//                   className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-100 sm:px-4"
//                 >
//                   <FiUpload size={16} className="shrink-0" />
//                   <span className="truncate">Import</span>
//                 </button>
//                 <button
//                   type="button"
//                   onClick={exportReports}
//                   className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:px-4"
//                 >
//                   <FiDownload size={16} className="shrink-0" />
//                   <span className="text-center leading-tight sm:whitespace-nowrap">
//                     Export reports
//                   </span>
//                 </button>
//               </div>
//             </div>
//           </div>
//           <p className="m-0 break-words text-xs text-gray-500">
//             Import CSV must include a <strong>stdId</strong> column.{" "}
//             <button
//               type="button"
//               className="text-blue-600 hover:underline font-medium"
//               onClick={downloadImportTemplate}
//             >
//               Download template
//             </button>
//           </p>
//         </div>

//         <div className="overflow-x-auto overscroll-x-contain px-1 pb-1 sm:px-0 sm:pb-0 [-webkit-overflow-scrolling:touch]">
//           <table className="w-full min-w-[1100px] text-xs sm:text-sm">
//             <thead className="bg-gray-50 text-left text-gray-700">
//               <tr>
//                 <th className="w-10 px-2 py-3 sm:px-3">
//                   <input
//                     type="checkbox"
//                     aria-label="Select all on this page"
//                     checked={
//                       currentRows.length > 0 &&
//                       currentRows.every((r) => selectedIds.has(r.id))
//                     }
//                     onChange={toggleSelectAllOnPage}
//                     className="rounded border-gray-300"
//                   />
//                 </th>
//                 <th className="px-2 py-3 sm:px-3">Student</th>
//                 <th className="whitespace-nowrap px-2 py-3 sm:px-3">Student ID</th>
//                 <th className="px-2 py-3 sm:px-3">Blood</th>
//                 <th className="px-2 py-3 sm:px-3">Allergies</th>
//                 <th className="whitespace-nowrap px-2 py-3 sm:px-3">Height / weight</th>
//                 <th className="px-2 py-3 text-center sm:px-3">BMI</th>
//                 <th className="px-2 py-3 sm:px-3">Vision</th>
//                 <th className="px-2 py-3 sm:px-3">Dental</th>
//                 <th className="px-2 py-3 sm:px-3">General health</th>
//                 <th className="px-2 py-3 sm:px-3">Follow-up</th>
//                 <th className="whitespace-nowrap px-2 py-3 sm:px-3">Last updated</th>
//                 <th className="px-2 py-3 text-center sm:px-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentRows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={13}
//                     className="px-4 py-10 text-center text-gray-500"
//                   >
//                     {students.length === 0
//                       ? "No students are assigned to your classes yet."
//                       : "No students match your search or filters."}
//                   </td>
//                 </tr>
//               ) : (
//                 currentRows.map((stu) => (
//                     <tr key={stu.id} className="border-t border-gray-100 hover:bg-blue-50/60">
//                       <td className="px-2 py-3 align-top sm:px-3">
//                         <input
//                           type="checkbox"
//                           checked={selectedIds.has(stu.id)}
//                           onChange={() => toggleSelect(stu.id)}
//                           className="rounded border-gray-300"
//                           aria-label={`Select ${stu.name}`}
//                         />
//                       </td>
//                       <td className="px-2 py-3 align-top sm:px-3">
//                         <div className="font-medium text-gray-900">{stu.name}</div>
//                         <div className="text-xs text-gray-500">
//                           {stu.class}
//                           {stu.section ? ` · ${stu.section}` : ""}
//                           {stu.roll ? ` · Roll ${stu.roll}` : ""}
//                         </div>
//                       </td>
//                       <td className="px-2 py-3 align-top whitespace-nowrap text-gray-700 sm:px-3">
//                         {stu.stdId || "—"}
//                       </td>
//                       <td className="px-2 py-3 align-top sm:px-3">{stu.blood || "—"}</td>
//                       <td className="max-w-[140px] px-2 py-3 align-top sm:px-3">
//                         <span
//                           className={`inline-block px-2 py-0.5 rounded text-xs ${
//                             stu.allergies !== "None"
//                               ? "bg-red-100 text-red-800"
//                               : "bg-gray-100 text-gray-600"
//                           }`}
//                         >
//                           {stu.allergies}
//                         </span>
//                       </td>
//                       <td className="px-2 py-3 align-top whitespace-nowrap text-gray-700 sm:px-3">
//                         {stu.height && stu.weight
//                           ? `${stu.height} cm / ${stu.weight} kg`
//                           : "—"}
//                       </td>
//                       <td className="px-2 py-3 text-center align-top text-gray-800 sm:px-3">
//                         {stu.bmiNum != null ? stu.bmiNum : "—"}
//                       </td>
//                       <td
//                         className={`max-w-[120px] px-2 py-3 align-top text-xs sm:px-3 ${campLineStyle(
//                           stu.vision
//                         )}`}
//                       >
//                         {stu.vision}
//                       </td>
//                       <td
//                         className={`max-w-[120px] px-2 py-3 align-top text-xs sm:px-3 ${campLineStyle(
//                           stu.dental
//                         )}`}
//                       >
//                         {stu.dental}
//                       </td>
//                       <td className="px-2 py-3 align-top sm:px-3">
//                         <span
//                           className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${healthPillClass(
//                             stu.healthStatus
//                           )}`}
//                         >
//                           {stu.healthStatus}
//                         </span>
//                       </td>
//                       <td className="px-2 py-3 align-top sm:px-3">
//                         <span
//                           className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${followPillClass(
//                             stu.followUp
//                           )}`}
//                         >
//                           {stu.followUp}
//                         </span>
//                       </td>
//                       <td className="px-2 py-3 align-top whitespace-nowrap text-gray-600 sm:px-3">
//                         {stu.updatedLabel}
//                       </td>
//                       <td className="px-2 py-3 align-top sm:px-3">
//                         <div className="flex justify-center gap-2">
//                           <button
//                             type="button"
//                             className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
//                             title="View"
//                             onClick={() => handleView(stu)}
//                           >
//                             <FiEye size={18} />
//                           </button>
//                           <button
//                             type="button"
//                             className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
//                             title="Update health report"
//                             onClick={() => handleEdit(stu)}
//                           >
//                             <FiEdit size={18} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex flex-col gap-2 border-t border-amber-100 bg-amber-50 px-3 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-4">
//           <span className="flex items-start gap-2 break-words">
//             <FiAlertCircle className="mt-0.5 shrink-0" />
//             Teachers may maintain basic health information for assigned classes only.
//             Medical diagnosis should be handled by a doctor or nurse.
//           </span>
//         </div>

//         <div className="flex flex-col items-stretch justify-between gap-3 border-t border-gray-100 px-3 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:px-4">
//           <p className="min-w-0 break-words text-center sm:text-left">
//             Showing{" "}
//             {filteredStudents.length === 0
//               ? "0"
//               : `${indexOfFirst + 1}–${Math.min(
//                   indexOfLast,
//                   filteredStudents.length
//                 )}`}{" "}
//             of {filteredStudents.length} students
//             {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
//           </p>
//           <div className="flex shrink-0 justify-center gap-2 sm:justify-end">
//             <button
//               type="button"
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((p) => p - 1)}
//               className="min-h-[44px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-h-0"
//             >
//               Previous
//             </button>
//             <button
//               type="button"
//               disabled={currentPage === totalPages}
//               onClick={() => setCurrentPage((p) => p + 1)}
//               className="min-h-[44px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-h-0"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* View — Health overview */}
//       {openView && selectedStudent && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
//           <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
//               <div className="min-w-0 flex-1">
//                 <h3 className="m-0 break-words text-lg font-bold text-gray-900 sm:text-xl">
//                   {selectedStudent.name} — Health overview
//                 </h3>
//                 <p className="mt-1 m-0 break-words text-sm text-gray-500">
//                   Class{" "}
//                   {`${selectedStudent.class || ""}${
//                     selectedStudent.section || ""
//                   }`.trim() || "—"}{" "}
//                   · Roll no. {selectedStudent.roll || "—"}
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpenView(false);
//                   setSelectedStudent(null);
//                 }}
//                 className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
//                 aria-label="Close"
//               >
//                 <FiX size={20} />
//               </button>
//             </div>
//             <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
//               {(() => {
//                 const overviewGeneral =
//                   selectedStudent.healthStatus === "Normal"
//                     ? "Active"
//                     : selectedStudent.healthStatus;
//                 const infoCards = [
//                   { label: "Student ID", value: selectedStudent.stdId || "—" },
//                   { label: "Roll number", value: selectedStudent.roll || "—" },
//                   { label: "Blood group", value: selectedStudent.blood || "—" },
//                   { label: "Allergies", value: selectedStudent.allergies },
//                   {
//                     label: "Height / weight",
//                     value:
//                       selectedStudent.height && selectedStudent.weight
//                         ? `${selectedStudent.height} cm / ${selectedStudent.weight} kg`
//                         : "—",
//                   },
//                   {
//                     label: "BMI",
//                     value:
//                       selectedStudent.bmiNum != null
//                         ? String(selectedStudent.bmiNum)
//                         : "—",
//                   },
//                   { label: "Vision", value: selectedStudent.vision },
//                   { label: "Dental", value: selectedStudent.dental },
//                   { label: "General health", value: overviewGeneral },
//                   { label: "Follow-up", value: selectedStudent.followUp },
//                   {
//                     label: "Emergency contact",
//                     value: (() => {
//                       const phone = selectedStudent.emergencyPhone || "—";
//                       const n = selectedStudent.emergencyContactName;
//                       const r = selectedStudent.emergencyContactRelation;
//                       if (phone === "—" && !n && !r) return "—";
//                       const bits = [phone !== "—" ? phone : null, n || null, r ? `(${r})` : null].filter(Boolean);
//                       return bits.join(" · ") || "—";
//                     })(),
//                   },
//                   {
//                     label: "Last updated",
//                     value: selectedStudent.updatedLabel,
//                   },
//                 ];
//                 return (
//                   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                     {infoCards.map((c) => (
//                       <div
//                         key={c.label}
//                         className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-3"
//                       >
//                         <p className="text-xs text-gray-500 m-0 mb-1">{c.label}</p>
//                         <p className="text-sm font-semibold text-gray-900 m-0 break-words">
//                           {c.value}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 );
//               })()}
//               <div>
//                 <h4 className="text-sm font-bold text-gray-900 m-0 mb-2">
//                   Teacher remarks
//                 </h4>
//                 <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 min-h-[3rem]">
//                   {selectedStudent.notes?.trim()
//                     ? selectedStudent.notes
//                     : "No remarks recorded."}
//                 </div>
//               </div>
//               <div>
//                 <h4 className="text-sm font-bold text-gray-900 m-0 mb-2">
//                   Health history
//                 </h4>
//                 <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-gray-200 [-webkit-overflow-scrolling:touch]">
//                   <table className="w-full min-w-[560px] text-left text-sm">
//                     <thead className="bg-gray-50 text-gray-600">
//                       <tr>
//                         <th className="px-3 py-2 font-medium">Date</th>
//                         <th className="px-3 py-2 font-medium">Update type</th>
//                         <th className="px-3 py-2 font-medium">Details</th>
//                         <th className="px-3 py-2 font-medium">Updated by</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {selectedStudent.history.length === 0 ? (
//                         <tr>
//                           <td
//                             colSpan={4}
//                             className="px-3 py-6 text-center text-gray-500"
//                           >
//                             No history yet.
//                           </td>
//                         </tr>
//                       ) : (
//                         [...selectedStudent.history].reverse().map((h, i) => (
//                           <tr key={i} className="border-t border-gray-100">
//                             <td className="px-3 py-2 whitespace-nowrap text-gray-800">
//                               {h.date || "—"}
//                             </td>
//                             <td className="px-3 py-2 text-gray-800">
//                               {h.updateType || h.issue || "—"}
//                             </td>
//                             <td className="px-3 py-2 text-gray-700 max-w-md">
//                               {h.action || "—"}
//                             </td>
//                             <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
//                               {h.updatedBy || "Class Teacher"}
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//             <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpenView(false);
//                   setSelectedStudent(null);
//                 }}
//                 className="min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:min-h-0 sm:w-auto"
//               >
//                 Close
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpenView(false);
//                   handleEdit(selectedStudent);
//                 }}
//                 className="min-h-[44px] w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:min-h-0 sm:w-auto"
//               >
//                 Update health report
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Update health report */}
//       {openEdit && selectedStudent && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
//           <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
//             <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
//               <div className="min-w-0 flex-1">
//                 <h3 className="m-0 break-words text-lg font-bold text-gray-900 sm:text-xl">
//                   Update health report
//                 </h3>
//                 <p className="mt-1 m-0 break-words text-sm text-gray-500">
//                   Only assigned class students are available to this teacher.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpenEdit(false);
//                   setSelectedStudent(null);
//                 }}
//                 className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
//                 aria-label="Close"
//               >
//                 <FiX size={20} />
//               </button>
//             </div>
//             <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
//               <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="min-w-0">
//                   <p className="m-0 break-words text-lg font-bold text-gray-900">
//                     {selectedStudent.name}
//                   </p>
//                   <p className="mt-1 m-0 break-words text-sm text-gray-600">
//                     Class{" "}
//                     {`${selectedStudent.class || ""}${
//                       selectedStudent.section || ""
//                     }`.trim() || "—"}{" "}
//                     · Roll no. {selectedStudent.roll || "—"}
//                   </p>
//                 </div>
//                 <span className="shrink-0 self-start rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 sm:self-auto">
//                   My class student
//                 </span>
//               </div>
//               {(() => {
//                 const hn = Number(editForm.height);
//                 const wn = Number(editForm.weight);
//                 const bmiAuto =
//                   hn > 0 && wn > 0 ? calcBMINumber(hn, wn) : null;
//                 const fieldClass =
//                   "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white";
//                 const labelClass = "block text-xs font-bold text-gray-800 mb-1.5";
//                 return (
//                   <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
//                     <div>
//                       <label className={labelClass}>Report date</label>
//                       <input
//                         type="date"
//                         className={fieldClass}
//                         value={editForm.reportDate}
//                         onChange={(e) => updateField("reportDate", e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>Blood group</label>
//                       <input
//                         className={fieldClass}
//                         value={editForm.blood}
//                         onChange={(e) => updateField("blood", e.target.value)}
//                         placeholder="e.g. B+"
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>Allergies</label>
//                       <input
//                         className={fieldClass}
//                         value={editForm.allergies}
//                         onChange={(e) => updateField("allergies", e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>Height (cm)</label>
//                       <input
//                         type="number"
//                         className={fieldClass}
//                         value={editForm.height}
//                         onChange={(e) => updateField("height", e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>Weight (kg)</label>
//                       <input
//                         type="number"
//                         className={fieldClass}
//                         value={editForm.weight}
//                         onChange={(e) => updateField("weight", e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>BMI (auto)</label>
//                       <input
//                         className={`${fieldClass} bg-gray-50 text-gray-800`}
//                         readOnly
//                         value={bmiAuto != null ? String(bmiAuto) : "—"}
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>Vision status</label>
//                       <select
//                         className={fieldClass}
//                         value={editForm.visionStatus}
//                         onChange={(e) =>
//                           updateField("visionStatus", e.target.value)
//                         }
//                       >
//                         <option value="Normal">Normal</option>
//                         <option value="Needs Checkup">Needs checkup</option>
//                         <option value="Not Checked">Not checked</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className={labelClass}>Dental status</label>
//                       <select
//                         className={fieldClass}
//                         value={editForm.dentalStatus}
//                         onChange={(e) =>
//                           updateField("dentalStatus", e.target.value)
//                         }
//                       >
//                         <option value="Normal">Normal</option>
//                         <option value="Needs Checkup">Needs checkup</option>
//                         <option value="Not Checked">Not checked</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className={labelClass}>Vaccination</label>
//                       <input
//                         className={fieldClass}
//                         value={editForm.vaccination}
//                         onChange={(e) =>
//                           updateField("vaccination", e.target.value)
//                         }
//                       />
//                     </div>
//                     <div>
//                       <label className={labelClass}>General health status</label>
//                       <select
//                         className={fieldClass}
//                         value={editForm.generalHealth}
//                         onChange={(e) =>
//                           updateField("generalHealth", e.target.value)
//                         }
//                       >
//                         <option value="Normal">Normal</option>
//                         <option value="Follow-up">Follow-up</option>
//                         <option value="Pending">Pending</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className={labelClass}>Follow-up required</label>
//                       <select
//                         className={fieldClass}
//                         value={editForm.followUpRequired}
//                         onChange={(e) =>
//                           updateField("followUpRequired", e.target.value)
//                         }
//                       >
//                         <option value="No">No</option>
//                         <option value="Yes">Yes</option>
//                         <option value="Pending">Pending</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className={labelClass}>Parent visible</label>
//                       <select
//                         className={fieldClass}
//                         value={editForm.parentVisible}
//                         onChange={(e) =>
//                           updateField("parentVisible", e.target.value)
//                         }
//                       >
//                         <option value="Yes">Yes</option>
//                         <option value="No">No</option>
//                       </select>
//                     </div>
//                     <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className={labelClass}>Chronic condition</label>
//                         <input
//                           className={fieldClass}
//                           value={editForm.chronic}
//                           onChange={(e) => updateField("chronic", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <label className={labelClass}>Medication</label>
//                         <input
//                           className={fieldClass}
//                           value={editForm.medication}
//                           onChange={(e) =>
//                             updateField("medication", e.target.value)
//                           }
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })()}
//               <div>
//                 <label className="block text-xs font-bold text-gray-800 mb-1.5">
//                   Teacher remarks
//                 </label>
//                 <textarea
//                   className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                   rows={4}
//                   value={editForm.notes}
//                   onChange={(e) => updateField("notes", e.target.value)}
//                   placeholder="Example: Student looked active. Vision check recommended."
//                 />
//               </div>
//             </div>
//             <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2 sm:px-6 sm:py-4">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpenEdit(false);
//                   setSelectedStudent(null);
//                 }}
//                 className="min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:min-h-0 sm:w-auto"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={saveDraft}
//                 className="min-h-[44px] w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 sm:min-h-0 sm:w-auto"
//               >
//                 Save draft
//               </button>
//               <button
//                 type="button"
//                 onClick={saveChanges}
//                 className="min-h-[44px] w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:min-h-0 sm:w-auto"
//               >
//                 Save &amp; update profile
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
export default function StudentHealth() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h2l1-2 2 4 1-2h2"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">
          Student Health
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          The Student Health module is currently under development.
          <br />
          We’re working on a better experience for you.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Coming Soon
        </div>

      </div>
    </div>
  );
}