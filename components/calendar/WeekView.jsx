import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from "date-fns";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLORS = {
  deadline: "bg-red-100 text-red-700 border-red-300",
  hearing: "bg-orange-100 text-orange-700 border-orange-300",
  procedural_step: "bg-blue-100 text-blue-700 border-blue-300",
  filing: "bg-purple-100 text-purple-700 border-purple-300",
  other: "bg-gray-100 text-gray-600 border-gray-300",
  default: "bg-[#C8A96E]/15 text-[#9B7D45] border-[#C8A96E]/40",
};

function getDateStr(ev) {
  return ev.deadline_date || ev.event_date || "";
}

function matchesDay(ev, day) {
  const dateStr = getDateStr(ev);
  if (!dateStr) return false;
  // Compare as string (yyyy-MM-dd) for reliability
  return format(day, "yyyy-MM-dd") === dateStr.slice(0, 10);
}

export default function WeekView({ currentDate, allEvents }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day) => allEvents.filter(ev => matchesDay(ev, day));

  const weekHasEvents = days.some(d => getEventsForDay(d).length > 0);

  // Deadlines have no _time → show in all-day row
  // TimelineEvents may have a time field in description, but we treat all as all-day for now
  // since there's no time field in the entity schema
  const getAllDayForDay = (day) => getEventsForDay(day);

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden flex flex-col">

      {/* Day column headers */}
      <div className="grid border-b border-[#E8E4DC] shrink-0" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
        <div className="border-r border-[#E8E4DC]" />
        {days.map((day, i) => (
          <div
            key={i}
            className={`py-3 px-1 text-center border-r border-[#E8E4DC] last:border-r-0 ${isToday(day) ? "bg-[#1B3A5C]/5" : ""}`}
          >
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
              {format(day, "EEE")}
            </p>
            <div className={`text-base font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto
              ${isToday(day) ? "bg-[#1B3A5C] text-white" : "text-[#1A1A2E]"}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day / deadline row */}
      <div
        className="grid border-b border-[#E8E4DC] shrink-0"
        style={{ gridTemplateColumns: "4rem repeat(7, 1fr)", minHeight: "2.25rem" }}
      >
        <div className="px-1 py-1 text-xs text-[#9CA3AF] border-r border-[#E8E4DC] flex items-start justify-end pt-1.5 font-medium leading-none">
          all‑day
        </div>
        {days.map((day, i) => {
          const evs = getAllDayForDay(day);
          return (
            <div
              key={i}
              className={`p-1 border-r border-[#E8E4DC] last:border-r-0 space-y-0.5 ${isToday(day) ? "bg-[#1B3A5C]/5" : ""}`}
            >
              {evs.map((ev, j) => (
                <Link
                  key={j}
                  to={ev.case_id ? `${createPageUrl("CaseDetail")}?id=${ev.case_id}` : createPageUrl("Deadlines")}
                  className={`block text-xs px-1.5 py-0.5 rounded border truncate font-medium ${ev._color} hover:opacity-75 transition-opacity`}
                  title={ev.title}
                >
                  {ev.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>

      {/* Scrollable hourly grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
        {!weekHasEvents ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="w-10 h-10 text-[#E8E4DC] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#9CA3AF] font-medium">No events scheduled this week</p>
            <p className="text-sm text-[#C8C4BE] mt-1">Deadlines and hearings will appear here</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
            {/* Hour labels column */}
            <div className="border-r border-[#E8E4DC]">
              {HOURS.map(h => (
                <div key={h} className="h-12 border-b border-[#F3F4F6] last:border-b-0 flex items-start justify-end px-2 pt-1">
                  {h > 0 && (
                    <span className="text-xs text-[#C8C4BE] font-medium tabular-nums">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* One column per day */}
            {days.map((day, di) => {
              const evs = getEventsForDay(day);
              // Place all events at 08:00 since they have no time
              const byHour = {};
              evs.forEach(ev => {
                const hour = 8;
                byHour[hour] = [...(byHour[hour] || []), ev];
              });

              return (
                <div
                  key={di}
                  className={`border-r border-[#E8E4DC] last:border-r-0 ${isToday(day) ? "bg-[#1B3A5C]/[0.02]" : ""}`}
                >
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="h-12 border-b border-[#F3F4F6] last:border-b-0 px-1 pt-0.5"
                    >
                      {(byHour[h] || []).map((ev, j) => (
                        <Link
                          key={j}
                          to={ev.case_id ? `${createPageUrl("CaseDetail")}?id=${ev.case_id}` : createPageUrl("Deadlines")}
                          className={`block text-xs px-1.5 py-0.5 rounded border truncate mb-0.5 font-medium ${ev._color} hover:opacity-75 transition-opacity`}
                          title={`${ev.title}${ev.case_title ? " — " + ev.case_title : ""}`}
                        >
                          {ev.title}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}