import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Edit2, Check, X,
  RefreshCw, ChevronDown, ChevronUp, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import InitializeProcedure from "./InitializeProcedure";

const STATUS_STYLES = {
  pending: { badge: "bg-[#F7F6F2] text-[#6B7280] border-[#E8E4DC]", dot: "bg-[#D1D5DB]" },
  active: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  completed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  delayed: { badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

export default function CaseProcedure({ caseId, caseType, caseTitle }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CaseProceduralTimeline.filter({ case_id: caseId }, "step_order", 50);
    setSteps(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const markComplete = async (step) => {
    const today = new Date().toISOString().split("T")[0];
    await base44.entities.CaseProceduralTimeline.update(step.id, {
      status: "completed",
      completed_date: today,
    });
    // Activate next step
    const next = steps.find(s => s.step_order === step.step_order + 1);
    if (next && next.status === "pending") {
      await base44.entities.CaseProceduralTimeline.update(next.id, { status: "active" });
    }
    load();
  };

  const saveEdit = async (step) => {
    const updates = { is_overridden: true };
    if (editDate) updates.expected_date = editDate;
    if (editNote.trim()) updates.lawyer_note = editNote;
    await base44.entities.CaseProceduralTimeline.update(step.id, updates);
    setEditingId(null);
    load();
  };

  const markDelayed = async (step) => {
    await base44.entities.CaseProceduralTimeline.update(step.id, { status: "delayed" });
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  if (steps.length === 0) {
    return <InitializeProcedure caseId={caseId} caseType={caseType} onInitialized={load} />;
  }

  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Procedural Timeline</h2>
          <p className="text-sm text-[#6B7280]">{steps[0]?.template_name} · {completedCount}/{steps.length} steps completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
                <div className="h-full bg-[#C8A96E] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-[#9CA3AF]">{progress}%</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="h-8 w-8 p-0">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E8E4DC]" />
        <div className="space-y-3 pl-10">
          {steps.map(step => {
            const cfg = STATUS_STYLES[step.status] || STATUS_STYLES.pending;
            const isExpanded = expandedId === step.id;
            const isEditing = editingId === step.id;
            const daysLeft = step.expected_date ? differenceInDays(parseISO(step.expected_date), today) : null;
            const isOverdue = step.status === "active" && daysLeft !== null && daysLeft < 0;
            const isCritical = step.status === "active" && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

            return (
              <div key={step.id} className="relative">
                <div className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-white mt-4 shrink-0 ${cfg.dot}`} />
                <div className={`bg-white rounded-xl border transition-colors ${
                  isOverdue ? "border-red-200 bg-red-50/30" : isCritical ? "border-orange-200 bg-orange-50/30" : "border-[#E8E4DC]"
                }`}>
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : step.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#9CA3AF] font-medium">Step {step.step_order}</span>
                        <Badge className={`text-xs capitalize border ${cfg.badge}`}>{step.status}</Badge>
                        {step.is_overridden && <Badge className="text-xs bg-[#C8A96E]/10 text-[#C8A96E] border-[#C8A96E]/20">Modified</Badge>}
                        {isOverdue && <Badge className="text-xs bg-red-50 text-red-600 border-red-200">Overdue</Badge>}
                        {isCritical && <Badge className="text-xs bg-orange-50 text-orange-600 border-orange-200">{daysLeft}d left</Badge>}
                      </div>
                      <p className={`font-semibold mt-0.5 ${step.status === "completed" ? "text-[#6B7280] line-through" : "text-[#1A1A2E]"}`}>
                        {step.step_name}
                      </p>
                      {step.expected_date && (
                        <p className="text-xs text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.status === "completed" && step.completed_date
                            ? `Completed ${format(parseISO(step.completed_date), "MMM d, yyyy")}`
                            : `Expected ${format(parseISO(step.expected_date), "MMM d, yyyy")}`
                          }
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {step.status === "active" && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); markComplete(step); }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-7 gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#E8E4DC] pt-3 space-y-3">
                      {step.step_description && (
                        <p className="text-sm text-[#6B7280]">{step.step_description}</p>
                      )}
                      {step.lawyer_note && (
                        <div className="bg-[#F7F6F2] rounded-lg p-3">
                          <p className="text-xs font-medium text-[#9CA3AF] mb-1">Note</p>
                          <p className="text-sm text-[#1A1A2E]">{step.lawyer_note}</p>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="space-y-2">
                          <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-sm" />
                          <Textarea value={editNote} onChange={e => setEditNote(e.target.value)}
                            placeholder="Add a note about this step…" className="resize-none h-20 text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(step)} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white text-xs h-7">
                              <Check className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-xs h-7">
                              <X className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                            onClick={() => { setEditingId(step.id); setEditDate(step.expected_date || ""); setEditNote(step.lawyer_note || ""); }}>
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                          {step.status === "active" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => markDelayed(step)}>
                              <AlertTriangle className="w-3 h-3" /> Mark Delayed
                            </Button>
                          )}
                          {step.status === "delayed" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => base44.entities.CaseProceduralTimeline.update(step.id, { status: "active" }).then(load)}>
                              Reactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-[#E8E4DC] text-center">
        <p className="text-xs text-[#9CA3AF] mb-2">Need to restart? Re-initializing will replace the current timeline.</p>
        <Button variant="outline" size="sm" className="text-xs gap-1 text-[#9CA3AF]"
          onClick={() => { setSteps([]); }}>
          <RefreshCw className="w-3 h-3" /> Re-initialize Timeline
        </Button>
      </div>
    </div>
  );
}