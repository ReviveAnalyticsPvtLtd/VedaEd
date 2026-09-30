const CalendarEvent = require("../calendar/calendarModel");
const mongoose = require("mongoose");
const { startOfLocalDay, dateKey } = require("./leaveCalculation");

const expandEventToDateKeys = (startDate, endDate) => {
  const keys = [];
  let cur = startOfLocalDay(startDate);
  const end = startOfLocalDay(endDate);
  const MS_DAY = 86400000;
  while (cur <= end) {
    keys.push(dateKey(cur));
    cur = new Date(cur.getTime() + MS_DAY);
  }
  return keys;
};

const loadHolidayDateKeySet = async (fromDate, toDate, excludeHolidays, schoolId) => {
  if (!excludeHolidays) return new Set();
  if (!schoolId || !mongoose.isValidObjectId(String(schoolId))) return new Set();
  const start = startOfLocalDay(fromDate);
  const end = startOfLocalDay(toDate);
  // Scoped by schoolId: a holiday declared by another school must not shorten
  // this school's leave balance.
  const events = await CalendarEvent.find({
    schoolId,
    eventType: /^holiday$/i,
    startDate: { $lte: end },
    endDate: { $gte: start },
  })
    .select("startDate endDate eventType")
    .lean();

  const set = new Set();
  for (const ev of events) {
    for (const k of expandEventToDateKeys(ev.startDate, ev.endDate)) {
      set.add(k);
    }
  }
  return set;
};

module.exports = { loadHolidayDateKeySet, expandEventToDateKeys };
