import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { Clock, Check, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const data = await base44.entities.Deadline.list("deadline_date", 200);
    setDeadlines(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (d) => {
    await base44.entities.Deadline.update(d.id, { status: d.status === "completed" ? "pending" : "completed" });
    load();
  };

  const getUrgency = (d) => {
    if (d.status === "completed") return { label: "Completed", cls: "bg-emerald-50 text-emerald-700", sort: 99 };
    const days = differenceInDays(parseISO(d.deadline_date), new Date());
    if (days < 0) return { label: "Overdue", cls: "bg-red-50 text-red-700", sort: 0 };
    if (days === 0) return { label: "Today", cls: "bg-red-50 text-red-700", sort: 1 };
    if (days <= 3) return { label: `${days}d left`, cls: "bg-orange-50 text-orange-700", sort: 2 };
    if (days <= 7) return { label: `${days}d left`, cls: "bg-yellow-50 text-yellow-700", sort: 3 };
    return { label: `${days}d`, cls: "bg-blue-50 text-blue-700", sort: 4 };
  };

  const filtered = deadlines.filter(d => {
    if (filter === "pending") return d.status === "pending";
    if (filter === "completed") return d.status === "completed";
    if (filter === "overdue") {
      const days = differenceInDays(parseISO(d.deadline_date), new Date());
      return d.status !== "completed" && days < 0;
    }
    return true;
  }).sort((a, b) => {
    const ua = getUrgency(a).sort;
    const ub = getUrgency(b).sort;
    if (ua !== ub) return ua - ub;
    return new Date(a.deadline_date) - new Date(b.deadline_date);
  });

  const overdue = deadlines.filter(d => d.status !== "completed" && differenceInDays(parseISO(d.deadline_date), new Date()) < 0);
  const pending = deadlines.filter(d => d.status === "pending");

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">All Deadlines</h1>
        <p className="text-sm text-[#6B7280] mt-1">{pending.length} pending · {overdue.length} overdue</p>
      </div>

      {/* Alert for overdue */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700"><span className="font-semibold">{overdue.length} deadline{overdue.length > 1 ? "s" : ""} overdue.</span> Please review immediately.</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "overdue", "completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-[#1B3A5C] text-white" : "bg-white text-[#6B7280] border border-[#E8E4DC] hover:border-[#1B3A5C]"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E4DC]">
          <CheckCircle2 className="w-12 h-12 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">No deadlines found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const urgency = getUrgency(d);
            return (
              <div key={d.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 group transition-all ${d.status === "completed" ? "border-[#E8E4DC] opacity-70" : "border-[#E8E4DC] hover:border-[#C8A96E]/40 hover:shadow-sm"}`}>
                <button onClick={() => toggleStatus(d)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${d.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-[#D1D5DB] hover:border-[#1B3A5C]"}`}>
                  {d.status === "completed" && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${d.status === "completed" ? "line-through text-[#9CA3AF]" : "text-[#1A1A2E]"}`}>{d.title}</p>
                    <Badge className={`text-xs ${urgency.cls}`}>{urgency.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {d.deadline_date && <span className="text-xs text-[#9CA3AF]">{format(parseISO(d.deadline_date), "MMMM d, yyyy")}</span>}
                    {d.case_title && (
                      <Link to={`${createPageUrl("CaseDetail")}?id=${d.case_id}`} className="text-xs text-[#C8A96E] hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />{d.case_title}
                      </Link>
                    )}
                  </div>
                  {d.description && <p className="text-sm text-[#6B7280] mt-1">{d.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}