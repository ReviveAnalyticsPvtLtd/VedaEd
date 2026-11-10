import React, { useMemo, useState, useEffect } from "react";
import * as calendarAPI from "../services/calendarAPI";
import api from "../services/apiClient";

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
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
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

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* ================= MAIN ================= */
export default function TeacherAnnualCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedClass, setSelectedClass] = useState("All");
  const [activeTypes, setActiveTypes] = useState(EVENT_TYPES);
  const [events, setEvents] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchTimetable = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const teacherId = user?.refId || user?._id;
      if (!teacherId) return [];

      const res = await api.get("/timetables", { params: { teacherId } });
      return res.data?.success ? res.data.data || [] : [];
    } catch (err) {
      console.error("Failed to fetch timetable", err);
      return [];
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [res, timetable] = await Promise.all([
        calendarAPI.getAllEvents(),
        fetchTimetable(),
      ]);
      if (res.success) {
        const mapped = res.data.map(e => ({
          ...e,
          id: e._id,
          type: e.type || e.eventType || "Other",
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          class: e.classes && e.classes.length > 0 ? e.classes[0] : "All"
        }));
        setEvents(mapped);
      }
      setTimetableEntries(timetable);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VISIBLE RANGE ================= */
  const visibleRange = useMemo(() => {
    if (view === "year")
      return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    if (view === "week")
      return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
    if (view === "day")
      return { start: startOfDay(currentDate), end: startOfDay(currentDate) };
    return {
      start: startOfWeek(startOfMonth(currentDate)),
      end: endOfWeek(endOfMonth(currentDate)),
    };
  }, [view, currentDate]);

  /* ================= TEACHER TIMETABLE EVENTS ================= */
  const timetableEvents = useMemo(() => {
    if (!activeTypes.includes("Timetable") || timetableEntries.length === 0)
      return [];

    const entriesByDay = {};
    timetableEntries.forEach((entry) => {
      if (!entry.day) return;
      (entriesByDay[entry.day] = entriesByDay[entry.day] || []).push(entry);
    });

    const occurrences = [];

    eachDayOfInterval(visibleRange).forEach((day) => {
      const dayEntries = entriesByDay[WEEKDAY_NAMES[day.getDay()]] || [];

      dayEntries.forEach((entry) => {
        const [sh, sm] = String(entry.timeFrom || "").split(":");
        const [eh, em] = String(entry.timeTo || "").split(":");

        const start = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          Number(sh) || 0,
          Number(sm) || 0
        );

        let end = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          Number(eh) || 0,
          Number(em) || 0
        );

        if (end <= start) end = new Date(start.getTime() + 45 * 60000);

        const classLabel =
          [entry.class?.name, entry.section?.name]
            .filter(Boolean)
            .join("-") || "All";

        occurrences.push({
          id: `timetable-${entry._id}-${format(day, "yyyy-MM-dd")}`,
          title: entry.subject?.subjectName || "Class",
          type: "Timetable",
          start,
          end,
          venue: entry.roomNo || "",
          class: classLabel,
          description: [
            classLabel !== "All" ? `Class: ${classLabel}` : "",
            entry.roomNo ? `Room: ${entry.roomNo}` : "",
          ]
            .filter(Boolean)
            .join(" • "),
        });
      });
    });

    return occurrences;
  }, [timetableEntries, activeTypes, visibleRange]);

  /* ================= FILTER EVENTS ================= */
  const allEvents = useMemo(
    () => [...events, ...timetableEvents],
    [events, timetableEvents]
  );

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
            <span>Select Event Types ({activeTypes.length === EVENT_TYPES.length ? "All" : activeTypes.length})</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="absolute z-20 mt-2 bg-white border rounded shadow-lg p-3 w-full">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer hover:bg-gray-50 p-1 rounded border-b pb-2 mb-2">
              <input
                type="checkbox"
                checked={activeTypes.length === EVENT_TYPES.length}
                onChange={() =>
                  setActiveTypes((p) =>
                    p.length === EVENT_TYPES.length ? [] : [...EVENT_TYPES]
                  )
                }
                className="rounded text-blue-600"
              />
              All
            </label>
            <div className="grid grid-cols-3 gap-2">
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
