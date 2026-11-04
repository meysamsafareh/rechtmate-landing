import { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Clock, Briefcase, CheckSquare, ChevronRight,
  Calendar, Bell, Inbox, Zap
} from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl p-5 border border-[#E8E4DC]">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
    <p className="text-sm text-[#6B7280] mt-0.5">{label}</p>
    {sub && <p className="text-xs text-[#9CA3AF] mt-1">{sub}</p>}
  </div>
);

const DeadlineRow = ({ deadline }) => {
  const daysLeft = differenceInDays(parseISO(deadline.deadline_date), new Date());
  const urgency = daysLeft < 0 ? "overdue" : daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "ok";
  const colors = { overdue: "text-red-600 bg-red-50", critical: "text-orange-600 bg-orange-50", warning: "text-yellow-600 bg-yellow-50", ok: "text-green-600 bg-green-50" };
  const labels = { overdue: "Overdue", critical: `${daysLeft}d left`, warning: `${daysLeft}d left`, ok: `${daysLeft}d` };

  return (
    <Link to={`${createPageUrl("CaseDetail")}?id=${deadline.case_id}`} className="flex items-center justify-between py-3 px-4 hover:bg-[#F7F6F2] rounded-lg transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full ${urgency === "overdue" ? "bg-red-500" : urgency === "critical" ? "bg-orange-500" : urgency === "warning" ? "bg-yellow-500" : "bg-green-500"}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1A1A2E] truncate">{deadline.title}</p>
          <p className="text-xs text-[#6B7280] truncate">{deadline.case_title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[urgency]}`}>{labels[urgency]}</span>
        <ChevronRight className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
};

export default function Dashboard() {
  const [cases, setCases] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [courtNotifs, setCourtNotifs] = useState([]);
  const [proceduralAlerts, setProceduralAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Case.list("-updated_date", 50),
      base44.entities.Deadline.list("-deadline_date", 100),
      base44.entities.Task.filter({ status: "pending" }, "-due_date", 20),
      base44.entities.Notification.filter({ is_read: false }, "-created_date", 10),
      base44.entities.CourtNotification.list("-received_date", 5),
      base44.entities.CaseProceduralTimeline.filter({ status: "active" }, "expected_date", 10),
    ]).then(([c, d, t, n, cn, pa]) => {
      setCases(c);
      setDeadlines(d.filter(d => d.status !== "completed"));
      setTasks(t);
      setNotifications(n);
      setCourtNotifs(cn);
      setProceduralAlerts(pa.filter(s => {
        if (!s.expected_date) return false;
        const d = differenceInDays(parseISO(s.expected_date), new Date());
        return d <= 3;
      }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const in7 = addDays(today, 7);
  const in30 = addDays(today, 30);

  const deadlines7 = deadlines.filter(d => {
    const date = parseISO(d.deadline_date);
    return !isAfter(date, in7);
  });
  const deadlines30 = deadlines.filter(d => {
    const date = parseISO(d.deadline_date);
    return !isAfter(date, in30);
  });
  const overdue = deadlines.filter(d => isBefore(parseISO(d.deadline_date), today));
  const activeCases = cases.filter(c => c.status === "active");
  const recentCases = cases.slice(0, 5);

  const upcomingDeadlines = deadlines
    .filter(d => {
      const date = parseISO(d.deadline_date);
      return !isBefore(date, today) && !isAfter(date, in7);
    })
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));

  const overdueList = deadlines
    .filter(d => isBefore(parseISO(d.deadline_date), today))
    .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-1">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Cases" value={activeCases.length} icon={Briefcase} color="bg-[#1B3A5C]" />
        <StatCard label="Due This Week" value={deadlines7.length} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard label="Due This Month" value={deadlines30.length} icon={Clock} color="bg-[#C8A96E]" />
        <StatCard label="Pending Tasks" value={tasks.length} icon={CheckSquare} color="bg-emerald-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8E4DC]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
            <h2 className="font-semibold text-[#1A1A2E]">Upcoming Deadlines</h2>
            <Link to={createPageUrl("Deadlines")} className="text-xs text-[#C8A96E] hover:underline font-medium">View all</Link>
          </div>
          <div className="p-2">
            {overdueList.length > 0 && (
              <div className="mb-1">
                <p className="text-xs font-medium text-red-500 px-4 py-1.5">OVERDUE</p>
                {overdueList.slice(0, 3).map(d => <DeadlineRow key={d.id} deadline={d} />)}
              </div>
            )}
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.slice(0, 6).map(d => <DeadlineRow key={d.id} deadline={d} />)
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-[#E8E4DC] mx-auto mb-2" />
                <p className="text-sm text-[#9CA3AF]">No upcoming deadlines this week</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent cases */}
          <div className="bg-white rounded-xl border border-[#E8E4DC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
              <h2 className="font-semibold text-[#1A1A2E]">Recent Cases</h2>
              <Link to={createPageUrl("Cases")} className="text-xs text-[#C8A96E] hover:underline font-medium">All cases</Link>
            </div>
            <div className="p-2">
              {recentCases.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">No cases yet</p>
              ) : (
                recentCases.map(c => (
                  <Link key={c.id} to={`${createPageUrl("CaseDetail")}?id=${c.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F6F2] rounded-lg transition-colors group">
                    <div className="w-8 h-8 bg-[#F7F6F2] rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-[#1B3A5C]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{c.title}</p>
                      <p className="text-xs text-[#9CA3AF] capitalize">{c.case_type?.replace("_", " ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E8E4DC]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
                <h2 className="font-semibold text-[#1A1A2E]">Notifications</h2>
                <Link to={createPageUrl("Notifications")} className="text-xs text-[#C8A96E] hover:underline font-medium">View all</Link>
              </div>
              <div className="p-2">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="px-3 py-2.5 flex items-start gap-3">
                    <Bell className="w-4 h-4 text-[#C8A96E] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#1A1A2E]">{n.message}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{n.case_title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedural Engine Widget */}
          {proceduralAlerts.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E8E4DC]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C8A96E]" />
                  <h2 className="font-semibold text-[#1A1A2E]">Procedural Alerts</h2>
                </div>
                <Link to={createPageUrl("ProceduralEngine")} className="text-xs text-[#C8A96E] hover:underline font-medium">View all</Link>
              </div>
              <div className="p-2">
                {proceduralAlerts.slice(0, 4).map(s => {
                  const daysLeft = differenceInDays(parseISO(s.expected_date), new Date());
                  const overdue = daysLeft < 0;
                  return (
                    <Link key={s.id} to={`${createPageUrl("CaseDetail")}?id=${s.case_id}&tab=procedure`}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-[#F7F6F2] rounded-lg transition-colors group">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${overdue ? "bg-red-500" : "bg-orange-500"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#1A1A2E] truncate">{s.step_name}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{s.case_title}</p>
                      </div>
                      <span className={`text-xs shrink-0 font-medium ${overdue ? "text-red-600" : "text-orange-600"}`}>
                        {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Court Notifications */}
          <div className="bg-white rounded-xl border border-[#E8E4DC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
              <h2 className="font-semibold text-[#1A1A2E]">Court Notifications</h2>
              <Link to={createPageUrl("CourtNotifications")} className="text-xs text-[#C8A96E] hover:underline font-medium">View all</Link>
            </div>
            <div className="p-2">
              {courtNotifs.length === 0 ? (
                <div className="text-center py-6">
                  <Inbox className="w-7 h-7 text-[#E8E4DC] mx-auto mb-2" />
                  <p className="text-xs text-[#9CA3AF]">No court notifications yet</p>
                </div>
              ) : (
                courtNotifs.map(n => (
                  <Link key={n.id} to={createPageUrl("CourtNotifications")}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-[#F7F6F2] rounded-lg transition-colors">
                    <Inbox className="w-4 h-4 text-[#1B3A5C] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#1A1A2E] truncate">{n.subject}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{n.court_name || n.received_date}</p>
                    </div>
                    {n.status === "unassigned" && (
                      <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded shrink-0">Unassigned</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}