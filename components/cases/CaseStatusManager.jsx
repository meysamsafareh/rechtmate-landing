import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  CheckCircle2, ChevronDown, Loader2, Lightbulb, Send, History, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  case_preparation: { label: "Case Preparation", explanation: "Your lawyer is currently preparing your case file, gathering the necessary documents and building the legal strategy.", stage: 1, color: "blue" },
  filed_with_court: { label: "Filed with Court", explanation: "Your case has been officially submitted to the court. The court has received all necessary documents to open your file.", stage: 2, color: "indigo" },
  waiting_for_court_response: { label: "Waiting for Court Response", explanation: "Your case has been submitted to the court. We are currently waiting for the court to review the file and provide the next procedural step.", stage: 2, color: "amber" },
  hearing_scheduled: { label: "Hearing Scheduled", explanation: "A court hearing has been scheduled for your case. Your lawyer will represent you and present your case before the judge.", stage: 3, color: "orange" },
  evidence_phase: { label: "Evidence Phase", explanation: "The court is currently in the evidence-gathering phase. Documents and statements are being reviewed by all parties.", stage: 3, color: "orange" },
  awaiting_decision: { label: "Awaiting Decision", explanation: "All arguments and evidence have been presented. We are now waiting for the judge to deliver a final decision in your case.", stage: 4, color: "purple" },
  decision_received: { label: "Decision Received", explanation: "The court has issued a decision in your case. Your lawyer will review the ruling and discuss the next steps with you.", stage: 4, color: "emerald" },
  case_closed: { label: "Case Closed", explanation: "Your case has been fully concluded. All proceedings have been completed.", stage: 5, color: "gray" },
};

const PROGRESS_STAGES = [
  { id: 1, label: "Case Filed" },
  { id: 2, label: "Under Review" },
  { id: 3, label: "Hearing" },
  { id: 4, label: "Decision Pending" },
  { id: 5, label: "Completed" },
];

const suggestStatusFromEvent = (events = []) => {
  const suggestions = [];
  for (const ev of events) {
    const t = (ev.title || "").toLowerCase();
    const et = (ev.event_type || "").toLowerCase();
    if (t.includes("decision") || t.includes("judgment") || t.includes("ruling")) {
      suggestions.push({ status: "decision_received", event: ev.title });
    } else if (t.includes("hearing") || et === "hearing") {
      suggestions.push({ status: "hearing_scheduled", event: ev.title });
    } else if (t.includes("filed") || t.includes("submission") || et === "filing") {
      suggestions.push({ status: "filed_with_court", event: ev.title });
    } else if (t.includes("court") && (t.includes("notification") || t.includes("communication"))) {
      suggestions.push({ status: "waiting_for_court_response", event: ev.title });
    }
  }
  // Deduplicate by status
  const seen = new Set();
  return suggestions.filter(s => { if (seen.has(s.status)) return false; seen.add(s.status); return true; });
};

const STATUS_COLOR_CLASSES = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gray: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function CaseStatusManager({ caseId, caseData, onStatusUpdated }) {
  const [currentStatus, setCurrentStatus] = useState(caseData?.client_status || "");
  const [selectedStatus, setSelectedStatus] = useState(caseData?.client_status || "");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tab, setTab] = useState("update");

  useEffect(() => {
    loadHistory();
    loadSuggestions();
  }, [caseId]);

  const loadHistory = async () => {
    const data = await base44.entities.CaseStatusUpdate.filter({ case_id: caseId }, "-created_date", 20);
    setHistory(data);
  };

  const loadSuggestions = async () => {
    const events = await base44.entities.TimelineEvent.filter({ case_id: caseId }, "-event_date", 20);
    setSuggestions(suggestStatusFromEvent(events));
  };

  const handleSave = async () => {
    if (!selectedStatus || saving) return;
    setSaving(true);
    await base44.functions.invoke("updateClientStatus", { case_id: caseId, client_status: selectedStatus, note });
    setCurrentStatus(selectedStatus);
    setNote("");
    setSaved(true);
    await loadHistory();
    if (onStatusUpdated) onStatusUpdated();
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const currentConfig = STATUS_CONFIG[currentStatus];
  const selectedConfig = STATUS_CONFIG[selectedStatus];
  const hasChanges = selectedStatus !== currentStatus || note.trim();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Client Status</h2>
          <p className="text-sm text-[#6B7280]">Control what status your client sees in their portal</p>
        </div>
        {currentStatus && (
          <Badge className={`text-xs border ${STATUS_COLOR_CLASSES[currentConfig?.color] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {currentConfig?.label}
          </Badge>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#F7F6F2] p-1 rounded-lg w-fit mb-5">
        {[{ id: "update", label: "Update Status" }, { id: "history", label: `History (${history.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? "bg-white text-[#1A1A2E] shadow-sm" : "text-[#6B7280]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "update" && (
        <div className="space-y-4">
          {/* Current status preview */}
          {currentStatus && (
            <div className="bg-white rounded-xl border border-[#E8E4DC] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-[#C8A96E]" />
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Currently visible to client</p>
              </div>
              {/* Mini progress bar */}
              <div className="flex gap-1 mb-3">
                {PROGRESS_STAGES.map(stage => {
                  const filled = stage.id <= (currentConfig?.stage || 0);
                  return (
                    <div key={stage.id} className="flex-1">
                      <div className={`h-1.5 rounded-full ${filled ? "bg-[#C8A96E]" : "bg-[#E8E4DC]"}`} />
                    </div>
                  );
                })}
              </div>
              <p className="text-sm font-semibold text-[#1A1A2E]">{currentConfig?.label}</p>
              <p className="text-xs text-[#6B7280] mt-1">{currentConfig?.explanation}</p>
              {caseData?.client_status_note && (
                <div className="mt-2 pt-2 border-t border-[#E8E4DC]">
                  <p className="text-xs text-[#9CA3AF] italic">"{caseData.client_status_note}"</p>
                </div>
              )}
              {caseData?.client_status_updated_at && (
                <p className="text-xs text-[#C8C4BE] mt-1">Last updated {format(new Date(caseData.client_status_updated_at), "MMM d, yyyy · HH:mm")}</p>
              )}
            </div>
          )}

          {/* AI suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Suggested Status Updates</p>
              </div>
              <div className="space-y-2">
                {suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-[#1A1A2E]">{STATUS_CONFIG[s.status]?.label}</p>
                      <p className="text-xs text-[#9CA3AF]">Based on: "{s.event}"</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedStatus(s.status)}
                      className="text-xs h-7 shrink-0">Apply</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">New Client Status</label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E8E4DC] rounded-xl text-sm hover:border-[#C8A96E] transition-colors">
                <span className={selectedStatus ? "text-[#1A1A2E] font-medium" : "text-[#9CA3AF]"}>
                  {selectedConfig?.label || "Select a status…"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4DC] rounded-xl shadow-lg z-20 overflow-hidden">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => { setSelectedStatus(key); setShowDropdown(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F7F6F2] transition-colors border-b border-[#F7F6F2] last:border-0 ${selectedStatus === key ? "bg-[#F7F6F2]" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1A2E]">{cfg.label}</span>
                        {selectedStatus === key && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{cfg.explanation}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Client explanation preview */}
          {selectedStatus && (
            <div className="bg-[#F7F6F2] rounded-xl p-4 border border-[#E8E4DC]">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Client will see</p>
              <p className="text-sm text-[#1A1A2E] leading-relaxed">{selectedConfig?.explanation}</p>
            </div>
          )}

          {/* Lawyer note */}
          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">
              Update message for client <span className="text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. The court has scheduled the hearing for June 14. We will prepare the necessary submissions before that date."
              className="resize-none h-24"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!selectedStatus || saving || !hasChanges}
            className="w-full bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving & notifying client…</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Status updated — client notified</>
            ) : (
              <><Send className="w-4 h-4" /> Update Status & Notify Client</>
            )}
          </Button>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-8 h-8 text-[#E8E4DC] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF]">No status updates yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F2]">
              {history.map((h, i) => {
                const cfg = STATUS_CONFIG[h.client_status];
                return (
                  <div key={h.id} className="p-4 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-[#C8A96E]" : "bg-[#D1D5DB]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1A1A2E]">{h.client_status_label || cfg?.label}</p>
                        <span className="text-xs text-[#9CA3AF] shrink-0">
                          {h.created_date && format(new Date(h.created_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      {h.note && <p className="text-xs text-[#6B7280] mt-0.5 italic">"{h.note}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}