import React, { useMemo, useState, useEffect } from "react";
import * as calendarAPI from "../services/calendarAPI";
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
} from "date-fns";

import {
  MonthView,
  WeekView,
  DayView,
  YearView,
} from "./CalendarViews";

import UpcomingEvents from "./UpcomingEvents";

const EVENT_TYPES = [
  "Holiday",
  "Exam",
  "Timetable",
  "Assignment",
  "Activity",
  "Meeting",
  "Other"
];

/* ================= MAIN ================= */
export default function AnnualCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedClass, setSelectedClass] = useState("All");
  const [activeTypes, setActiveTypes] = useState(EVENT_TYPES);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await calendarAPI.getAllEvents();
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
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER EVENTS ================= */
  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) =>
        (selectedClass === "All" ||
          e.class === selectedClass ||
          e.class === "All") &&
        activeTypes.includes(e.type)
    );
  }, [events, selectedClass, activeTypes]);

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

  const handleSave = async () => {
    try {
      const payload = {
        ...selectedEvent,
        startDate: selectedEvent.start,
        endDate: selectedEvent.end,
        classes: [selectedEvent.class],
      };
      
      await calendarAPI.updateEvent(selectedEvent.id, payload);
      setEditMode(false);
      fetchEvents(); // Refresh
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to update event", err);
      alert("Failed to update event");
    }
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
          <div className="text-xl font-semibold text-gray-800">
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

  /* ================= EVENT MODAL ================= */
  const EventModal = () =>
    selectedEvent && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
        <div className="bg-white w-[550px] rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold">{editMode ? "Edit Event" : "Event Details"}</h2>
            <button 
              onClick={() => { setSelectedEvent(null); setEditMode(false); }}
              className="hover:bg-blue-700 rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                <input
                  disabled={!editMode}
                  className={`w-full border rounded px-3 py-2 mt-1 text-sm ${editMode ? 'bg-white' : 'bg-gray-50 text-gray-800 font-semibold'}`}
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Type</label>
                <select
                  disabled={!editMode}
                  className={`w-full border rounded px-3 py-2 mt-1 text-sm ${editMode ? 'bg-white' : 'bg-gray-50'}`}
                  value={selectedEvent.type}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, type: e.target.value })}
                >
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Venue</label>
                <input
                  disabled={!editMode}
                  className={`w-full border rounded px-3 py-2 mt-1 text-sm ${editMode ? 'bg-white' : 'bg-gray-50'}`}
                  value={selectedEvent.venue || ""}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, venue: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Class</label>
                <select
                  disabled={!editMode}
                  className={`w-full border rounded px-3 py-2 mt-1 text-sm ${editMode ? 'bg-white' : 'bg-gray-50'}`}
                  value={selectedEvent.class || "All"}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, class: e.target.value })}
                >
                  <option value="All">All</option>
                  <option value="7A">7A</option>
                  <option value="10A">10A</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t">
              <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
              <textarea
                disabled={!editMode}
                className={`w-full border rounded px-3 py-2 mt-1 text-sm ${editMode ? 'bg-white' : 'bg-gray-50'}`}
                rows={3}
                value={selectedEvent.description || ""}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            {!editMode ? (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );

  /* ================= RENDER ================= */
  return (
    
    <div className="flex h-full bg-gray-50">
      
      <div className="flex-1 p-6 overflow-auto">
        <Header />
        <Filters />

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium">Syncing with server...</p>
          </div>
        ) : (
          <div className="mt-4 bg-white border rounded-xl shadow-sm overflow-hidden">
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

            {view === "week" && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            )}

            {view === "day" && (
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={setSelectedEvent}
              />
            )}

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

            {view === "list" && (
              <div className="p-4">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Event List</h3>
                <div className="space-y-3">
                  {filteredEvents.length === 0 ? (
                     <div className="text-gray-500 italic py-10 text-center">No events found for the selected filters.</div>
                  ) : (
                    filteredEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        onClick={() => setSelectedEvent(ev)}
                        className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="w-16 text-center border-r pr-4">
                          <div className="text-xs text-gray-500 uppercase font-bold">{format(ev.start, "MMM")}</div>
                          <div className="text-xl font-black text-blue-600">{format(ev.start, "dd")}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{ev.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{format(ev.start, "p")} - {format(ev.end, "p")}</div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
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

      <div className="w-80 border-l bg-white hidden xl:block">
        <UpcomingEvents
          events={filteredEvents}
          onEventClick={setSelectedEvent}
        />
      </div>

      <EventModal />
    </div>
  );
}