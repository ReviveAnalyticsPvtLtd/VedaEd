import React, { useMemo, useState, useEffect } from "react";
import * as calendarAPI from "../services/calendarAPI";
import api from "../services/apiClient";
import { assignmentAPI } from "../services/assignmentAPI";

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
  startOfDay,
  startOfYear,
  endOfYear,
} from "date-fns";

import {
  MonthView,
  WeekView,
  DayView,
  YearView,
} from "../AdminCalendar/CalendarViews";

import UpcomingEvents from "../AdminCalendar/UpcomingEvents";

const EVENT_TYPES = [
  "Holiday",
  "Exam",
  "Timetable",
  "Assignment",
  "Activity",
  "Meeting",
  "Other"
];

const DAY_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/* ================= MAIN ================= */
export default function TeacherAnnualCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedClass, setSelectedClass] = useState("All");
  const [activeTypes, setActiveTypes] = useState(EVENT_TYPES);
  const [events, setEvents] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [assignmentEntries, setAssignmentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherId = user?.refId || user?._id;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [calendarRes, timetableRes, assignmentsRes] = await Promise.all([
        calendarAPI.getAllEvents().catch(() => null),
        teacherId
          ? api
              .get("/timetables", { params: { teacherId } })
              .catch(() => null)
          : Promise.resolve(null),
        assignmentAPI.getAssignments().catch(() => []),
      ]);

      if (calendarRes?.success) {
        const mapped = calendarRes.data.map(e => ({
          ...e,
          id: e._id,
          type: e.type || e.eventType || "Other",
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          class: e.classes && e.classes.length > 0 ? e.classes[0] : "All"
        }));
        setEvents(mapped);
      }

      if (timetableRes?.data?.success) {
        setTimetableEntries(timetableRes.data.data || []);
      }

      setAssignmentEntries(Array.isArray(assignmentsRes) ? assignmentsRes : []);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const allEvents = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);

    const timetableEvents = [];

    (timetableEntries || []).forEach((entry) => {
      const dayName = entry?.day
        ? entry.day.charAt(0).toUpperCase() + entry.day.slice(1).toLowerCase()
        : "";
      const weekday = DAY_INDEX[dayName];
      if (weekday === undefined) return;

      let cursor = yearStart;
      while (cursor.getDay() !== weekday) {
        cursor = addDays(cursor, 1);
      }

      while (cursor <= yearEnd) {
        const dateStr = format(cursor, "yyyy-MM-dd");
        const start = new Date(
          `${dateStr}T${entry.timeFrom || "00:00"}:00`
        );
        if (Number.isNaN(start.getTime())) {
          cursor = addDays(cursor, 7);
          continue;
        }

        const parsedEnd = new Date(
          `${dateStr}T${entry.timeTo || entry.timeFrom || "00:00"}:00`
        );
        const end =
          Number.isNaN(parsedEnd.getTime()) || parsedEnd <= start
            ? new Date(start.getTime() + 45 * 60 * 1000)
            : parsedEnd;

        timetableEvents.push({
          id: `timetable-${entry._id}-${dateStr}`,
          title: entry.subject?.subjectName || "Timetable Class",
          type: "Timetable",
          start,
          end,
          class: "All",
          venue: entry.roomNo || "",
          description: [
            entry.subject?.subjectName
              ? `Subject: ${entry.subject.subjectName}`
              : null,
            entry.teacher?.personalInfo?.name
              ? `Teacher: ${entry.teacher.personalInfo.name}`
              : null,
            entry.class?.name
              ? `Class: ${entry.class.name}${
                  entry.section?.name ? ` - ${entry.section.name}` : ""
                }`
              : null,
            entry.roomNo ? `Room: ${entry.roomNo}` : null,
            `Time: ${entry.timeFrom || "-"} - ${entry.timeTo || "-"}`,
          ]
            .filter(Boolean)
            .join("\n"),
        });

        cursor = addDays(cursor, 7);
      }
    });

    const assignmentEvents = (assignmentEntries || []).flatMap((a) => {
      if (!a?.dueDate) return [];

      const start = new Date(a.dueDate);
      if (Number.isNaN(start.getTime())) return [];

      if (start.getHours() === 0 && start.getMinutes() === 0) {
        start.setHours(9, 0, 0, 0);
      }

      const end = new Date(start.getTime() + 60 * 60 * 1000);

      return [
        {
          id: `assignment-${a._id}`,
          title: a.title || "Assignment",
          type: "Assignment",
          start,
          end,
          class: "All",
          venue: "",
          description: [
            a.assignmentType ? `Type: ${a.assignmentType}` : null,
            a.subject?.subjectName
              ? `Subject: ${a.subject.subjectName}`
              : null,
            a.class?.name
              ? `Class: ${a.class.name}${
                  a.section?.name ? ` - ${a.section.name}` : ""
                }`
              : null,
            a.status ? `Status: ${a.status}` : null,
            a.description || null,
            `Due: ${format(start, "PPP p")}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];
    });

    return [...events, ...timetableEvents, ...assignmentEvents];
  }, [events, timetableEntries, assignmentEntries, currentDate]);

  /* ================= FILTER EVENTS ================= */
  const filteredEvents = useMemo(() => {
    return allEvents.filter(
      (e) =>
        (selectedClass === "All" ||
          e.class === selectedClass ||
          e.class === "All") &&
        activeTypes.includes(e.type)
    );
  }, [allEvents, selectedClass, activeTypes]);

  /* ================= GROUP BY DAY ================= */
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach((e) => {
      const key = format(e.start, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [filteredEvents]);

  /* ================= DATE MOVE ================= */
  const moveDate = (dir) => {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return dir === "next" ? addDays(prev, 1) : subDays(prev, 1);
        case "week":
          return dir === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1);
        case "month":
          return dir === "next" ? addMonths(prev, 1) : subMonths(prev, 1);
        case "year":
          return dir === "next" ? addYears(prev, 1) : subYears(prev, 1);
        default:
          return prev;
      }
    });
  };

  /* ================= HEADER ================= */
  const Header = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <button
          className="px-2 py-1 border rounded hover:bg-gray-100"
          onClick={() => moveDate("prev")}
        >
          ‹
        </button>
        <div>
          <div className="text-xl font-semibold">
            {view === "year"
              ? format(currentDate, "yyyy")
              : format(currentDate, "MMMM yyyy")}
          </div>
          {view === "day" && (
            <div className="text-sm text-gray-500">
              {format(currentDate, "EEEE, dd MMMM yyyy")}
            </div>
          )}
        </div>
        <button
          className="px-2 py-1 border rounded hover:bg-gray-100"
          onClick={() => moveDate("next")}
        >
          ›
        </button>
        <button
          className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </button>
      </div>

      <select
        value={view}
        onChange={(e) => setView(e.target.value)}
        className="border rounded px-3 py-2 text-sm bg-white"
      >
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="week">Week</option>
        <option value="day">Day</option>
        <option value="list">List</option>
      </select>
    </div>
  );

  /* ================= FILTERS ================= */
  const Filters = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</label>
        <select
          className="w-full border rounded px-3 py-2 mt-1 text-sm bg-white"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="All">All Classes</option>
          <option value="7A">Class 7A</option>
          <option value="10A">Class 10A</option>
        </select>
      </div>

      <div className="col-span-3 relative">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Types</label>
        <details className="mt-1 group">
          <summary className="cursor-pointer border rounded px-3 py-2 bg-white text-sm list-none flex justify-between items-center">
            <span>Select Event Types ({activeTypes.length})</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="absolute z-20 mt-2 bg-white border rounded shadow-lg p-3 w-full grid grid-cols-3 gap-2">
            <label className="col-span-3 flex items-center justify-between gap-2 pb-2 mb-1 border-b border-gray-200 text-sm font-medium cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activeTypes.length === EVENT_TYPES.length}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        activeTypes.length > 0 &&
                        activeTypes.length < EVENT_TYPES.length;
                    }
                  }}
                  onChange={() =>
                    setActiveTypes(
                      activeTypes.length === EVENT_TYPES.length
                        ? []
                        : EVENT_TYPES
                    )
                  }
                  className="rounded text-blue-600"
                />
                Select All
              </span>
              <span className="text-xs font-normal text-gray-500">
                {activeTypes.length} selected
              </span>
            </label>
            {EVENT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={activeTypes.includes(t)}
                  onChange={() =>
                    setActiveTypes((p) =>
                      p.includes(t)
                        ? p.filter((x) => x !== t)
                        : [...p, t]
                    )
                  }
                  className="rounded text-blue-600"
                />
                {t}
              </label>
            ))}
          </div>
        </details>
      </div>
    </div>
  );

  /* ================= EVENT MODAL (Read Only) ================= */
  const EventModal = () =>
    selectedEvent && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
        <div className="bg-white w-[500px] rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold">Event Details</h2>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="hover:bg-blue-700 rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                <div className="text-lg font-semibold text-gray-800">{selectedEvent.title}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Type</label>
                <div className="mt-1">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                    {selectedEvent.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Venue / Location</label>
                <div className="text-gray-700">{selectedEvent.venue || "No venue specified"}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Target Class</label>
                <div className="text-gray-700">{selectedEvent.class || "All"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Start Date</label>
                <div className="text-sm text-gray-700">{format(selectedEvent.start, "PPP p")}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">End Date</label>
                <div className="text-sm text-gray-700">{format(selectedEvent.end, "PPP p")}</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                {selectedEvent.description || "No description available for this event."}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

  /* ================= RENDER ================= */
 return (
  <div className="w-full">

    {/* ================= CALENDAR + UPCOMING EVENTS ================= */}
    <div className="flex w-full items-stretch">

      {/* ================= CALENDAR ================= */}
      <div className="flex-1 min-w-0">

        {/* BREADCRUMB / TITLE */}
       

        {/* CALENDAR CARD */}
        <div className="bg-white  shadow-sm border p-6">

          <Header />

          <Filters />

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="mt-4 border rounded-lg overflow-hidden">

              {/* MONTH */}
              {view === "month" && (
                <MonthView
                  currentDate={currentDate}
                  eventsByDay={eventsByDay}
                  onDayClick={(d) => {
                    setCurrentDate(startOfDay(d));
                    setView("day");
                  }}
                  onEventClick={setSelectedEvent}
                />
              )}

              {/* WEEK */}
              {view === "week" && (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={setSelectedEvent}
                />
              )}

              {/* DAY */}
              {view === "day" && (
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onEventClick={setSelectedEvent}
                />
              )}

              {/* YEAR */}
              {view === "year" && (
                <YearView
                  currentDate={currentDate}
                  eventsByDay={eventsByDay}
                  onMonthClick={(m) => {
                    setCurrentDate(m);
                    setView("month");
                  }}
                />
              )}

              {/* LIST */}
              {view === "list" && (
                <div className="p-4">

                  <h3 className="font-bold text-lg mb-4">
                    Event List
                  </h3>

                  <div className="space-y-3">

                    {filteredEvents.length === 0 ? (
                      <div className="text-gray-500 italic">
                        No events found for the selected filters.
                      </div>
                    ) : (
                      filteredEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="
                            flex items-center gap-4
                            p-4
                            border
                            rounded-xl
                            hover:bg-gray-50
                            cursor-pointer
                            transition
                          "
                        >

                          <div className="w-16 text-center">
                            <div className="text-xs text-gray-500 uppercase">
                              {format(ev.start, "MMM")}
                            </div>

                            <div className="text-xl font-bold">
                              {format(ev.start, "dd")}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="font-semibold">
                              {ev.title}
                            </div>

                            <div className="text-sm text-gray-500">
                              {format(ev.start, "p")} -{" "}
                              {format(ev.end, "p")}
                            </div>
                          </div>

                          <span className="
                            px-3 py-1
                            rounded-full
                            bg-blue-100
                            text-blue-700
                            text-xs
                            font-bold
                          ">
                            {ev.type}
                          </span>

                        </div>
                      ))
                    )}

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* ================= UPCOMING EVENTS ================= */}
      <UpcomingEvents
        events={filteredEvents}
        onEventClick={setSelectedEvent}
      />

    </div>

    {/* ================= EVENT MODAL ================= */}
    <EventModal />

  </div>
);
}
