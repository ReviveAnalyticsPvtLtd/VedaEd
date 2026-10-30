import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/apiClient";
import "./timetableBuilder.css";

const DAY_DEFS = [
  { code: "MON", name: "Monday", short: "Mon", label: "M" },
  { code: "TUE", name: "Tuesday", short: "Tue", label: "T" },
  { code: "WED", name: "Wednesday", short: "Wed", label: "W" },
  { code: "THU", name: "Thursday", short: "Thu", label: "T" },
  { code: "FRI", name: "Friday", short: "Fri", label: "F" },
  { code: "SAT", name: "Saturday", short: "Sat", label: "S" },
  { code: "SUN", name: "Sunday", short: "Sun", label: "S" },
];

const DAY_NAME_BY_CODE = {};
const DAY_CODE_BY_NAME = {};
const DAY_SHORT_BY_CODE = {};
DAY_DEFS.forEach((day) => {
  DAY_NAME_BY_CODE[day.code] = day.name;
  DAY_CODE_BY_NAME[day.name] = day.code;
  DAY_SHORT_BY_CODE[day.code] = day.short;
});

const DEFAULT_WORKING_DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

const STEP_LABELS = ["Set Schedule", "Subject Days", "Build Timetable", "Publish"];

const pad2 = (value) => String(value).padStart(2, "0");

const hhmmToMin = (value) => {
  if (!value || typeof value !== "string") return 0;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const minToHHMM = (minutes) => {
  const safe = Math.max(0, Math.round(minutes));
  return `${pad2(Math.floor(safe / 60) % 24)}:${pad2(safe % 60)}`;
};

const minsToTime = (minutes) => {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${pad2(hh)}:${pad2(m)} ${ap}`;
};

const hhmmToDisplay = (value) => minsToTime(hhmmToMin(value));

const periodTimeRange = (period) =>
  `${hhmmToDisplay(period.startTime)}–${hhmmToDisplay(period.endTime)}`;

const periodDisplayName = (period) => {
  if (!period) return "";
  if (period.type === "LUNCH") return period.name || "Lunch";
  if (/^P\d+$/i.test(period.name || "")) return period.name;
  if (period.periodId && /^P\d+$/i.test(period.periodId)) return period.periodId;
  return period.name || period.periodId || "";
};

const cellKey = (dayCode, periodId) => `${dayCode}::${periodId}`;

const parseCellKey = (key) => {
  const [dayCode, periodId] = String(key).split("::");
  return { dayCode, periodId };
};

const asList = (payload, ...keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const idOf = (value) => (value && typeof value === "object" ? value._id : value);

const normalizeWorkingDays = (days) => {
  const set = new Set(days || []);
  return DAY_DEFS.filter((day) => set.has(day.code)).map((day) => day.code);
};

const defaultScheduleForm = () => ({
  startTime: "08:30",
  periodCount: 7,
  defaultDurationMinutes: 40,
  defaultRoom: "",
  lunchAfterPeriod: 5,
  lunchDurationMinutes: 30,
});

const scheduleFormFromHeader = (header) => {
  const teaching = (header?.periods || []).filter((p) => p.type !== "LUNCH");
  return {
    startTime: header?.startTime || "08:30",
    periodCount: teaching.length || 7,
    defaultDurationMinutes: header?.defaultDurationMinutes || 40,
    defaultRoom: header?.defaultRoom || "",
    lunchAfterPeriod: header?.lunch?.afterPeriod ?? 5,
    lunchDurationMinutes: header?.lunch?.durationMinutes ?? 30,
  };
};

const requirementsPayloadFrom = (requirementsList) => ({
  requirements: (requirementsList || [])
    .filter((item) => item.subjectId && item.teacherId)
    .map((item) => ({
      subjectId: item.subjectId,
      teacherId: item.teacherId,
      periodsPerWeek: Number(item.periodsPerWeek) || 0,
      days: item.days || [],
      preferredPeriodId: item.preferredPeriodId || null,
    })),
});

const entriesPayloadFromSlots = (slotsMap) => ({
  entries: Object.entries(slotsMap || {}).map(([key, slot]) => {
    const { dayCode, periodId } = parseCellKey(key);
    return {
      day: DAY_NAME_BY_CODE[dayCode] || dayCode,
      periodId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      roomNo: slot.roomNo || "",
    };
  }),
});

// Mirrors what the save call sends for a header that was just loaded, so an
// unchanged section is not re-uploaded on every save/publish.
const schedulePayloadFromHeader = (loadedHeader) => {
  const form = scheduleFormFromHeader(loadedHeader);
  return {
    workingDays:
      loadedHeader?.workingDays?.length > 0
        ? normalizeWorkingDays(loadedHeader.workingDays)
        : DEFAULT_WORKING_DAYS,
    startTime: form.startTime,
    defaultDurationMinutes: Number(form.defaultDurationMinutes) || 40,
    defaultRoom: loadedHeader?.defaultRoom || "",
    lunch: {
      afterPeriod: Number(form.lunchAfterPeriod) || null,
      durationMinutes: Number(form.lunchDurationMinutes) || 30,
    },
    periods: loadedHeader?.periods || [],
  };
};

const Stepper = ({ step }) => (
  <div className="card">
    <div className="card-body">
      <div className="stepper">
        {STEP_LABELS.map((label, index) => {
          const number = index + 1;
          const cls = number < step ? "done" : number === step ? "current" : "";
          return (
            <React.Fragment key={label}>
              <div className={`step ${cls}`}>
                <div className="step-dot">{number < step ? "✓" : number}</div>
                <div className="step-label">{label}</div>
              </div>
              {index < STEP_LABELS.length - 1 && <div className="step-line" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </div>
);

const TimetableBuilder = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allEntries, setAllEntries] = useState([]);

  const [criteriaAcademicYear, setCriteriaAcademicYear] = useState("");
  const [criteriaClass, setCriteriaClass] = useState("");
  const [criteriaSection, setCriteriaSection] = useState("");

  const [header, setHeader] = useState(null);
  const [loadingHeader, setLoadingHeader] = useState(false);
  const [headerError, setHeaderError] = useState("");

  const [mode, setMode] = useState("view");
  const [step, setStep] = useState(0);
  const [showCopySetup, setShowCopySetup] = useState(false);

  const [workingDays, setWorkingDays] = useState(DEFAULT_WORKING_DAYS);
  const [periods, setPeriods] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [slots, setSlots] = useState({});
  const [defaultRoom, setDefaultRoom] = useState("");
  const [scheduleForm, setScheduleForm] = useState(defaultScheduleForm());

  const [copyClass, setCopyClass] = useState("");
  const [copySection, setCopySection] = useState("");
  const [copySections, setCopySections] = useState([]);

  const [exportMenu, setExportMenu] = useState(null);
  const [busy, setBusy] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editForm, setEditForm] = useState({
    subjectId: "",
    teacherId: "",
    roomNo: "",
  });
  const [editConflict, setEditConflict] = useState("");

  const [dragSource, setDragSource] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [showDragModal, setShowDragModal] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);

  // Payload snapshots of what is already persisted, used to avoid re-sending
  // unchanged schedule/requirements/entries on save or publish.
  const savedSnapshotRef = useRef({
    schedule: null,
    requirements: null,
    entries: null,
  });

  const showToast = useCallback((message) => {
    setToastMsg(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const clsName = useMemo(
    () => classes.find((c) => String(c._id) === String(criteriaClass))?.name || "",
    [classes, criteriaClass]
  );
  const secName = useMemo(
    () => sections.find((s) => String(s._id) === String(criteriaSection))?.name || "",
    [sections, criteriaSection]
  );
  const yearLabel = useMemo(() => {
    const year = academicYears.find(
      (y) => String(y._id || y.id) === String(criteriaAcademicYear)
    );
    return year?.label || year?.name || "";
  }, [academicYears, criteriaAcademicYear]);

  const currentAssignment = useMemo(
    () =>
      assignments.find(
        (a) =>
          String(idOf(a.class)) === String(criteriaClass) &&
          String(idOf(a.section)) === String(criteriaSection)
      ),
    [assignments, criteriaClass, criteriaSection]
  );

  const classTeacherLabel = useMemo(() => {
    const classTeacher = currentAssignment?.classTeacher;
    if (!classTeacher) return "Not assigned";
    if (typeof classTeacher === "object") {
      return classTeacher.personalInfo?.name || classTeacher.name || "Not assigned";
    }
    const found = teachers.find(
      (t) => String(t._id) === String(classTeacher)
    );
    return found?.personalInfo?.name || found?.name || "Not assigned";
  }, [currentAssignment, teachers]);

  const availableTeachers = useMemo(() => {
    return teachers;
  }, [teachers]);

  const teachingPeriods = useMemo(
    () => periods.filter((p) => p.type !== "LUNCH"),
    [periods]
  );

  const subjectOptions = useMemo(() => {
    const list = [...subjects];
    requirements.forEach((requirement) => {
      if (
        requirement.subjectId &&
        !list.some((s) => String(s._id) === String(requirement.subjectId))
      ) {
        list.push({
          _id: requirement.subjectId,
          subjectName: requirement.subjectName || "Subject",
        });
      }
    });
    return list;
  }, [subjects, requirements]);

  const subjectNameOf = useCallback(
    (subjectId) => {
      const found =
        subjectOptions.find((s) => String(s._id) === String(subjectId)) ||
        requirements.find((r) => String(r.subjectId) === String(subjectId));
      return found?.subjectName || "Subject";
    },
    [subjectOptions, requirements]
  );

  const teacherNameOf = useCallback(
    (teacherId) => {
      const found =
        availableTeachers.find((t) => String(t._id) === String(teacherId)) ||
        teachers.find((t) => String(t._id) === String(teacherId));
      return found?.personalInfo?.name || found?.name || "Teacher";
    },
    [availableTeachers, teachers]
  );

  const refreshAllEntries = useCallback(async () => {
    try {
      const res = await api.get("/timetables");
      setAllEntries(asList(res.data, "timetables") || []);
    } catch (err) {
      console.error("Error loading school timetable entries:", err);
      setAllEntries([]);
    }
  }, []);

  const fetchSectionsFor = useCallback(async (classId) => {
    const res = await api.get("/sections", { params: { classId } });
    return asList(res.data, "sections");
  }, []);

  const fetchSubjectsFor = useCallback(async (classId) => {
    try {
      const res = await api.get("/subjects", { params: { classId } });
      return asList(res.data, "subjects");
    } catch (err) {
      try {
        const res = await api.get("/subjects");
        return asList(res.data, "subjects");
      } catch (innerErr) {
        return [];
      }
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get("/staff");
      const staff = asList(res.data, "staff");
      const onlyTeachers = staff.filter((s) => {
        const role = String(
          s?.personalInfo?.role || s?.role || s?.designation || ""
        )
          .trim()
          .toLowerCase();

        return role === "teacher";
      });
      setTeachers(onlyTeachers);
      console.log(
        "[TIMETABLE] Teachers fetched:",
        onlyTeachers.length,
        onlyTeachers.map((t) => t.personalInfo?.name || t.name)
      );
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get("/assignTeachers");
      setAssignments(asList(res.data, "assignments"));
    } catch (err) {
      console.error("Error fetching teacher assignments:", err);
      setAssignments([]);
    }
  }, []);

  // Base dropdowns
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.get("/academic-years");
        const years = asList(res.data, "academicYears");
        if (!mounted) return;
        setAcademicYears(years);
        const active = years.find((year) => year.isActive) || years[0];
        if (active) {
          setCriteriaAcademicYear((prev) => prev || active._id || active.id || "");
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
      }

      try {
        const res = await api.get("/classes");
        const list = asList(res.data, "classes");
        if (!mounted) return;
        setClasses(list);
        if (list.length > 0) {
          setCriteriaClass((prev) => prev || list[0]._id);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };

    load();
    fetchTeachers();
    fetchAssignments();
    refreshAllEntries();

    return () => {
      mounted = false;
    };
  }, [fetchTeachers, fetchAssignments, refreshAllEntries]);

  // Sections + subjects for the selected class
  useEffect(() => {
    let mounted = true;

    if (!criteriaClass) {
      setSections([]);
      setSubjects([]);
      setCriteriaSection("");
      return () => {
        mounted = false;
      };
    }

    fetchSectionsFor(criteriaClass)
      .then((list) => {
        if (!mounted) return;
        setSections(list);
        setCriteriaSection((prev) => {
          if (prev && list.some((s) => String(s._id) === String(prev))) return prev;
          return list[0]?._id || "";
        });
      })
      .catch((err) => {
        console.error("Error fetching sections:", err);
        if (mounted) setSections([]);
      });

    fetchSubjectsFor(criteriaClass)
      .then((list) => {
        if (mounted) setSubjects(list);
      })
      .catch((err) => {
        console.error("Error fetching subjects:", err);
        if (mounted) setSubjects([]);
      });

    return () => {
      mounted = false;
    };
  }, [criteriaClass, fetchSectionsFor, fetchSubjectsFor]);

  const entriesToSlots = useCallback(
    (entries, periodList) => {
      const map = {};
      (entries || []).forEach((entry) => {
        const dayCode =
          DAY_CODE_BY_NAME[entry.day] ||
          (DAY_NAME_BY_CODE[entry.day] ? entry.day : null);
        if (!dayCode) return;

        let periodId = entry.periodId;
        if (!periodId) {
          const match = (periodList || []).find(
            (p) =>
              p.type !== "LUNCH" &&
              hhmmToMin(p.startTime) === hhmmToMin(entry.timeFrom) &&
              hhmmToMin(p.endTime) === hhmmToMin(entry.timeTo)
          );
          periodId = match?.periodId;
        }
        if (!periodId) return;

        map[cellKey(dayCode, periodId)] = {
          entryId: entry._id,
          subjectId: idOf(entry.subject) || "",
          teacherId: idOf(entry.teacher) || "",
          roomNo: entry.roomNo || "",
          subjectName: entry.subject?.subjectName || "Subject",
          teacherName:
            entry.teacher?.personalInfo?.name || entry.teacher?.name || "Teacher",
        };
      });
      return map;
    },
    []
  );

  const hydrateRequirements = useCallback(
    (list) =>
      (list || []).map((requirement) => ({
        subjectId: idOf(requirement.subject) || "",
        teacherId: idOf(requirement.teacher) || "",
        periodsPerWeek: requirement.periodsPerWeek ?? 1,
        days: normalizeWorkingDays(requirement.days || []),
        preferredPeriodId: requirement.preferredPeriodId || "",
        subjectName: requirement.subject?.subjectName,
        teacherName:
          requirement.teacher?.personalInfo?.name || requirement.teacher?.name,
      })),
    []
  );

  const hydrateSchedule = useCallback((loadedHeader) => {
    const days =
      loadedHeader?.workingDays?.length > 0
        ? normalizeWorkingDays(loadedHeader.workingDays)
        : DEFAULT_WORKING_DAYS;
    setWorkingDays(days);
    setPeriods(loadedHeader?.periods || []);
    setDefaultRoom(loadedHeader?.defaultRoom || "");
    setScheduleForm(scheduleFormFromHeader(loadedHeader));
  }, []);

  const loadHeader = useCallback(async () => {
    setMode("view");
    setStep(0);
    setShowCopySetup(false);
    setExportMenu(null);

    if (!criteriaClass || !criteriaSection) {
      setHeader(null);
      setHeaderError("");
      setPeriods([]);
      setRequirements([]);
      setSlots({});
      savedSnapshotRef.current = {
        schedule: null,
        requirements: null,
        entries: null,
      };
      return;
    }

    setLoadingHeader(true);
    setHeaderError("");

    try {
      const params = {
        classId: criteriaClass,
        sectionId: criteriaSection,
      };
      if (criteriaAcademicYear) params.academicYearId = criteriaAcademicYear;

      const res = await api.get("/timetables/headers", { params });
      const headers = asList(res.data, "headers");
      const found = headers[0] || null;

      setHeader(found);

      if (!found) {
        setPeriods([]);
        setRequirements([]);
        setSlots({});
        setScheduleForm(defaultScheduleForm());
        setWorkingDays(DEFAULT_WORKING_DAYS);
        setDefaultRoom("");
        savedSnapshotRef.current = {
          schedule: null,
          requirements: null,
          entries: null,
        };
        return;
      }

      hydrateSchedule(found);

      const [entriesRes, requirementsRes] = await Promise.all([
        api.get(`/timetables/headers/${found._id}/entries`),
        api.get(`/timetables/headers/${found._id}/requirements`),
      ]);

      const loadedSlots = entriesToSlots(
        asList(entriesRes.data, "entries"),
        found.periods || []
      );
      const loadedRequirements = hydrateRequirements(
        asList(requirementsRes.data, "requirements")
      );

      setSlots(loadedSlots);
      setRequirements(loadedRequirements);

      savedSnapshotRef.current = {
        schedule: JSON.stringify(schedulePayloadFromHeader(found)),
        requirements: JSON.stringify(requirementsPayloadFrom(loadedRequirements)),
        entries: JSON.stringify(entriesPayloadFromSlots(loadedSlots)),
      };
    } catch (err) {
      console.error("Error loading timetable:", err);
      setHeaderError("Failed to load timetable configuration");
      setHeader(null);
      savedSnapshotRef.current = {
        schedule: null,
        requirements: null,
        entries: null,
      };
    } finally {
      setLoadingHeader(false);
    }
  }, [
    criteriaClass,
    criteriaSection,
    criteriaAcademicYear,
    entriesToSlots,
    hydrateRequirements,
    hydrateSchedule,
  ]);

  useEffect(() => {
    loadHeader();
  }, [loadHeader]);

  const ensureHeader = useCallback(async () => {
    if (header?._id) return header;

    if (!criteriaClass || !criteriaSection) {
      showToast("Select a class and section first.");
      return null;
    }

    const payload = {
      classId: criteriaClass,
      sectionId: criteriaSection,
    };
    if (criteriaAcademicYear) payload.academicYearId = criteriaAcademicYear;

    try {
      const res = await api.post("/timetables/headers", payload);
      const created = res.data?.data || null;
      setHeader(created);
      return created;
    } catch (err) {
      if (err.response?.status === 409) {
        try {
          const params = {
            classId: criteriaClass,
            sectionId: criteriaSection,
          };
          if (criteriaAcademicYear) params.academicYearId = criteriaAcademicYear;
          const res = await api.get("/timetables/headers", { params });
          const found = asList(res.data, "headers")[0] || null;
          setHeader(found);
          return found;
        } catch (innerErr) {
          showToast("Could not load the existing timetable.");
          return null;
        }
      }
      showToast(err.response?.data?.message || "Failed to create timetable.");
      return null;
    }
  }, [header, criteriaClass, criteriaSection, criteriaAcademicYear, showToast]);

  const saveSchedule = useCallback(
    async (targetHeader) => {
      try {
        const payload = {
          workingDays,
          startTime: scheduleForm.startTime,
          defaultDurationMinutes: Number(scheduleForm.defaultDurationMinutes) || 40,
          defaultRoom,
          lunch: {
            afterPeriod: Number(scheduleForm.lunchAfterPeriod) || null,
            durationMinutes: Number(scheduleForm.lunchDurationMinutes) || 30,
          },
          periods,
        };

        if (savedSnapshotRef.current.schedule === JSON.stringify(payload)) {
          return true;
        }

        const res = await api.put(
          `/timetables/headers/${targetHeader._id}/schedule`,
          payload
        );
        if (res.data?.data) setHeader(res.data.data);
        savedSnapshotRef.current.schedule = JSON.stringify(payload);
        return true;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to save schedule.");
        return false;
      }
    },
    [workingDays, scheduleForm, defaultRoom, periods, showToast]
  );

  const saveRequirements = useCallback(
    async (targetHeader) => {
      try {
        const payload = requirementsPayloadFrom(requirements);

        if (savedSnapshotRef.current.requirements === JSON.stringify(payload)) {
          return true;
        }

        await api.put(
          `/timetables/headers/${targetHeader._id}/requirements`,
          payload
        );
        savedSnapshotRef.current.requirements = JSON.stringify(payload);
        return true;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to save requirements.");
        return false;
      }
    },
    [requirements, showToast]
  );

  const saveSlots = useCallback(
    async (targetHeader, options = {}) => {
      try {
        const payload = entriesPayloadFromSlots(slots);

        if (savedSnapshotRef.current.entries === JSON.stringify(payload)) {
          return true;
        }

        const body = options.skipConflictValidation
          ? { ...payload, skipConflictValidation: true }
          : payload;

        await api.put(
          `/timetables/headers/${targetHeader._id}/entries`,
          body
        );
        savedSnapshotRef.current.entries = JSON.stringify(payload);
        return true;
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to save timetable entries.";
        showToast(message);
        return false;
      }
    },
    [slots, showToast]
  );

  const refreshSlots = useCallback(
    async (targetHeader) => {
      const entryRes = await api.get(
        `/timetables/headers/${targetHeader._id}/entries`
      );
      const loadedSlots = entriesToSlots(
        asList(entryRes.data, "entries"),
        targetHeader.periods || periods
      );
      setSlots(loadedSlots);
      savedSnapshotRef.current.entries = JSON.stringify(
        entriesPayloadFromSlots(loadedSlots)
      );
    },
    [entriesToSlots, periods]
  );

  const setStatus = useCallback(
    async (targetHeader, status) => {
      try {
        const res = await api.put(
          `/timetables/headers/${targetHeader._id}/status`,
          { status }
        );
        if (res.data?.data) setHeader(res.data.data);
        return true;
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update status.");
        return false;
      }
    },
    [showToast]
  );

  const findBusyEntry = useCallback(
    (teacherId, dayCode, period) => {
      if (!teacherId || !period) return null;
      const start = hhmmToMin(period.startTime);
      const end = hhmmToMin(period.endTime);
      return (allEntries || []).find((entry) => {
        const entryTeacher = idOf(entry.teacher);
        if (!entryTeacher || String(entryTeacher) !== String(teacherId)) return false;
        if (
          header?._id &&
          entry.timetableHeader &&
          String(entry.timetableHeader) === String(header._id)
        ) {
          return false;
        }
        const entryDay =
          DAY_CODE_BY_NAME[entry.day] ||
          (DAY_NAME_BY_CODE[entry.day] ? entry.day : null);
        if (entryDay !== dayCode) return false;
        if (entry.periodId && period.periodId) {
          return String(entry.periodId) === String(period.periodId);
        }
        const entryStart = hhmmToMin(entry.timeFrom);
        const entryEnd = hhmmToMin(entry.timeTo);
        return start < entryEnd && end > entryStart;
      });
    },
    [allEntries, header]
  );

  const assignRequirement = useCallback(
    (requirement, targetSlots) => {
      const validDays = (requirement.days || []).filter((day) =>
        workingDays.includes(day)
      );
      const candidates =
        requirement.preferredPeriodId &&
        teachingPeriods.some(
          (p) => p.periodId === requirement.preferredPeriodId
        )
          ? teachingPeriods.filter(
              (p) => p.periodId === requirement.preferredPeriodId
            )
          : teachingPeriods;

      let placed = 0;
      for (const dayCode of validDays) {
        if (placed >= Number(requirement.periodsPerWeek || 0)) break;
        let target = null;
        for (const period of candidates) {
          const key = cellKey(dayCode, period.periodId);
          if (targetSlots[key]) continue;
          if (findBusyEntry(requirement.teacherId, dayCode, period)) continue;
          target = { key, period };
          break;
        }
        if (target) {
          targetSlots[target.key] = {
            subjectId: requirement.subjectId,
            teacherId: requirement.teacherId,
            roomNo: defaultRoom || "",
            subjectName: subjectNameOf(requirement.subjectId),
            teacherName: teacherNameOf(requirement.teacherId),
          };
          placed += 1;
        }
      }
      return placed;
    },
    [
      workingDays,
      teachingPeriods,
      defaultRoom,
      findBusyEntry,
      subjectNameOf,
      teacherNameOf,
    ]
  );

  const handleAssign = useCallback(
    (index) => {
      const requirement = requirements[index];
      if (!requirement) return;
      const next = { ...slots };
      const placed = assignRequirement(requirement, next);
      setSlots(next);
      showToast(
        `${subjectNameOf(requirement.subjectId)}: ${placed} period${
          placed === 1 ? "" : "s"
        } assigned.`
      );
    },
    [requirements, slots, assignRequirement, showToast, subjectNameOf]
  );

  const buildTimetable = useCallback(async () => {
    setBusy(true);
    try {
      const target = await ensureHeader();
      if (!target) return;

      if (!(await saveSchedule(target))) return;
      if (!(await saveRequirements(target))) return;

      const next = {};
      requirements.forEach((requirement) => {
        if (requirement.subjectId && requirement.teacherId) {
          assignRequirement(requirement, next);
        }
      });
      setSlots(next);
      setStep(3);
    } finally {
      setBusy(false);
    }
  }, [
    ensureHeader,
    saveSchedule,
    saveRequirements,
    requirements,
    assignRequirement,
  ]);

  const buildDefaultRequirements = useCallback(() => {
    const firstTeacher =
      availableTeachers[0]?._id || teachers[0]?._id || "";
    const allDays = [...DEFAULT_WORKING_DAYS];
    return subjectOptions
      .filter((subject) => subject?._id)
      .map((subject) => ({
        subjectId: subject._id,
        teacherId: firstTeacher,
        periodsPerWeek: Math.max(1, allDays.length),
        days: [...allDays],
        preferredPeriodId: "",
        subjectName: subject.subjectName || subject.name || "Subject",
        teacherName: firstTeacher ? teacherNameOf(firstTeacher) : "",
      }));
  }, [subjectOptions, availableTeachers, teachers, teacherNameOf]);

  const startCreateChoice = useCallback(() => {
    setMode("create");
    setStep(0);
    setShowCopySetup(false);
    setExportMenu(null);
  }, []);

  const startNewTimetable = useCallback(() => {
    setWorkingDays([...DEFAULT_WORKING_DAYS]);
    setPeriods([]);
    setSlots({});
    setDefaultRoom("");
    const form = defaultScheduleForm();
    setScheduleForm(form);
    setRequirements(buildDefaultRequirements());
    setStep(1);
  }, [buildDefaultRequirements]);

  const openCopySetup = useCallback(async () => {
    setShowCopySetup(true);
    setStep(0);
    setExportMenu(null);
    setCopyClass(criteriaClass);
    setCopySection(criteriaSection);
    if (criteriaClass) {
      try {
        const list = await fetchSectionsFor(criteriaClass);
        setCopySections(list);
      } catch (err) {
        console.error("Error loading copy sections:", err);
        setCopySections([]);
      }
    }
  }, [criteriaClass, criteriaSection, fetchSectionsFor]);

  const handleCopyClassChange = useCallback(
    async (classId) => {
      setCopyClass(classId);
      setCopySection("");
      if (!classId) {
        setCopySections([]);
        return;
      }
      try {
        const list = await fetchSectionsFor(classId);
        setCopySections(list);
        setCopySection(list[0]?._id || "");
      } catch (err) {
        console.error("Error loading copy sections:", err);
        setCopySections([]);
      }
    },
    [fetchSectionsFor]
  );

  const applyCopySetup = useCallback(async () => {
    if (!copyClass || !copySection) {
      showToast("Select the class and section to copy from.");
      return;
    }

    setBusy(true);
    try {
      const params = { classId: copyClass, sectionId: copySection };
      if (criteriaAcademicYear) params.academicYearId = criteriaAcademicYear;
      const res = await api.get("/timetables/headers", { params });
      const source = asList(res.data, "headers")[0] || null;

      if (!source) {
        showToast("No timetable setup found for the selected class/section.");
        return;
      }

      const target = await ensureHeader();
      if (!target) return;

      const copyRes = await api.post(
        `/timetables/headers/${target._id}/copy-from`,
        { sourceHeaderId: source._id }
      );
      const copyData = copyRes.data?.data || {};
      const copiedHeader = copyData.header || target;

      const requirementsRes = await api.get(
        `/timetables/headers/${copiedHeader._id}/requirements`
      );

      const sourceDays =
        copiedHeader.workingDays?.length > 0
          ? normalizeWorkingDays(copiedHeader.workingDays)
          : [...DEFAULT_WORKING_DAYS];

      setHeader(copiedHeader);
      setWorkingDays(sourceDays);
      setPeriods(copiedHeader.periods || []);
      setRequirements(
        hydrateRequirements(asList(requirementsRes.data, "requirements"))
      );
      setDefaultRoom("");
      setSlots({});
      setScheduleForm(scheduleFormFromHeader(copiedHeader));
      setShowCopySetup(false);
      setStep(2);

      const skipped = copyData.skippedRequirements?.length || 0;
      const warning = copyData.warnings?.[0]?.message;

      showToast(
        skipped > 0
          ? `Setup copied. ${skipped} subject${
              skipped === 1 ? "" : "s"
            } skipped because the teacher is not assigned to this class/section.`
          : warning ||
              "Setup copied. Review subject days, then build timetable."
      );
    } catch (err) {
      console.error("Error copying timetable setup:", err);
      showToast(err.response?.data?.message || "Failed to copy timetable setup.");
    } finally {
      setBusy(false);
    }
  }, [
    copyClass,
    copySection,
    criteriaAcademicYear,
    ensureHeader,
    hydrateRequirements,
    showToast,
  ]);

  const cancelCreate = useCallback(() => {
    setMode("view");
    setStep(0);
    setShowCopySetup(false);
    loadHeader();
  }, [loadHeader]);

  const toggleWorkingDay = useCallback((code) => {
    setWorkingDays((prev) =>
      prev.includes(code)
        ? prev.filter((day) => day !== code)
        : normalizeWorkingDays([...prev, code])
    );
  }, []);

  const generatePeriods = useCallback(() => {
    const start = scheduleForm.startTime;
    const count = Number(scheduleForm.periodCount);
    const duration = Number(scheduleForm.defaultDurationMinutes);
    const lunchDuration = Number(scheduleForm.lunchDurationMinutes);
    const lunchAfter = Number(scheduleForm.lunchAfterPeriod);

    if (!start || !count || !duration || !lunchDuration || !lunchAfter) {
      showToast("Complete all schedule fields.");
      return;
    }

    let current = hhmmToMin(start);
    const nextPeriods = [];

    for (let i = 1; i <= count; i += 1) {
      nextPeriods.push({
        periodId: `P${i}`,
        name: `P${i}`,
        startTime: minToHHMM(current),
        endTime: minToHHMM(current + duration),
        durationMinutes: duration,
        type: "TEACHING",
      });
      current += duration;

      if (lunchAfter && i === lunchAfter) {
        nextPeriods.push({
          periodId: "LUNCH",
          name: "Lunch",
          startTime: minToHHMM(current),
          endTime: minToHHMM(current + lunchDuration),
          durationMinutes: lunchDuration,
          type: "LUNCH",
        });
        current += lunchDuration;
      }
    }

    setPeriods(nextPeriods);
  }, [scheduleForm, showToast]);

  const recalculatePeriods = useCallback((list) => {
    if (!list.length) return list;
    let current = hhmmToMin(list[0].startTime);
    return list.map((period) => {
      const duration = Number(period.durationMinutes) || 0;
      const next = {
        ...period,
        startTime: minToHHMM(current),
        endTime: minToHHMM(current + duration),
        durationMinutes: duration,
      };
      current += duration;
      return next;
    });
  }, []);

  const handleDurationChange = useCallback(
    (index, value) => {
      setPeriods((prev) => {
        const next = prev.map((period, i) =>
          i === index
            ? { ...period, durationMinutes: Number(value) || period.durationMinutes }
            : period
        );
        return recalculatePeriods(next);
      });
    },
    [recalculatePeriods]
  );

  const continueFromSchedule = useCallback(async () => {
    if (periods.length === 0) {
      showToast("Generate a schedule first.");
      return;
    }
    if (workingDays.length === 0) {
      showToast("Select at least one working day.");
      return;
    }

    setBusy(true);
    try {
      const target = await ensureHeader();
      if (!target) return;
      if (!(await saveSchedule(target))) return;

      if (requirements.length === 0) {
        setRequirements(buildDefaultRequirements());
      }
      setStep(2);
    } finally {
      setBusy(false);
    }
  }, [
    periods,
    workingDays,
    ensureHeader,
    saveSchedule,
    requirements,
    buildDefaultRequirements,
    showToast,
  ]);

  const updateRequirement = useCallback((index, field, value) => {
    setRequirements((prev) =>
      prev.map((requirement, i) => {
        if (i !== index) return requirement;
        let next = { ...requirement, [field]: value };

        if (field === "periodsPerWeek") {
          const count = Math.max(1, Number(value) || 1);
          next.periodsPerWeek = count;
          if ((next.days || []).length > count) {
            next.days = next.days.slice(0, count);
          }
        }

        if (field === "teacherId") {
          next.teacherName = teacherNameOf(value);
        }

        return next;
      })
    );
  }, [teacherNameOf]);

  const toggleRequirementDay = useCallback(
    (index, code) => {
      const requirement = requirements[index];
      if (!requirement) return;
      const days = requirement.days || [];

      if (days.includes(code)) {
        updateRequirement(index, "days", days.filter((day) => day !== code));
        return;
      }

      const limit = Number(requirement.periodsPerWeek) || 0;
      if (days.length >= limit) {
        showToast(
          `Select up to ${limit} day${limit === 1 ? "" : "s"} for ${
            requirement.subjectName || subjectNameOf(requirement.subjectId)
          }.`
        );
        return;
      }

      updateRequirement(index, "days", normalizeWorkingDays([...days, code]));
    },
    [requirements, updateRequirement, showToast, subjectNameOf]
  );

  const dayConflict = useCallback(
    (index, dayCode) => {
      const requirement = requirements[index];
      if (!requirement) return "";

      const periodId =
        requirement.preferredPeriodId || teachingPeriods[0]?.periodId;
      const period = periods.find((p) => p.periodId === periodId);

      if (period) {
        const busy = findBusyEntry(requirement.teacherId, dayCode, period);
        if (busy) {
          const busySubject = busy.subject?.subjectName || "another class";
          return `${teacherNameOf(requirement.teacherId)} is already teaching ${busySubject} on ${
            DAY_SHORT_BY_CODE[dayCode] || dayCode
          } ${periodId}`;
        }
      }

      if (requirement.preferredPeriodId) {
        const other = requirements.find(
          (item, i) =>
            i !== index &&
            item.preferredPeriodId === requirement.preferredPeriodId &&
            (item.days || []).includes(dayCode)
        );
        if (other) {
          return `${periodId} on ${
            DAY_SHORT_BY_CODE[dayCode] || dayCode
          } is already selected for ${
            other.subjectName || subjectNameOf(other.subjectId)
          }`;
        }
      }

      return "";
    },
    [requirements, teachingPeriods, periods, findBusyEntry, teacherNameOf, subjectNameOf]
  );

  const requirementConflictText = useCallback(
    (index) => workingDays.map((day) => dayConflict(index, day)).find(Boolean) || "",
    [workingDays, dayConflict]
  );

  const startEditTimetable = useCallback(() => {
    setMode("create");
    setStep(3);
    setExportMenu(null);
  }, []);

  const handleSlotClick = useCallback(
    (key) => {
      const { dayCode, periodId } = parseCellKey(key);
      const slot = slots[key];
      setEditingKey(key);
      setEditConflict("");
      setEditForm({
        subjectId: slot?.subjectId || subjectOptions[0]?._id || "",
        teacherId: slot?.teacherId || availableTeachers[0]?._id || "",
        roomNo: slot?.roomNo || "",
      });
      setDrawerOpen(true);
      setEditingLabel(`${DAY_SHORT_BY_CODE[dayCode] || dayCode} • ${periodId}`);
    },
    [slots, subjectOptions, availableTeachers]
  );

  const closeEditor = useCallback(() => {
    setDrawerOpen(false);
    setEditingKey(null);
    setEditConflict("");
  }, []);

  const saveEditor = useCallback(() => {
    if (!editingKey) return;
    if (!editForm.subjectId || !editForm.teacherId) {
      setEditConflict("Select a subject and a teacher.");
      return;
    }

    const { dayCode, periodId } = parseCellKey(editingKey);
    const period = periods.find((p) => p.periodId === periodId);
    const busy = findBusyEntry(editForm.teacherId, dayCode, period);

    if (busy) {
      const busySubject = busy.subject?.subjectName || "another class";
      setEditConflict(
        `Teacher conflict: ${teacherNameOf(editForm.teacherId)} is already teaching ${busySubject} at ${
          DAY_SHORT_BY_CODE[dayCode] || dayCode
        } ${periodId}.`
      );
      return;
    }

    setSlots((prev) => ({
      ...prev,
      [editingKey]: {
        ...(prev[editingKey] || {}),
        subjectId: editForm.subjectId,
        teacherId: editForm.teacherId,
        roomNo: editForm.roomNo.trim(),
        subjectName: subjectNameOf(editForm.subjectId),
        teacherName: teacherNameOf(editForm.teacherId),
      },
    }));

    closeEditor();
    showToast("Timetable period updated.");
  }, [
    editingKey,
    editForm,
    periods,
    findBusyEntry,
    teacherNameOf,
    subjectNameOf,
    closeEditor,
    showToast,
  ]);

  const removeSlot = useCallback(() => {
    if (!editingKey) return;
    setSlots((prev) => {
      const next = { ...prev };
      delete next[editingKey];
      return next;
    });
    closeEditor();
    showToast("Assignment removed.");
  }, [editingKey, closeEditor, showToast]);

  const handleDrop = useCallback(
    (targetKey) => {
      if (!dragSource || dragSource === targetKey) return;
      setDragInfo({ from: dragSource, to: targetKey });
      setShowDragModal(true);
    },
    [dragSource]
  );

  const closeDragModal = useCallback(() => {
    setShowDragModal(false);
    setDragInfo(null);
    setDragSource(null);
  }, []);

  const validateLocalMove = useCallback(
    (targetKey, item) => {
      if (!item) return "Nothing to move.";
      const { dayCode, periodId } = parseCellKey(targetKey);
      const period = periods.find((p) => p.periodId === periodId);
      if (!period) return "Target period is not part of the configured schedule.";
      const busy = findBusyEntry(item.teacherId, dayCode, period);
      if (busy) {
        const busySubject = busy.subject?.subjectName || "another class";
        return `${teacherNameOf(item.teacherId)} is already teaching ${busySubject} at ${
          DAY_SHORT_BY_CODE[dayCode] || dayCode
        } ${periodId}.`;
      }
      return "";
    },
    [periods, findBusyEntry, teacherNameOf]
  );

  const persistBeforeMove = useCallback(async () => {
    const target = await ensureHeader();
    if (!target) return null;
    if (!(await saveSchedule(target))) return null;
    if (!(await saveRequirements(target))) return null;
    if (!(await saveSlots(target))) return null;
    return target;
  }, [ensureHeader, saveSchedule, saveRequirements, saveSlots]);

  const moveErrorMessage = useCallback((err, fallback) => {
    const data = err.response?.data;
    return data?.conflicts?.[0]?.message || data?.message || fallback;
  }, []);

  const moveSingle = useCallback(async () => {
    if (!dragInfo) return;
    const sourceItem = slots[dragInfo.from];
    const targetItem = slots[dragInfo.to];
    const error = validateLocalMove(dragInfo.to, sourceItem);

    if (error) {
      showToast(`Conflict: ${error}`);
      closeDragModal();
      return;
    }

    const { dayCode: sourceDay, periodId: sourcePeriod } = parseCellKey(
      dragInfo.from
    );
    const { dayCode: targetDay, periodId: targetPeriod } = parseCellKey(
      dragInfo.to
    );

    setBusy(true);
    try {
      const target = await persistBeforeMove();
      if (!target) return;

      await api.post(`/timetables/headers/${target._id}/move`, {
        from: {
          day: DAY_NAME_BY_CODE[sourceDay] || sourceDay,
          periodId: sourcePeriod,
        },
        to: {
          day: DAY_NAME_BY_CODE[targetDay] || targetDay,
          periodId: targetPeriod,
        },
        swap: true,
      });

      await refreshSlots(target);
      closeDragModal();
      showToast(targetItem ? "Assignments swapped." : "Assignment moved.");
    } catch (err) {
      showToast(moveErrorMessage(err, "Failed to move assignment."));
      closeDragModal();
    } finally {
      setBusy(false);
    }
  }, [
    dragInfo,
    slots,
    validateLocalMove,
    persistBeforeMove,
    refreshSlots,
    moveErrorMessage,
    showToast,
    closeDragModal,
  ]);

  const moveWeek = useCallback(async () => {
    if (!dragInfo) return;
    const sourceItem = slots[dragInfo.from];
    if (!sourceItem) return;

    const { dayCode: sourceDay, periodId: sourcePeriod } = parseCellKey(
      dragInfo.from
    );
    const { periodId: targetPeriod } = parseCellKey(dragInfo.to);
    const requirement = requirements.find(
      (item) => String(item.subjectId) === String(sourceItem.subjectId)
    );
    const days = requirement?.days?.length ? requirement.days : [sourceDay];

    const planned = [];
    for (const dayCode of days) {
      const fromKey = cellKey(dayCode, sourcePeriod);
      const toKey = cellKey(dayCode, targetPeriod);
      const item = slots[fromKey];
      if (!item || String(item.subjectId) !== String(sourceItem.subjectId)) {
        continue;
      }
      const error = validateLocalMove(toKey, item);
      if (error) {
        showToast(`Whole-week move blocked: ${error}`);
        closeDragModal();
        return;
      }
      planned.push([fromKey, toKey]);
    }

    if (planned.length === 0) {
      showToast("No matching assignments to move across the selected weekdays.");
      closeDragModal();
      return;
    }

    setBusy(true);
    try {
      const target = await persistBeforeMove();
      if (!target) return;

      const res = await api.post(
        `/timetables/headers/${target._id}/move-series`,
        {
          from: {
            day: DAY_NAME_BY_CODE[sourceDay] || sourceDay,
            periodId: sourcePeriod,
          },
          to: { periodId: targetPeriod },
          days: days.map((code) => DAY_NAME_BY_CODE[code] || code),
        }
      );

      await refreshSlots(target);
      closeDragModal();

      const moved = res.data?.data?.moved ?? planned.length;
      showToast(
        `Moved ${subjectNameOf(sourceItem.subjectId)} across ${moved} selected day${
          moved === 1 ? "" : "s"
        }.`
      );
    } catch (err) {
      showToast(moveErrorMessage(err, "Failed to move assignments."));
      closeDragModal();
    } finally {
      setBusy(false);
    }
  }, [
    dragInfo,
    slots,
    requirements,
    validateLocalMove,
    persistBeforeMove,
    refreshSlots,
    moveErrorMessage,
    showToast,
    closeDragModal,
    subjectNameOf,
  ]);

  const findAllConflicts = useCallback(() => {
    const found = [];
    Object.entries(slots).forEach(([key, slot]) => {
      const { dayCode, periodId } = parseCellKey(key);
      const period = periods.find((p) => p.periodId === periodId);
      const busy = findBusyEntry(slot.teacherId, dayCode, period);
      if (busy) {
        found.push(
          `${slot.teacherName || "Teacher"} is already assigned to ${
            busy.subject?.subjectName || "another class"
          } at ${DAY_SHORT_BY_CODE[dayCode] || dayCode} ${periodId}.`
        );
      }
    });
    return found;
  }, [slots, periods, findBusyEntry]);

  const saveDraft = useCallback(async () => {
    setBusy(true);
    try {
      const target = await ensureHeader();
      if (!target) return;
      if (!(await saveSchedule(target))) return;
      if (!(await saveRequirements(target))) return;
      if (!(await saveSlots(target))) return;
      if (!(await setStatus(target, "DRAFT"))) return;
      await refreshAllEntries();
      showToast("Draft saved.");
    } finally {
      setBusy(false);
    }
  }, [
    ensureHeader,
    saveSchedule,
    saveRequirements,
    saveSlots,
    setStatus,
    refreshAllEntries,
    showToast,
  ]);

  const publishCurrent = useCallback(async () => {
    setBusy(true);
    try {
      const target = await ensureHeader();
      if (!target) return;
      if (!(await saveSchedule(target))) return;
      if (!(await saveRequirements(target))) return;
      if (!(await saveSlots(target, { skipConflictValidation: true }))) return;

      try {
        // Single validate-then-publish call. The save above intentionally
        // skipped its own external conflict pass, so validation runs once.
        const res = await api.post(
          `/timetables/headers/${target._id}/publish`
        );
        const published = res.data?.data || null;
        if (published) setHeader(published);

        // Keep the in-memory school-wide cache in sync without re-fetching
        // every timetable in the school.
        const targetClassId = idOf(target.class);
        const targetSectionId = idOf(target.section);
        const publishedEntries = entriesPayloadFromSlots(slots).entries.map(
          (entry) => {
            const period = periods.find(
              (item) => String(item.periodId) === String(entry.periodId)
            );
            return {
              ...entry,
              class: targetClassId,
              section: targetSectionId,
              subject: entry.subjectId,
              teacher: entry.teacherId,
              timeFrom: period?.startTime || "",
              timeTo: period?.endTime || "",
              timetableHeader: target._id,
            };
          }
        );

        setAllEntries((prev) => [
          ...(prev || []).filter((entry) => {
            if (
              String(entry.timetableHeader || "") === String(target._id)
            ) {
              return false;
            }
            if (
              targetClassId &&
              targetSectionId &&
              String(idOf(entry.class)) === String(targetClassId) &&
              String(idOf(entry.section)) === String(targetSectionId)
            ) {
              return false;
            }
            return true;
          }),
          ...publishedEntries,
        ]);

        setMode("view");
        setStep(0);
        setShowCopySetup(false);
        setExportMenu(null);
        showToast("Timetable published.");
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to publish timetable."
        );
      }
    } finally {
      setBusy(false);
    }
  }, [
    ensureHeader,
    saveSchedule,
    saveRequirements,
    saveSlots,
    periods,
    slots,
    showToast,
  ]);

  const downloadBlob = (blob, name) => {
    const anchor = document.createElement("a");
    const url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 100);
  };

  const blobErrorMessage = async (blob, fallback) => {
    if (!blob) return fallback;
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      return parsed?.message || fallback;
    } catch (err) {
      return fallback;
    }
  };

  const exportTimetable = useCallback(
    async (type) => {
      const format = type === "excel" ? "xlsx" : type;
      setExportMenu(null);
      setBusy(true);

      try {
        let target = header;

        if (mode === "create") {
          target = await ensureHeader();
          if (!target) return;
          if (!(await saveSchedule(target))) return;
          if (!(await saveRequirements(target))) return;
          if (!(await saveSlots(target))) return;
        }

        if (!target?._id) {
          showToast("Build and save the timetable before exporting.");
          return;
        }

        const res = await api.get(
          `/timetables/headers/${target._id}/export/${format}`,
          { responseType: "blob" }
        );

        const disposition = res.headers?.["content-disposition"] || "";
        const match = /filename="?([^";]+)"?/i.exec(disposition);
        const safeClass = (clsName || "Class").replace(/\s+/g, "_");
        const section = secName || "Section";
        const fileName =
          match?.[1] || `VedaSchool_${safeClass}_${section}_Timetable.${format}`;

        downloadBlob(res.data, fileName);
        showToast(
          `${type === "excel" ? "Excel" : type.toUpperCase()} exported.`
        );
      } catch (err) {
        const message =
          err.response?.data instanceof Blob
            ? await blobErrorMessage(
                err.response.data,
                "Failed to export timetable."
              )
            : err.response?.data?.message || "Failed to export timetable.";
        showToast(message);
      } finally {
        setBusy(false);
      }
    },
    [
      header,
      mode,
      clsName,
      secName,
      ensureHeader,
      saveSchedule,
      saveRequirements,
      saveSlots,
      showToast,
    ]
  );

  const renderTable = useCallback(
    (days, periodList, slotData, editable) => (
      <table className="tt">
        <thead>
          <tr>
            <th>Period</th>
            {days.map((code) => (
              <th key={code}>{DAY_SHORT_BY_CODE[code] || code}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periodList.map((period) => {
            if (period.type === "LUNCH") {
              return (
                <tr className="lunch-row" key={period.periodId || period.name}>
                  <td>
                    <div className="period-title">{periodDisplayName(period)}</div>
                    <div className="period-time">{periodTimeRange(period)}</div>
                  </td>
                  {days.map((code) => (
                    <td key={code}>LUNCH</td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={period.periodId}>
                <td>
                  <div className="period-title">{periodDisplayName(period)}</div>
                  <div className="period-time">{periodTimeRange(period)}</div>
                </td>
                {days.map((code) => {
                  const key = cellKey(code, period.periodId);
                  const slot = slotData[key];

                  if (slot) {
                    return (
                      <td key={code}>
                        <div
                          className={`slot ${dragSource === key ? "dragging" : ""}`}
                          draggable={editable}
                          onDragStart={
                            editable
                              ? (event) => {
                                  setDragSource(key);
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData("text/plain", key);
                                }
                              : undefined
                          }
                          onDragEnd={editable ? () => setDragSource(null) : undefined}
                          onClick={editable ? () => handleSlotClick(key) : undefined}
                          onDragOver={editable ? (event) => event.preventDefault() : undefined}
                          onDrop={
                            editable
                              ? (event) => {
                                  event.preventDefault();
                                  handleDrop(key);
                                }
                              : undefined
                          }
                        >
                          <div className="subject">{slot.subjectName}</div>
                          <div className="teacher">{slot.teacherName}</div>
                          <div className="room">
                            {slot.roomNo || <span className="subtle">No room</span>}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={code}>
                      <div
                        className="slot empty"
                        onClick={editable ? () => handleSlotClick(key) : undefined}
                        onDragOver={editable ? (event) => event.preventDefault() : undefined}
                        onDrop={
                          editable
                            ? (event) => {
                                event.preventDefault();
                                handleDrop(key);
                              }
                            : undefined
                        }
                      >
                        + Assign
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
    [dragSource, handleDrop, handleSlotClick]
  );

  const renderFilters = () => (
    <div className="card">
      <div className="card-head">
        <h2>Select Timetable</h2>
      </div>
      <div className="card-body">
        <div className="grid filters">
          <div>
            <label>Academic Year</label>
            <select
              value={criteriaAcademicYear}
              onChange={(event) => setCriteriaAcademicYear(event.target.value)}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => {
                const value = year._id || year.id;
                return (
                  <option key={value} value={value}>
                    {year.label ||
                      year.name ||
                      `${year.startDate || ""} - ${year.endDate || ""}`}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>Class</label>
            <select
              value={criteriaClass}
              onChange={(event) => setCriteriaClass(event.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Section</label>
            <select
              value={criteriaSection}
              onChange={(event) => setCriteriaSection(event.target.value)}
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStart = () => (
    <div className="card">
      <div className="card-head">
        <h2>Start</h2>
      </div>
      <div className="card-body">
        <div className="choice-grid">
          <div className="choice" onClick={startNewTimetable}>
            <b>Create new</b>
            <span className="subtle">Set schedule and subject days.</span>
          </div>
          <div className="choice" onClick={openCopySetup}>
            <b>Copy from another section</b>
            <span className="subtle">Reuse schedule and subject setup.</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCopySetup = () => (
    <div className="card">
      <div className="card-head">
        <h2>Copy From</h2>
      </div>
      <div className="card-body">
        <div className="copy-grid">
          <div>
            <label>Class</label>
            <select
              value={copyClass}
              onChange={(event) => handleCopyClassChange(event.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Section</label>
            <select
              value={copySection}
              onChange={(event) => setCopySection(event.target.value)}
            >
              <option value="">Select Section</option>
              {copySections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="inline-note info">
          Copies time structure and subject-day setup. Room fields remain blank.
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setShowCopySetup(false)}>
            Back
          </button>
          <button
            className="btn primary right"
            onClick={applyCopySetup}
            disabled={busy}
          >
            Copy Setup
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="card">
      <div className="card-head">
        <h2>Set Schedule</h2>
      </div>
      <div className="card-body">
        <label>Working Days</label>
        <div className="days">
          {DAY_DEFS.map((day) => (
            <button
              key={day.code}
              type="button"
              className={`day ${workingDays.includes(day.code) ? "on" : ""}`}
              onClick={() => toggleWorkingDay(day.code)}
            >
              {day.label}
            </button>
          ))}
        </div>

        <div className="setup-grid" style={{ marginTop: 12 }}>
          <div>
            <label>Start Time</label>
            <input
              id="startTime"
              type="time"
              value={scheduleForm.startTime}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  startTime: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label>Number of Periods</label>
            <input
              id="periodCount"
              type="number"
              min="1"
              max="12"
              placeholder="e.g. 7"
              value={scheduleForm.periodCount}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  periodCount: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label>Default Duration (minutes)</label>
            <input
              id="duration"
              type="number"
              min="20"
              placeholder="e.g. 40"
              value={scheduleForm.defaultDurationMinutes}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  defaultDurationMinutes: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label>Default Room</label>
            <input
              id="defaultRoom"
              placeholder="Enter room or classroom"
              value={scheduleForm.defaultRoom}
              onChange={(event) => {
                const value = event.target.value;
                setScheduleForm((prev) => ({
                  ...prev,
                  defaultRoom: value,
                }));
                setDefaultRoom(value);
              }}
            />
          </div>
        </div>

        <div className="setup-grid" style={{ marginTop: 12 }}>
          <div>
            <label>Lunch After Period</label>
            <select
              id="lunchAfter"
              value={scheduleForm.lunchAfterPeriod}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  lunchAfterPeriod: event.target.value,
                }))
              }
            >
              <option value="">Select period</option>
              {Array.from(
                { length: Math.max(1, Number(scheduleForm.periodCount) || 1) },
                (_, index) => index + 1
              ).map((number) => (
                <option key={number} value={number}>
                  P{number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Lunch Duration (minutes)</label>
            <input
              id="lunchDuration"
              type="number"
              min="10"
              placeholder="e.g. 30"
              value={scheduleForm.lunchDurationMinutes}
              onChange={(event) =>
                setScheduleForm((prev) => ({
                  ...prev,
                  lunchDurationMinutes: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn primary right" onClick={generatePeriods}>
            Generate Schedule
          </button>
        </div>

        <div id="periodPreview">
          {periods.length > 0 && (
            <>
              <table className="table period-editor">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Start</th>
                    <th>Duration (min)</th>
                    <th>End</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, index) => (
                    <tr key={period.periodId || `${period.name}-${index}`}>
                      <td>{periodDisplayName(period)}</td>
                      <td>{hhmmToDisplay(period.startTime)}</td>
                      <td>
                        <input
                          type="number"
                          min="5"
                          value={period.durationMinutes}
                          onChange={(event) =>
                            handleDurationChange(index, event.target.value)
                          }
                        />
                      </td>
                      <td>{hhmmToDisplay(period.endTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="actions" style={{ marginTop: 12 }}>
                <button className="btn" onClick={cancelCreate}>
                  Cancel
                </button>
                <button
                  className="btn primary right"
                  onClick={continueFromSchedule}
                  disabled={busy}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="card">
      <div className="card-head">
        <h2>Subject Days</h2>
      </div>
      <div className="card-body">
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Periods / Week</th>
              <th>Teaching Days</th>
              <th>Period</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement, index) => (
              <tr key={`${requirement.subjectId}-${index}`}>
                <td>
                  {requirement.subjectName ||
                    subjectNameOf(requirement.subjectId)}
                </td>
                <td>
                  <select
                    value={requirement.teacherId}
                    onChange={(event) =>
                      updateRequirement(index, "teacherId", event.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {availableTeachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.personalInfo?.name || teacher.name || "Teacher"}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max={workingDays.length}
                    placeholder="e.g. 3"
                    value={requirement.periodsPerWeek}
                    onChange={(event) =>
                      updateRequirement(index, "periodsPerWeek", event.target.value)
                    }
                  />
                </td>
                <td>
                  <div className="weekdays">
                    {workingDays.map((code) => {
                      const conflict = dayConflict(index, code);
                      return (
                        <button
                          key={code}
                          type="button"
                          className={`weekbox ${
                            requirement.days?.includes(code) ? "on" : ""
                          } ${conflict ? "conflict" : ""}`}
                          title={conflict || DAY_NAME_BY_CODE[code]}
                          onClick={() => toggleRequirementDay(index, code)}
                        >
                          {DAY_DEFS.find((day) => day.code === code)?.label}
                        </button>
                      );
                    })}
                  </div>
                  {requirementConflictText(index) && (
                    <div className="conflict-text">
                      {requirementConflictText(index)}
                    </div>
                  )}
                </td>
                <td>
                  <select
                    value={requirement.preferredPeriodId || ""}
                    onChange={(event) =>
                      updateRequirement(
                        index,
                        "preferredPeriodId",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Any</option>
                    {teachingPeriods.map((period) => (
                      <option key={period.periodId} value={period.periodId}>
                        {periodDisplayName(period)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn sm" onClick={() => handleAssign(index)}>
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requirements.length === 0 && (
          <div className="inline-note info">
            No subjects are available for {clsName || "this class"} yet. Add
            subjects in the Subject Group tab first.
          </div>
        )}

        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setStep(1)}>
            Back
          </button>
          <button
            className="btn primary right"
            onClick={buildTimetable}
            disabled={busy}
          >
            Build Timetable
          </button>
        </div>
      </div>
    </div>
  );

  const exportMenuMarkup = (key) => (
    <div className="export-wrap">
      <button
        className="btn sm"
        onClick={() => setExportMenu(exportMenu === key ? null : key)}
      >
        Export ▾
      </button>
      <div className={`export-menu ${exportMenu === key ? "show" : ""}`}>
        {["excel", "png", "pdf"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setExportMenu(null);
              exportTimetable(type);
            }}
          >
            {type === "excel" ? "Excel" : type.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="card">
      <div className="card-head">
        <h2>Build Timetable</h2>
        <div className="actions">
          {exportMenuMarkup("build")}
          <button
            className="btn sm"
            onClick={() =>
              showToast("Use Copy from another section when creating a new timetable.")
            }
          >
            Copy Setup
          </button>
          <button className="btn sm" onClick={() => setSlots({})}>
            Clear
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="timetable-wrap" id="ttWrap">
          {renderTable(workingDays, periods, slots, true)}
        </div>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setStep(2)}>
            Back
          </button>
          <button className="btn primary right" onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const conflicts = findAllConflicts();
    return (
      <div className="card">
        <div className="card-head">
          <h2>Publish</h2>
        </div>
        <div className="card-body">
          <div className="metrics">
            <div className="metric">
              <span>Scheduled</span>
              <b>{Object.keys(slots).length}</b>
            </div>
            <div className="metric">
              <span>Conflicts</span>
              <b>{conflicts.length}</b>
            </div>
            <div className="metric">
              <span>Days</span>
              <b>{workingDays.length}</b>
            </div>
          </div>
          {conflicts.length > 0 ? (
            <div className="inline-note error">{conflicts[0]}</div>
          ) : (
            <div className="inline-note info">Ready to publish.</div>
          )}
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => setStep(3)}>
              Back
            </button>
            <button className="btn" onClick={saveDraft} disabled={busy}>
              Save Draft
            </button>
            <button
              className="btn green right"
              onClick={publishCurrent}
              disabled={conflicts.length > 0 || busy}
            >
              Publish Timetable
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreate = () => {
    if (showCopySetup) {
      return (
        <>
          <div className="context">
            <div>
              <strong>Copy Timetable Setup</strong>
            </div>
            <span className="status draft">Draft</span>
          </div>
          {renderCopySetup()}
        </>
      );
    }

    if (step === 0) {
      return (
        <>
          <div className="context">
            <div>
              <strong>
                Create Timetable: {clsName} - Section {secName}
              </strong>
            </div>
            <span className="status draft">Draft</span>
          </div>
          {renderStart()}
        </>
      );
    }

    return (
      <>
        <div className="context">
          <div>
            <strong>
              {clsName} - Section {secName}
            </strong>
          </div>
          <span className="status draft">Draft</span>
        </div>
        <Stepper step={step} />
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </>
    );
  };

  const renderView = () => {
    if (!criteriaClass || !criteriaSection) {
      return (
        <div className="card">
          <div className="empty">
            <h3>Select a class and section</h3>
            <p>Choose a class and section to view or create its timetable.</p>
          </div>
        </div>
      );
    }

    if (loadingHeader) {
      return (
        <div className="card">
          <div className="card-body">
            <span className="loader">Loading timetable...</span>
          </div>
        </div>
      );
    }

    if (headerError) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="inline-note error">{headerError}</div>
          </div>
        </div>
      );
    }

    if (!header || periods.length === 0) {
      return (
        <div className="card">
          <div className="empty">
            <h3>No timetable created</h3>
            <p>
              {clsName || "This class"} - Section {secName || "-"} has no
              timetable{yearLabel ? ` for ${yearLabel}` : ""}.
            </p>
            <button className="btn primary" onClick={startCreateChoice}>
              + Add Timetable
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="context">
          <div>
            <strong>
              {clsName} - Section {secName}
            </strong>
            <div className="subtle">Class Teacher: {classTeacherLabel}</div>
          </div>
          <span
            className={`status ${
              header.status === "PUBLISHED" ? "published" : "draft"
            }`}
          >
            {header.status === "PUBLISHED" ? "Published" : "Draft"}
          </span>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Weekly Timetable</h2>
            <div className="actions">
              {exportMenuMarkup("view")}
              <button className="btn sm" onClick={startCreateChoice}>
                Copy
              </button>
              <button className="btn primary sm" onClick={startEditTimetable}>
                Edit Timetable
              </button>
            </div>
          </div>
          <div className="card-body timetable-wrap">
            {renderTable(workingDays, periods, slots, false)}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="ttb">
      {renderFilters()}

      <div id="mainView">{mode === "create" ? renderCreate() : renderView()}</div>

      {/* Slot editor drawer */}
      <div
        className={`overlay ${drawerOpen ? "show" : ""}`}
        onClick={closeEditor}
      />
      <div className={`drawer ${drawerOpen ? "show" : ""}`}>
        <div className="drawer-head">
          <div>
            <b>Edit Timetable Period</b>
            <div className="subtle" id="drawerSub">
              {editingLabel}
            </div>
          </div>
          <button className="close" onClick={closeEditor}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <label>Subject</label>
            <select
              value={editForm.subjectId}
              onChange={(event) => {
                const subjectId = event.target.value;
                setEditForm((prev) => ({ ...prev, subjectId }));
              }}
            >
              {subjectOptions.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.subjectName || subject.name || "Subject"}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Teacher</label>
            <select
              value={editForm.teacherId}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  teacherId: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {availableTeachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo?.name || teacher.name || "Teacher"}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Room</label>
            <input
              value={editForm.roomNo}
              placeholder="Enter room or lab"
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, roomNo: event.target.value }))
              }
            />
          </div>
          {editConflict && (
            <div className="inline-note error">{editConflict}</div>
          )}
        </div>
        <div className="drawer-footer">
          <button className="btn danger" onClick={removeSlot}>
            Remove
          </button>
          <button className="btn right" onClick={closeEditor}>
            Cancel
          </button>
          <button className="btn primary" onClick={saveEditor}>
            Save
          </button>
        </div>
      </div>

      {/* Move timetable item modal */}
      <div
        className={`modal-overlay ${showDragModal ? "show" : ""}`}
        onClick={closeDragModal}
      />
      <div className={`modal ${showDragModal ? "show" : ""}`}>
        <div className="modal-head">Move timetable item</div>
        <div className="modal-body">
          {dragInfo && (
            <div>
              Move <b>{slots[dragInfo.from]?.subjectName}</b> from{" "}
              <b>{dragInfo.from.replace("::", " ").replace("::", " ")}</b> to{" "}
              <b>{dragInfo.to.replace("::", " ").replace("::", " ")}</b>
              {slots[dragInfo.to]
                ? ` and swap with ${slots[dragInfo.to]?.subjectName}`
                : ""}
              ?
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={closeDragModal}>
            Cancel
          </button>
          <button className="btn" onClick={moveSingle}>
            Move this occurrence
          </button>
          <button className="btn primary" onClick={moveWeek}>
            Move across selected weekdays
          </button>
        </div>
      </div>

      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
};

export default TimetableBuilder;