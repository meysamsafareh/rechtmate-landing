import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Zap, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InitializeProcedure({ caseId, caseType, onInitialized }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    base44.entities.ProceduralTemplate.list().then(data => {
      setTemplates(data);
      // Auto-select matching type
      const match = data.find(t => t.case_type === caseType);
      if (match) setSelectedTemplate(match);
    });
  }, [caseType]);

  const handleInit = async () => {
    if (!selectedTemplate || !startDate) return;
    setLoading(true);
    try {
      await base44.functions.invoke("initializeCaseProcedure", {
        case_id: caseId,
        template_id: selectedTemplate.id,
        start_date: startDate,
      });
      onInitialized();
    } catch {}
    setLoading(false);
  };

  const parsedSteps = selectedTemplate ? (() => {
    try { return JSON.parse(selectedTemplate.steps_json); } catch { return []; }
  })() : [];

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DC] p-8 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 bg-[#1B3A5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Zap className="w-7 h-7 text-[#1B3A5C]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">Initialize Procedural Timeline</h3>
      <p className="text-sm text-[#6B7280] mb-6">Select a procedural template to automatically generate the case timeline and deadlines.</p>

      <div className="text-left space-y-4">
        <div>
          <Label className="text-sm font-medium text-[#374151] block mb-1.5">Procedural Template</Label>
          <div className="relative">
            <button onClick={() => setShowDropdown(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E8E4DC] rounded-xl text-sm hover:border-[#C8A96E] transition-colors">
              <span className={selectedTemplate ? "text-[#1A1A2E] font-medium" : "text-[#9CA3AF]"}>
                {selectedTemplate?.template_name || "Select a template…"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4DC] rounded-xl shadow-lg z-20 overflow-hidden">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setSelectedTemplate(t); setShowDropdown(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F7F6F2] transition-colors border-b border-[#F7F6F2] last:border-0 ${selectedTemplate?.id === t.id ? "bg-[#F7F6F2]" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E]">{t.template_name}</p>
                        <p className="text-xs text-[#9CA3AF] capitalize">{t.case_type} · {t.jurisdiction || "General"}</p>
                      </div>
                      {selectedTemplate?.id === t.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-[#374151] block mb-1.5">Procedure Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        {selectedTemplate && parsedSteps.length > 0 && (
          <div className="bg-[#F7F6F2] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">
              {parsedSteps.length} procedural steps will be generated
            </p>
            <div className="space-y-1.5">
              {parsedSteps.sort((a, b) => a.order - b.order).map((step, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] text-xs flex items-center justify-center font-bold shrink-0">{step.order}</div>
                  <span className="text-[#1A1A2E]">{step.name}</span>
                  {step.duration_days > 0 && <span className="text-[#9CA3AF] text-xs ml-auto">+{step.duration_days}d</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-3">Deadlines will be automatically created in your Deadlines section.</p>
          </div>
        )}

        <Button onClick={handleInit} disabled={!selectedTemplate || !startDate || loading}
          className="w-full bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating timeline…</> : <><Zap className="w-4 h-4" /> Initialize Procedural Timeline</>}
        </Button>
      </div>
    </div>
  );
}