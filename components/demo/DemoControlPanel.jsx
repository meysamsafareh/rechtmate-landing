import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Trash2, PlayCircle, CheckCircle2, AlertTriangle,
  Inbox, Clock, Bell, FileText, ChevronDown, RefreshCw
} from "lucide-react";

const MESSAGE_TYPES = [
  { value: "random", label: "Random", description: "Pick a random message type" },
  { value: "judgment", label: "Judgment", description: "Court judgment with payment order" },
  { value: "hearing_notice", label: "Hearing Notice", description: "Upcoming hearing convocation" },
  { value: "request_submissions", label: "Request for Submissions", description: "Deadline for written conclusions" },
  { value: "procedural_update", label: "Procedural Update", description: "Schedule change or update" },
  { value: "evidence_request", label: "Evidence Request", description: "Request to submit evidence" },
];

const SOURCES = [
  { value: "any", label: "Any Source" },
  { value: "ebox", label: "eBox" },
  { value: "justonweb", label: "Just-on-Web" },
];

export default function DemoControlPanel() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [selectedType, setSelectedType] = useState("random");
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [demoCount, setDemoCount] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    base44.entities.Case.list().then(setCases);
    loadDemoCount();
  }, []);

  const loadDemoCount = async () => {
    const notifs = await base44.entities.CourtNotification.list();
    setDemoCount(notifs.filter(n => n.subject?.startsWith('[DEMO]')).length);
  };

  const addLog = (entry) => {
    setLog(prev => [{ ...entry, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setLastResult(null);
    try {
      const res = await base44.functions.invoke('generateDemoMessage', {
        message_type: selectedType,
        case_id: selectedCase || null,
      });
      const data = res.data;
      setLastResult({ success: true, ...data });
      addLog({
        type: "success",
        label: `${data.message_type} via ${data.source === 'ebox' ? 'eBox' : 'Just-on-Web'}`,
        detail: selectedCase ? `Linked to case` : "Placed in Unassigned Inbox",
      });
      loadDemoCount();
    } catch (e) {
      setLastResult({ success: false, error: e.message });
      addLog({ type: "error", label: "Generation failed", detail: e.message });
    }
    setGenerating(false);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await base44.functions.invoke('resetDemoData', {});
      const data = res.data;
      addLog({ type: "reset", label: "Demo data cleared", detail: `${data.deleted?.notifications || 0} messages removed` });
      setDemoCount(0);
      setLastResult(null);
    } catch (e) {
      addLog({ type: "error", label: "Reset failed", detail: e.message });
    }
    setResetting(false);
  };

  return (
    <div className="space-y-6">

      {/* Status bar */}
      <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Demo Mode Active</p>
            <p className="text-xs text-amber-600">{demoCount} simulated message{demoCount !== 1 ? 's' : ''} in the system</p>
          </div>
        </div>
        <button onClick={loadDemoCount} className="text-amber-500 hover:text-amber-700">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Generate panel */}
      <div className="bg-white rounded-xl border border-[#E8E4DC] p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-[#C8A96E]" />
          <h3 className="font-semibold text-[#1A1A2E] text-sm">Generate Court Message</h3>
        </div>

        {/* Message type */}
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">Message Type</label>
          <div className="grid grid-cols-2 gap-2">
            {MESSAGE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                  selectedType === t.value
                    ? "border-[#1B3A5C] bg-[#1B3A5C]/5 text-[#1B3A5C] font-semibold"
                    : "border-[#E8E4DC] text-[#6B7280] hover:border-[#C8A96E]"
                }`}
              >
                <div className="font-medium">{t.label}</div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Case linkage */}
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">Link to Case (optional)</label>
          <select
            value={selectedCase}
            onChange={e => setSelectedCase(e.target.value)}
            className="w-full text-sm border border-[#E8E4DC] rounded-lg px-3 py-2 text-[#374151] bg-white focus:outline-none focus:border-[#1B3A5C]"
          >
            <option value="">— Unassigned Inbox (no case) —</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2"
        >
          {generating
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating & Parsing…</>
            : <><PlayCircle className="w-4 h-4" />Simulate Court Message</>
          }
        </Button>

        {lastResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${lastResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {lastResult.success
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            }
            <div>
              {lastResult.success
                ? <><strong>Message generated!</strong> Check the Court Inbox. Smart parsing triggered automatically.</>
                : <><strong>Error:</strong> {lastResult.error}</>
              }
            </div>
          </div>
        )}
      </div>

      {/* What happens */}
      <div className="bg-white rounded-xl border border-[#E8E4DC] p-5">
        <h3 className="font-semibold text-[#1A1A2E] text-sm mb-3">Automated Workflow</h3>
        <div className="space-y-2.5">
          {[
            { icon: Inbox, label: "Message appears in Court Inbox", detail: "Labeled with source (eBox / Just-on-Web)" },
            { icon: FileText, label: "Smart Parsing Engine triggered", detail: "Extracts deadlines, hearings, actions" },
            { icon: Clock, label: "Deadlines added to Calendar", detail: "With correct due dates from legal text" },
            { icon: Bell, label: "Notifications sent", detail: "Dashboard & Notification Center updated" },
          ].map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F0EDE8] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-[#C8A96E]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#1A1A2E]">{label}</p>
                <p className="text-xs text-[#9CA3AF]">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E4DC] p-5">
          <h3 className="font-semibold text-[#1A1A2E] text-sm mb-3">Activity Log</h3>
          <div className="space-y-1.5">
            {log.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-[#9CA3AF] font-mono w-14 shrink-0">{entry.ts}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.type === 'success' ? 'bg-emerald-400' : entry.type === 'reset' ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="font-medium text-[#374151]">{entry.label}</span>
                <span className="text-[#9CA3AF] truncate">– {entry.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="bg-white rounded-xl border border-red-100 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[#1A1A2E] text-sm">Reset Demo Data</h3>
            <p className="text-xs text-[#9CA3AF] mt-1">Removes all simulated messages, deadlines, and timeline events. Real data is untouched.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5 shrink-0"
          >
            {resetting
              ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />
            }
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}