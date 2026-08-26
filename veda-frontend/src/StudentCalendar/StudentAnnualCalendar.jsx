import React, { useMemo, useState, useEffect } from "react";
import * as calendarAPI from "../services/calendarAPI";
import Navbar from "../SIS/Navbar";
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
  StudentMonthView,
  StudentWeekView,
  StudentDayView,
  StudentYearView,
} from "./StudentCalendarViews";

import StudentUpcomingEvents from "./StudentUpcomingEvents";

/* ================= MAIN ================= */
export default function StudentAnnualCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const studentClass = user.class || "All"; // Fallback to All if not set

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
      console.error("Failed to fetch student events", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER EVENTS (Read Only for Student's Class) ================= */
  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) => e.class === "All" || e.class === studentClass || studentClass === "All"
    );
  }, [events, studentClass]);

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
        <button className="px-2 py-1 border rounded hover:bg-gray-100" onClick={() => moveDate("prev")}>‹</button>

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

        <button className="px-2 py-1 border rounded hover:bg-gray-100" onClick={() => moveDate("next")}>›</button>

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

  /* ================= EVENT MODAL (READ ONLY) ================= */
  const EventModal = () =>
    selectedEvent && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[600px] rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
            <h2 className="text-xl font-bold text-white">Event Details</h2>
            <button onClick={() => setSelectedEvent(null)} className="hover:bg-indigo-700 rounded-full p-1 transition">✕</button>
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
                  <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-bold uppercase">
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
                <label className="text-xs font-bold text-gray-400 uppercase">Target Audience</label>
                <div className="text-gray-700">{selectedEvent.class || "All Students"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Start Date & Time</label>
                <div className="text-sm text-gray-700">{format(selectedEvent.start, "PPP p")}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">End Date & Time</label>
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
    <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* NAVBAR */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex flex-1 overflow-hidden pt-16">
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <Header />

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="mt-4 border rounded-lg overflow-hidden">
                {view === "month" && (
                  <StudentMonthView
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
                  <StudentWeekView
                    currentDate={currentDate}
                    events={filteredEvents}
                    onEventClick={setSelectedEvent}
                  />
                )}

                {view === "day" && (
                  <StudentDayView
                    currentDate={currentDate}
                    events={filteredEvents}
                    onEventClick={setSelectedEvent}
                  />
                )}

                {view === "year" && (
                  <StudentYearView
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
                         <div className="text-gray-500 italic">No events found for your class.</div>
                      ) : (
                        filteredEvents.map(ev => (
                          <div 
                            key={ev.id} 
                            onClick={() => setSelectedEvent(ev)}
                            className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition"
                          >
                            <div className="w-16 text-center">
                              <div className="text-xs text-gray-500 uppercase">{format(ev.start, "MMM")}</div>
                              <div className="text-xl font-bold">{format(ev.start, "dd")}</div>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{ev.title}</div>
                              <div className="text-sm text-gray-500">{format(ev.start, "p")} - {format(ev.end, "p")}</div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase">
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

        <StudentUpcomingEvents
          events={filteredEvents}
          onEventClick={setSelectedEvent}
        />
      </div>

      <EventModal />
    </div>
  );
}