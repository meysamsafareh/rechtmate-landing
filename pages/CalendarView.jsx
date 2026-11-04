import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks, addDays as addD, subDays,
  isSameMonth, isSameDay, parseISO, isToday
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";

const EVENT_COLORS = {
  deadline: "bg-red-100 text-red-700 border-red-200",
  hearing: "bg-orange-100 text-orange-700 border-orange-200",
  procedural_step: "bg-blue-100 text-blue-700 border-blue-200",
  filing: "bg-purple-100 text-purple-700 border-purple-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
  default: "bg-[#C8A96E]/10 text-[#9B7D45] border-[#C8A96E]/30",
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Deadline.list("-deadline_date", 300),
      base44.entities.TimelineEvent.list("-event_date", 300),
    ]).then(([deadlines, events]) => {
      const deadlineItems = deadlines
        .filter(d => d.status !== "completed")
        .map(d => ({
          ...d,
          title: d.title,
          _type: "deadline",
          _color: EVENT_COLORS.deadline,
          _date: d.deadline_date,
        }));

      const eventItems = events
        .filter(e => ["hearing", "procedural_step", "filing", "other"].includes(e.event_type))
        .map(e => ({
          ...e,
          _type: e.event_type,
          _color: EVENT_COLORS[e.event_type] || EVENT_COLORS.default,
          _date: e.event_date,
        }));

      setAllEvents([...deadlineItems, ...eventItems]);
      setLoading(false);
    });
  }, []);

  const getEventsForDay = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return allEvents.filter(ev => {
      const d = ev.deadline_date || ev.event_date || "";
      return d === dayStr;
    });
  };

  // Navigation
  const navigatePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const navigateNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addD(currentDate, 1));
  };

  const getHeaderLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (format(ws, "MMM") === format(we, "MMM")) return `${format(ws, "d")} – ${format(we, "d MMM yyyy")}`;
      return `${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy");
  };

  // Month grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weeks = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
    weeks.push(week);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Calendar</h1>
          <p className="text-sm text-[#6B7280]">Deadlines, hearings and procedural events</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View switcher */}
          <div className="flex bg-[#F7F6F2] rounded-lg p-1 gap-1">
            {["month", "week", "day"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${view === v ? "bg-white shadow-sm text-[#1A1A2E]" : "text-[#6B7280] hover:text-[#1A1A2E]"}`}>
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="p-2 rounded-lg hover:bg-[#F7F6F2] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
            </button>
            <span className="font-semibold text-[#1A1A2E] min-w-[10rem] text-center text-sm">
              {getHeaderLabel()}
            </span>
            <button onClick={navigateNext} className="p-2 rounded-lg hover:bg-[#F7F6F2] transition-colors">
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-sm text-[#C8A96E] hover:underline font-medium">Today</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: "Deadline", cls: EVENT_COLORS.deadline },
          { label: "Hearing", cls: EVENT_COLORS.hearing },
          { label: "Filing", cls: EVENT_COLORS.filing },
          { label: "Procedural Step", cls: EVENT_COLORS.procedural_step },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.cls}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {item.label}
          </div>
        ))}
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E8E4DC]">
            {WEEK_DAYS.map(d => (
              <div key={d} className="p-3 text-xs font-semibold text-[#9CA3AF] text-center uppercase tracking-wide">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-[#E8E4DC] last:border-b-0">
              {week.map((d, di) => {
                const dayEvents = getEventsForDay(d);
                const inMonth = isSameMonth(d, currentDate);
                const today = isToday(d);
                return (
                  <div key={di}
                    className={`min-h-24 p-2 border-r border-[#E8E4DC] last:border-r-0 cursor-pointer hover:bg-[#FAFAF8] transition-colors ${!inMonth ? "bg-[#FAFAF9]" : ""}`}
                    onClick={() => { setCurrentDate(d); setView("day"); }}>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${today ? "bg-[#1B3A5C] text-white" : inMonth ? "text-[#1A1A2E]" : "text-[#D1D5DB]"}`}>
                      {format(d, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <Link
                          key={i}
                          to={ev.case_id ? `${createPageUrl("CaseDetail")}?id=${ev.case_id}` : createPageUrl("Deadlines")}
                          onClick={e => e.stopPropagation()}
                          className={`block text-xs px-1.5 py-0.5 rounded border truncate ${ev._color} hover:opacity-80 transition-opacity`}
                          title={ev.title}
                        >
                          {ev.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-[#9CA3AF] px-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <WeekView currentDate={currentDate} allEvents={allEvents} />
      )}

      {/* Day View */}
      {view === "day" && (
        <DayView currentDate={currentDate} allEvents={allEvents} />
      )}
    </div>
  );
}