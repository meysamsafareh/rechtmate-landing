import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Edit2, Check, X, Building, Users, Calendar, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CASE_TYPES = ["civil","commercial","family","labour","criminal","other"];
const STATUSES = ["active","closed","archived"];

export default function CaseOverview({ caseData, onCaseUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(caseData);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const updated = await base44.entities.Case.update(caseData.id, form);
    onCaseUpdated(updated);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setForm(caseData);
    setEditing(false);
  };

  const InfoBlock = ({ icon: Icon, label, value, field, type = "text" }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</span>
      </div>
      {editing ? (
        <Input type={type} value={form[field] || ""} onChange={e => set(field, e.target.value)} className="border-[#E8E4DC] text-sm h-8" />
      ) : (
        <p className="text-sm text-[#1A1A2E] font-medium">{value || <span className="text-[#9CA3AF] font-normal">Not specified</span>}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-[#E8E4DC] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#1A1A2E]">Case Information</h2>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2 border-[#E8E4DC] text-[#6B7280] hover:text-[#1A1A2E]">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="text-[#6B7280]">
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#1B3A5C] text-white hover:bg-[#2A5080] gap-1">
                <Check className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide block mb-1.5">Title</label>
                <Input value={form.title || ""} onChange={e => set("title", e.target.value)} className="border-[#E8E4DC] text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide block mb-1.5">Reference No.</label>
                <Input value={form.reference_number || ""} onChange={e => set("reference_number", e.target.value)} className="border-[#E8E4DC] text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide block mb-1.5">Case Type</label>
                <Select value={form.case_type} onValueChange={v => set("case_type", v)}>
                  <SelectTrigger className="border-[#E8E4DC] text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CASE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide block mb-1.5">Status</label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="border-[#E8E4DC] text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <InfoBlock icon={Building} label="Court" value={form.court} field="court" />
              <InfoBlock icon={Tag} label="Jurisdiction" value={form.jurisdiction} field="jurisdiction" />
              <InfoBlock icon={Calendar} label="Start Date" value={form.start_date} field="start_date" type="date" />
              <InfoBlock icon={Calendar} label="Key Procedural Date" value={form.key_procedural_date} field="key_procedural_date" type="date" />
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Case Type</p>
                <p className="text-sm text-[#1A1A2E] font-medium capitalize">{caseData.case_type?.replace("_", " ") || "—"}</p>
              </div>
              {caseData.reference_number && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Reference</p>
                  <p className="text-sm text-[#1A1A2E] font-medium">{caseData.reference_number}</p>
                </div>
              )}
              {caseData.court && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Court</p>
                  <p className="text-sm text-[#1A1A2E] font-medium">{caseData.court}</p>
                </div>
              )}
              {caseData.jurisdiction && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Jurisdiction</p>
                  <p className="text-sm text-[#1A1A2E] font-medium">{caseData.jurisdiction}</p>
                </div>
              )}
              {caseData.start_date && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Start Date</p>
                  <p className="text-sm text-[#1A1A2E] font-medium">{format(parseISO(caseData.start_date), "MMMM d, yyyy")}</p>
                </div>
              )}
              {caseData.key_procedural_date && (
                <div>
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Key Procedural Date</p>
                  <p className="text-sm text-[#1A1A2E] font-medium">{format(parseISO(caseData.key_procedural_date), "MMMM d, yyyy")}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Description */}
        <div className="mt-5 pt-5 border-t border-[#E8E4DC]">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Description</p>
          {editing ? (
            <Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} className="border-[#E8E4DC] text-sm" rows={3} />
          ) : (
            <p className="text-sm text-[#6B7280]">{caseData.description || <span className="text-[#9CA3AF]">No description provided</span>}</p>
          )}
        </div>

        {/* Parties */}
        {(caseData.parties_involved || caseData.opposing_counsel || editing) && (
          <div className="mt-5 pt-5 border-t border-[#E8E4DC] grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Parties Involved</p>
              {editing ? (
                <Textarea value={form.parties_involved || ""} onChange={e => set("parties_involved", e.target.value)} className="border-[#E8E4DC] text-sm" rows={2} />
              ) : (
                <p className="text-sm text-[#6B7280]">{caseData.parties_involved || "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Opposing Counsel</p>
              {editing ? (
                <Input value={form.opposing_counsel || ""} onChange={e => set("opposing_counsel", e.target.value)} className="border-[#E8E4DC] text-sm" />
              ) : (
                <p className="text-sm text-[#6B7280]">{caseData.opposing_counsel || "—"}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}