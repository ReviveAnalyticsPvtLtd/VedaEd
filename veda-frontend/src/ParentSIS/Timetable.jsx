import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import axios from "axios";
import config from "../config";
import "react-calendar/dist/Calendar.css";
import { FiCalendar, FiClock, FiBookOpen, FiUser } from "react-icons/fi";
import HelpInfo from "../components/HelpInfo";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ParentTimetable() {
  const [view, setView] = useState("Week");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [studentInfo, setStudentInfo] = useState({ name: "Loading...", className: "...", section: "..." });
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentInfo = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");
        if (!user || !user.refId) return;

        const authHeaders = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers: authHeaders });
        
        if (res.data && res.data.success && res.data.parent.children) {
          const kids = res.data.parent.children;
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching parent info:", err);
      }
    };
    fetchParentInfo();
  }, []);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedChildId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authHeaders = { Authorization: `Bearer ${token}` };

        // Set child name from parent profile children
        const childEntry = children.find(c => c._id === selectedChildId);
        if (childEntry) {
          setStudentInfo(prev => ({
            ...prev,
            name: childEntry.name || "Unknown"
          }));
        }

        // Get Timetable (parent RBAC scopes by studentId)
        const timetableRes = await axios.get(`${config.API_BASE_URL}/timetables?studentId=${selectedChildId}`, { headers: authHeaders });
        if (timetableRes.data && timetableRes.data.success) {
          const rawData = timetableRes.data.data;
          if (rawData.length > 0) {
            const first = rawData[0];
            setStudentInfo(prev => ({
              ...prev,
              name: childEntry?.name || "Unknown",
              className: first.class?.name || prev.className,
              section: first.section?.name || prev.section
            }));
          }
          const mapped = {};
          DAYS.forEach(day => mapped[day] = []);
          rawData.forEach(entry => {
            if (mapped[entry.day]) {
              mapped[entry.day].push({
                time: entry.timeFrom,
                subject: entry.subject?.subjectName || "Unknown",
                room: entry.roomNo || "N/A",
                teacher: entry.teacher?.personalInfo?.name || "Unknown"
              });
            }
          });
          setTimetableData(mapped);
        }
      } catch (err) {
        console.error("Error fetching child timetable:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedChildId, children]);

  const TIMES = [...new Set(Object.values(timetableData).flat().map(c => c.time))].sort();
  const displayTimes = TIMES.length > 0 ? TIMES : ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"];

  const jsDayIndex = calendarDate.getDay();
  const selectedDay = DAYS[jsDayIndex === 0 ? 6 : jsDayIndex - 1];
  const currentClass = (timetableData[selectedDay] || [])[0] || null;

  return (
    <div className="p-0 m-0 min-h-screen">
        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">Timetable &gt;</p>
<div className="flex items-center justify-between mb-4">
  <h2 className="text-2xl font-bold">Timetable</h2>

 <HelpInfo
  title="Child's Timetable"
  description={`4.3 Child's Timetable (Weekly Schedule)

View your child's complete weekly timetable with subjects, teachers, class timings, and room details.

Sections:
- Weekly Timetable Grid: Displays day-wise and period-wise schedule
- Subject Cards: Each class period shows subject, teacher, and room information
- Calendar Widget: Navigate through different dates and weeks
- Current Class Detail: Shows details of the currently selected time slot
- Holiday Indicators: Highlight weekends or school-declared holidays
- Time Slots: Clear breakdown of hourly class periods
`}
  steps={[
    "Browse your child's weekly timetable by day and time",
    "Click on any class period to view teacher and room information",
    "Use the calendar to navigate to different dates or weeks",
    "Check the current class details for quick insights",
    "Identify holidays and non-class days easily"
  ]}
/>

</div>

      {/* Gray Wrapper */}
       <div className="p-0 grid grid-cols-4 gap-3">
        {/* Left: Timetable */}
       <div className="col-span-3 border rounded-lg p-4 bg-white shadow flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {studentInfo.name} (Class {studentInfo.className} - {studentInfo.section})
            </h2>
            <div className="flex gap-2">
              {children.length > 1 && (
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="border px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium"
                >
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse border h-full">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Time</th>
                  {view === "Day" ? (
                    <th className="border px-2 py-1">{selectedDay}</th>
                  ) : (
                    DAYS.map((day) => (
                      <th key={day} className="border px-2 py-1">
                        {day}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {displayTimes.map((time) => (
                  <tr key={time} className="h-[80px]">
                    <td className="border px-2 py-1 flex items-center gap-1">
                      <FiClock /> {time}
                    </td>
                    {view === "Day" ? (
                      <td className="border px-2 py-1 text-center">
                        {selectedDay === "Sunday" ? (
                          <div className="bg-red-200 text-red-800 font-medium rounded p-1">
                            Holiday
                          </div>
                        ) : (timetableData[selectedDay] || []).find((c) => c.time === time) ? (
                          <div className="bg-blue-100 rounded p-1">
                            <div className="font-medium flex items-center gap-1">
                              <FiBookOpen />{" "}
                              {
                                (timetableData[selectedDay] || []).find(
                                  (c) => c.time === time
                                ).subject
                              }
                            </div>
                            <div className="text-xs">
                              Room{" "}
                              {
                                (timetableData[selectedDay] || []).find(
                                  (c) => c.time === time
                                ).room
                              }
                            </div>
                            <div className="text-xs flex items-center gap-1 text-gray-600">
                              <FiUser />{" "}
                              {
                                (timetableData[selectedDay] || []).find(
                                  (c) => c.time === time
                                ).teacher
                              }
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    ) : (
                      DAYS.map((day) => {
                        const classData = (timetableData[day] || []).find(
                          (c) => c.time === time
                        );
                        return (
                          <td
                            key={day}
                            className="border px-2 py-1 text-center"
                          >
                            {day === "Sunday" ? (
                              <div className="bg-red-200 text-red-800 font-medium rounded p-1">
                                Holiday
                              </div>
                            ) : classData ? (
                              <div className="bg-blue-100 rounded p-1">
                                <div className="font-medium flex items-center gap-1">
                                  <FiBookOpen /> {classData.subject}
                                </div>
                                <div className="text-xs">
                                  Room {classData.room}
                                </div>
                                <div className="text-xs flex items-center gap-1 text-gray-600">
                                  <FiUser /> {classData.teacher}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Calendar + Current Class Detail */}
        <div className="flex flex-col gap-3">
          <div className="border rounded-lg p-3 bg-gray-50 shadow">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">
              <FiCalendar /> Calendar
            </h3>
            <Calendar
              value={calendarDate}
              onChange={(date) => {
                setCalendarDate(date);
                setView("Day");
              }}
              className="rounded-lg w-full"
            />
          </div>

          <div className="border rounded-lg p-3 bg-gray-50 shadow flex-1">
            <h3 className="text-lg font-semibold mb-2">Current Class Detail</h3>
            {selectedDay === "Sunday" ? (
              <p className="text-red-600">Holiday</p>
            ) : currentClass ? (
              <>
                <p className="">Subject: {currentClass.subject}</p>
                <p className="">Room: {currentClass.room}</p>
                <p className="">Teacher: {currentClass.teacher}</p>
              </>
            ) : (
              <p className="text-gray-500">No class scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
