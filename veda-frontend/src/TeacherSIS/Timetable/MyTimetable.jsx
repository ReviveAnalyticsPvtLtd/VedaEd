import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FiBookOpen, FiClock, FiUser } from "react-icons/fi";
import api from "../../services/apiClient";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MyTimetable() {
  const [view, setView] = useState("Week");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const teacherId = user?.refId || user?._id;
        if (!teacherId) return;

        const res = await api.get("/timetables", { params: { teacherId } });
        if (res.data?.success) {
          const mapped = {};
          DAYS.forEach((d) => (mapped[d] = []));
          res.data.data.forEach((entry) => {
            if (mapped[entry.day]) {
              mapped[entry.day].push({
                time: entry.timeFrom,
                displayTime: `${entry.timeFrom} - ${entry.timeTo}`,
                subject: entry.subject?.subjectName || "Unknown",
                room: entry.roomNo || "N/A",
                teacher: entry.teacher?.personalInfo?.name || "Unknown",
              });
            }
          });
          setTimetableData(mapped);
        }
      } catch (err) {
        console.error("Error fetching timetable:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const TIMES = [...new Set(Object.values(timetableData).flat().map((c) => c.time))].sort();

  const jsDayIndex = calendarDate.getDay();
  const selectedDay = DAYS[jsDayIndex === 0 ? 6 : jsDayIndex - 1];
  const currentClass = (timetableData[selectedDay] || [])[0] || null;

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading Timetable...</div>;
  }

  return (
    <div className="p-0 grid grid-cols-4 gap-3">
      {/* Left: Timetable */}
      <div className="col-span-3 border rounded-lg p-4 bg-white shadow flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {view === "Day" ? `Timetable (${selectedDay})` : "Weekly Timetable"}
          </h2>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
          </select>
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
                    <th key={day} className="border px-2 py-1">{day}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {TIMES.length > 0 ? TIMES.map((time) => (
                <tr key={time} className="h-[80px]">
                  <td className="border px-2 py-1 flex items-center gap-1">
                    <FiClock /> {time}
                  </td>
                  {view === "Day" ? (
                    <td className="border px-2 py-1 text-center">
                      {selectedDay === "Sunday" ? (
                        <div className="bg-red-200 text-red-800 font-medium rounded p-1">Holiday</div>
                      ) : (timetableData[selectedDay] || []).find((c) => c.time === time) ? (
                        <Cell data={(timetableData[selectedDay] || []).find((c) => c.time === time)} />
                      ) : (
                        "-"
                      )}
                    </td>
                  ) : (
                    DAYS.map((day) => {
                      const classData = (timetableData[day] || []).find((c) => c.time === time);
                      return (
                        <td key={day} className="border px-2 py-1 text-center">
                          {day === "Sunday" ? (
                            <div className="bg-red-200 text-red-800 font-medium rounded p-1">Holiday</div>
                          ) : classData ? (
                            <Cell data={classData} />
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={view === "Day" ? 2 : 8} className="border px-2 py-4 text-center text-gray-400">
                    No timetable entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Calendar + Current Class Detail */}
      <div className="flex flex-col gap-3">
        <div className="border rounded-lg p-3 bg-gray-50 shadow w-full overflow-visible">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">Calendar</h3>
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
            <p className="text-sm text-red-600">Holiday</p>
          ) : currentClass ? (
            <>
              <p>Subject: {currentClass.subject}</p>
              <p>Room: {currentClass.room}</p>
              <p>Teacher: {currentClass.teacher}</p>
            </>
          ) : (
            <p className="text-gray-500">No class scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}

const Cell = ({ data }) => (
  <div className="bg-blue-100 rounded p-1">
    <div className="font-medium flex items-center gap-1">
      <FiBookOpen /> {data.subject}
    </div>
    <div className="text-xs">Room {data.room}</div>
    <div className="text-xs flex items-center gap-1 text-gray-600">
      <FiUser /> {data.teacher}
    </div>
  </div>
);
