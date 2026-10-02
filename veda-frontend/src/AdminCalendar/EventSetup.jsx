import { useState, useEffect } from "react";
import * as calendarAPI from "../services/calendarAPI";
import api from "../services/apiClient";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

/* Sentinel stored in form.classes to mean "every class in the school". */
const ALL_CLASSES = "All";

const roles = [
  "Admin",
  "Teacher",
  "Student",
  "Parent",
  "Management",
  "Specific Class/Section",
];

const getColor = (type) => {
  switch (type) {
    case "Assignment":
      return "bg-blue-500";

    case "Exam":
      return "bg-red-500";

    case "Meeting":
      return "bg-purple-500";

    case "Holiday":
      return "bg-green-500";

    default:
      return "bg-gray-400";
  }
};

const EventSetup = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Real Class documents for the signed-in school, fetched from /classes. */
  const [classOptions, setClassOptions] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    type: "Assignment",

    // Kept for backend compatibility
    source: "Manual",

    classes: [],

    venue: "",

    createdBy: "Admin",
    status: "Scheduled",

    // Kept for backend compatibility
    reminder: "1 day before",

    visibility: [],

    from: "",
    to: "",

    startTime: "",
    endTime: "",

    description: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchClassOptions();
  }, []);

  /*
   * Load the school's real classes. /classes is already tenant-scoped to the
   * signed-in user's school by the backend, so no school filter is sent here.
   */
  const fetchClassOptions = async () => {
    try {
      setClassesLoading(true);

      const res = await api.get("/classes");

      if (res.data?.success) {
        setClassOptions(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch classes", err);
    } finally {
      setClassesLoading(false);
    }
  };

  /*
   * Checkbox labels for the Class field: the "All" sentinel followed by every
   * real class name. Legacy events may hold stored values that match no current
   * Class document, so they are appended as extra options rather than silently
   * dropped when the event is re-saved.
   */
  const classCheckboxOptions = () => {
    const known = classOptions.map((c) => c.name);
    const knownSet = new Set(known);

    const legacy = (form.classes || []).filter(
      (stored) => stored !== ALL_CLASSES && !knownSet.has(stored)
    );

    return [
      { value: ALL_CLASSES, label: "All" },
      ...known.map((name) => ({ value: name, label: name })),
      ...legacy.map((name) => ({ value: name, label: `${name} (legacy)` })),
    ];
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await calendarAPI.getAllEvents();

      if (res.success) {
        const mapped = res.data.map((e) => ({
          ...e,

          classes: e.classes || [],
          visibility: e.visibility || [],

          from: e.startDate
            ? e.startDate.split("T")[0]
            : "",

          to: e.endDate
            ? e.endDate.split("T")[0]
            : "",

          color: getColor(e.type),
        }));

        setEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Toggle one audience role. Multiple roles may be selected at once.
   */
  const handleAudienceToggle = (role) => {
    setForm((prev) => ({
      ...prev,
      visibility: prev.visibility.includes(role)
        ? prev.visibility.filter((r) => r !== role)
        : [...prev.visibility, role],
    }));
  };

  /*
   * Toggle a single class checkbox. Selecting "All" clears the rest, and
   * clearing any specific class drops the implicit "All".
   */
  const handleClassToggle = (cls) => {
    setForm((prev) => {
      if (cls === ALL_CLASSES) {
        return {
          ...prev,
          classes:
            prev.classes.length === 1 && prev.classes[0] === ALL_CLASSES
              ? []
              : [ALL_CLASSES],
        };
      }

      const withoutAll = prev.classes.filter((c) => c !== ALL_CLASSES);
      const next = withoutAll.includes(cls)
        ? withoutAll.filter((c) => c !== cls)
        : [...withoutAll, cls];

      return { ...prev, classes: next };
    });
  };

  /*
   * Class only narrows the event to particular students, so it is mandatory
   * solely when students are part of the audience. An event for teachers,
   * parents or management is not class-specific and saves without it.
   */
  const classIsRequired = form.visibility.includes("Student");

  /*
   * Validate mandatory fields and name the specific ones that are missing.
   */
  const validateForm = () => {
    const missing = [];

    if (!form.title.trim()) missing.push("Event Title");
    if (!form.from) missing.push("Date");
    if (!form.startTime) missing.push("Start Time");
    if (form.visibility.length === 0) missing.push("For (Audience)");
    if (classIsRequired && form.classes.length === 0) missing.push("Class");

    if (missing.length === 0) return null;

    if (missing.length === 1) {
      return `${missing[0]} is required. Please fill the "${missing[0]}" field.`;
    }

    return `The following fields are required: ${missing.join(", ")}.`;
  };

  /*
   * Save event
   */
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload = {
      ...form,

      startDate: form.from,
      endDate: form.to || form.from,
    };

    try {
      if (form._id) {
        await calendarAPI.updateEvent(form._id, payload);
      } else {
        await calendarAPI.createEvent(payload);
      }

      fetchEvents();

      setModalOpen(false);

      resetForm();
    } catch (err) {
      console.error("Failed to save event", err);

      alert("Error saving event");
    }
  };

  /*
   * Delete event
   */
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event?"
      )
    ) {
      return;
    }

    try {
      await calendarAPI.deleteEvent(id);

      fetchEvents();
    } catch (err) {
      console.error("Failed to delete event", err);

      alert("Error deleting event");
    }
  };

  /*
   * Reset form
   */
  const resetForm = () => {
    setForm({
      title: "",
      type: "Assignment",

      source: "Manual",

      classes: [],

      venue: "",

      createdBy: "Admin",
      status: "Scheduled",

      reminder: "1 day before",

      visibility: [],

      from: "",
      to: "",

      startTime: "",
      endTime: "",

      description: "",
    });
  };

  return (
    <div className="p-0 min-h-screen">

      {/* PAGE HEADER */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Event Setup
        </h2>
      </div>

      {/* TABS */}
      <div className="flex gap-6 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">
          Overview
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create Event
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            No events created
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">

              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">
                    Title
                  </th>

                  <th className="p-2 border">
                    Classes
                  </th>

                  <th className="p-2 border">
                    Date
                  </th>

                  <th className="p-2 border">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {events.map((e) => (
                  <tr
                    key={e._id}
                    className="text-center hover:bg-gray-50"
                  >

                    {/* TITLE */}
                    <td className="p-2 border text-left">
                      {e.title}
                    </td>

                    {/* CLASSES */}
                    <td className="p-2 border">
                      {e.classes?.join(", ") || "-"}
                    </td>

                    {/* DATE */}
                    <td className="p-2 border">
                      {e.from}

                      {e.to && e.to !== e.from
                        ? ` - ${e.to}`
                        : ""}
                    </td>

                    {/* ACTION */}
                    <td className="p-2 border">
                      <div className="flex items-center justify-center gap-2">

                        {/* EDIT */}
                        <button
                          onClick={() => {
                            setForm({
                              ...e,
                              classes:
                                e.classes || [],
                              visibility:
                                e.visibility || [],
                              startTime:
                                e.startTime || "",
                              endTime:
                                e.endTime || "",
                              venue:
                                e.venue || "",
                              description:
                                e.description || "",
                            });

                            setModalOpen(true);
                          }}
                          title="Edit"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() =>
                            handleDelete(e._id)
                          }
                          title="Delete"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <FiTrash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* =====================================================
            ADD / EDIT EVENT MODAL
        ===================================================== */}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">

            <div className="bg-white w-full max-w-[1000px] rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="flex items-center justify-between px-6 py-5 border-b">

                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {form._id
                      ? "Edit Calendar Event"
                      : "Add Calendar Event"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Create a new event for your school calendar
                  </p>
                </div>

                <button
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-800 text-xl"
                >
                  ✕
                </button>

              </div>

              {/* =================================================
                  MODAL BODY
              ================================================= */}

              <div className="px-6 py-6">

                {/* =================================================
                    ROW 1
                    EVENT TITLE + EVENT TYPE
                ================================================= */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

                  {/* EVENT TITLE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="Enter event title"
                      className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={form.title}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* EVENT TYPE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      className="border border-gray-300 px-3 py-2.5 rounded-md w-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={form.type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="Assignment">
                        Assignment
                      </option>

                      <option value="Exam">
                        Exam
                      </option>

                      <option value="Meeting">
                        Meeting
                      </option>

                      <option value="Holiday">
                        Holiday
                      </option>
                    </select>
                  </div>

                </div>

                {/* =================================================
                    ROW 2
                    DATE + START TIME + END TIME
                ================================================= */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

                  {/* DATE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="date"
                      className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={form.from}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          from: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* START TIME */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="time"
                      className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={form.startTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* END TIME */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="time"
                      className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={form.endTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>

                </div>

                {/* =================================================
                    AUDIENCE
                ================================================= */}

                <div className="mb-6">

                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    For (Audience){" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-x-6 gap-y-3">

                    {roles.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                      >

                        <input
                          type="checkbox"
                          value={role}
                          checked={
                            form.visibility.includes(
                              role
                            )
                          }
                          onChange={() =>
                            handleAudienceToggle(
                              role
                            )
                          }
                          className="w-4 h-4"
                        />

                        {role}

                      </label>
                    ))}

                  </div>
                </div>

                {/* =================================================
                    CLASS (MULTI SELECT CHECKBOXES)
                ================================================= */}

                <div className="mb-6">

                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Class{" "}
                    {classIsRequired ? (
                      <span className="text-red-500">
                        *
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">
                        (Optional — only needed when the audience includes
                        Students)
                      </span>
                    )}
                    <span className="text-gray-400 font-normal">
                      (Select one or more)
                    </span>
                  </label>

                  {classesLoading ? (
                    <p className="text-sm text-gray-500">
                      Loading classes...
                    </p>
                  ) : classCheckboxOptions().length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No classes found for this school.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-x-6 gap-y-3">

                      {classCheckboxOptions().map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >

                          <input
                            type="checkbox"
                            checked={
                              form.classes.includes(
                                opt.value
                              )
                            }
                            onChange={() =>
                              handleClassToggle(opt.value)
                            }
                            className="w-4 h-4"
                          />

                          {opt.label}

                        </label>
                      ))}

                    </div>
                  )}

                </div>

                {/* =================================================
                    VENUE
                ================================================= */}

                <div className="mb-6">

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter venue"
                    className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={form.venue}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        venue: e.target.value,
                      })
                    }
                  />

                </div>

                {/* =================================================
                    MULTI-DAY DATE
                ================================================= */}

                <div className="mb-6">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Date{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional — for multi-day events)
                    </span>
                  </label>

                  <input
                    type="date"
                    className="border border-gray-300 px-3 py-2.5 rounded-md w-full md:w-1/2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={form.to}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        to: e.target.value,
                      })
                    }
                  />

                </div>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Add event details, instructions or notes..."
                    className="border border-gray-300 px-3 py-2.5 rounded-md w-full resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">

                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {form._id
                    ? "Update Event"
                    : "Save Event"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventSetup;