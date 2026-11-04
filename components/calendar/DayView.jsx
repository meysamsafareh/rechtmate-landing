import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isSameDay, isToday, parseISO } from "date-fns";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DayView({ currentDate, allEvents }) {
  const getEventsForDay = (day) =>
    allEvents.filter(ev => {
      const dateStr = ev.deadline_date || ev.event_date || "";
      if (!dateStr) return false;
      try { return isSameDay(parseISO(dateStr), day); } catch { return false; }
    });

  const dayEvents = getEventsForDay(currentDate);

  // Place events by hour
  const placed = {};
  dayEvents.forEach(ev => {
    const hour = ev._time ? parseInt(ev._time.split(":")[0]) : 8;
    placed[hour] = [...(placed[hour] || []), ev];
  });

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-[#E8E4DC] flex items-center gap-3 ${isToday(currentDate) ? "bg-[#1B3A5C]/5" : ""}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isToday(currentDate) ? "bg-[#1B3A5C] text-white" : "bg-[#F7F6F2] text-[#1A1A2E]"}`}>
          {format(currentDate, "d")}
        </div>
        <div>
          <p className="font-semibold text-[#1A1A2E]">{format(currentDate, "EEEE")}</p>
          <p className="text-sm text-[#6B7280]">{format(currentDate, "MMMM yyyy")}</p>
        </div>
        <div className="ml-auto text-sm text-[#6B7280]">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#9CA3AF] font-medium">No events scheduled today</p>
            <p className="text-sm text-[#C8C4BE] mt-1">Deadlines and hearings will appear here</p>
          </div>
        ) : (
          <div>
            {HOURS.map(h => (
              <div key={h} className="flex border-b border-[#F3F4F6] last:border-b-0 min-h-[3.5rem]">
                <div className="w-16 shrink-0 px-2 flex items-start justify-end pt-1 border-r border-[#E8E4DC]">
                  <span className="text-xs text-[#C8C4BE] font-medium">
                    {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                  </span>
                </div>
                <div className="flex-1 p-1 space-y-0.5">
                  {(placed[h] || []).map((ev, j) => (
                    <Link
                      key={j}
                      to={ev.case_id ? `${createPageUrl("CaseDetail")}?id=${ev.case_id}` : createPageUrl("Deadlines")}
                      className={`block text-sm px-3 py-1.5 rounded-lg border ${ev._color} hover:opacity-80 transition-opacity`}
                      title={ev.title}
                    >
                      <span className="font-medium">{ev.title}</span>
                      {ev.case_title && <span className="text-xs opacity-70 ml-2">— {ev.case_title}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}