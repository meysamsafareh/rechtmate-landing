import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, ChevronRight, ChevronLeft, Check, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STEPS = ["Case Info", "Parties", "Details", "Review"];

const CASE_TYPES = [
  { value: "civil", label: "Civil Litigation" },
  { value: "commercial", label: "Commercial Litigation" },
  { value: "family", label: "Family Law" },
  { value: "labour", label: "Labour Law" },
  { value: "criminal", label: "Criminal Law" },
  { value: "other", label: "Other" },
];

export default function CaseWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    title: "",
    reference_number: "",
    case_type: "",
    court: "",
    jurisdiction: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    key_procedural_date: "",
    parties_involved: "",
    opposing_counsel: "",
    description: "",
    status: "active",
  });

  const set = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 0) return data.title.trim() && data.case_type;
    return true;
  };

  const handleCreate = async () => {
    setSaving(true);
    const caseRecord = await base44.entities.Case.create(data);
    // Create initial timeline event
    await base44.entities.TimelineEvent.create({
      title: "Case created",
      event_type: "case_creation",
      event_date: data.start_date || format(new Date(), "yyyy-MM-dd"),
      description: `Case "${data.title}" was created.`,
      case_id: caseRecord.id,
      case_title: data.title,
    });
    setSaving(false);
    onCreated(caseRecord);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E4DC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1B3A5C] rounded-lg flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">New Case</h2>
              <p className="text-xs text-[#9CA3AF]">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1A2E] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-[#1B3A5C]" : "bg-[#E8E4DC]"}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Case Title <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Smith v. Johnson — Contract Dispute" value={data.title} onChange={e => set("title", e.target.value)} className="border-[#E8E4DC]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Case Type <span className="text-red-500">*</span></Label>
                <Select value={data.case_type} onValueChange={v => set("case_type", v)}>
                  <SelectTrigger className="border-[#E8E4DC]"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Reference Number</Label>
                <Input placeholder="Optional internal reference" value={data.reference_number} onChange={e => set("reference_number", e.target.value)} className="border-[#E8E4DC]" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Parties Involved</Label>
                <Textarea placeholder="Claimant, respondent, third parties..." value={data.parties_involved} onChange={e => set("parties_involved", e.target.value)} className="border-[#E8E4DC]" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Opposing Counsel</Label>
                <Input placeholder="Name / law firm (optional)" value={data.opposing_counsel} onChange={e => set("opposing_counsel", e.target.value)} className="border-[#E8E4DC]" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151]">Court / Tribunal</Label>
                  <Input placeholder="Court name" value={data.court} onChange={e => set("court", e.target.value)} className="border-[#E8E4DC]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151]">Jurisdiction</Label>
                  <Input placeholder="e.g. Brussels" value={data.jurisdiction} onChange={e => set("jurisdiction", e.target.value)} className="border-[#E8E4DC]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151]">Start Date</Label>
                  <Input type="date" value={data.start_date} onChange={e => set("start_date", e.target.value)} className="border-[#E8E4DC]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151]">Key Procedural Date</Label>
                  <Input type="date" value={data.key_procedural_date} onChange={e => set("key_procedural_date", e.target.value)} className="border-[#E8E4DC]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151]">Case Description</Label>
                <Textarea placeholder="Brief description of the case..." value={data.description} onChange={e => set("description", e.target.value)} className="border-[#E8E4DC]" rows={3} />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-[#F7F6F2] rounded-xl p-4 space-y-2.5">
                <ReviewRow label="Title" value={data.title} />
                <ReviewRow label="Type" value={data.case_type?.replace("_", " ")} capitalize />
                {data.reference_number && <ReviewRow label="Reference" value={data.reference_number} />}
                {data.court && <ReviewRow label="Court" value={data.court} />}
                {data.jurisdiction && <ReviewRow label="Jurisdiction" value={data.jurisdiction} />}
                {data.start_date && <ReviewRow label="Start Date" value={format(new Date(data.start_date), "MMMM d, yyyy")} />}
                {data.parties_involved && <ReviewRow label="Parties" value={data.parties_involved} />}
                {data.opposing_counsel && <ReviewRow label="Opp. Counsel" value={data.opposing_counsel} />}
                {data.description && <ReviewRow label="Description" value={data.description} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E4DC]">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(s => s - 1)} className="text-[#6B7280]">
            {step === 0 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" />Back</>}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving} className="bg-[#C8A96E] hover:bg-[#B8955A] text-white gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Create Case
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const ReviewRow = ({ label, value, capitalize }) => (
  <div className="flex gap-3">
    <span className="text-xs text-[#9CA3AF] w-24 shrink-0 pt-0.5">{label}</span>
    <span className={`text-sm text-[#1A1A2E] font-medium ${capitalize ? "capitalize" : ""}`}>{value || "—"}</span>
  </div>
);