import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AddCourtNotificationModal({ onClose, onCreated, defaultCaseId, defaultCaseTitle }) {
  const [cases, setCases] = useState([]);
  const [form, setForm] = useState({
    subject: "",
    court_name: "",
    sender: "",
    received_date: format(new Date(), "yyyy-MM-dd"),
    case_id: defaultCaseId || "",
    case_title: defaultCaseTitle || "",
    case_reference: "",
    raw_content: "",
    source: "manual",
    source_system: "manual",
    status: defaultCaseId ? "assigned" : "unassigned",
    extracted_deadlines_count: 0,
  });
  const [caseSearch, setCaseSearch] = useState(defaultCaseTitle || "");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    base44.entities.Case.list("-updated_date", 100).then(setCases);
  }, []);

  const filteredCases = caseSearch && !form.case_id
    ? cases.filter(c =>
        c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
        (c.reference_number || "").toLowerCase().includes(caseSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectCase = (c) => {
    setForm(f => ({ ...f, case_id: c.id, case_title: c.title, status: "assigned" }));
    setCaseSearch(c.title);
  };

  const clearCase = () => {
    setForm(f => ({ ...f, case_id: "", case_title: "", status: "unassigned" }));
    setCaseSearch("");
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.received_date) return;
    setProcessing(true);

    const notif = await base44.entities.CourtNotification.create(form);

    if (form.raw_content) {
      try {
        const res = await base44.functions.invoke("processCourtNotification", { notification_id: notif.id });
        setDone(res.data);
      } catch {
        setDone({ deadlines_extracted: 0 });
      }
    } else {
      setDone({ deadlines_extracted: 0 });
    }

    setProcessing(false);
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">Notification Saved</h3>
          <p className="text-sm text-[#6B7280] mb-1">Court notification has been recorded.</p>
          {done.deadlines_extracted > 0 && (
            <p className="text-sm font-medium text-[#C8A96E]">{done.deadlines_extracted} deadline(s) automatically extracted.</p>
          )}
          <Button onClick={() => { onCreated(); onClose(); }} className="mt-6 bg-[#1B3A5C] hover:bg-[#2A5080] text-white w-full">
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#E8E4DC]">
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Add Court Notification</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1A2E]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Subject *</Label>
            <Input value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Convocation — Hearing 15 April 2026" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Court Name</Label>
              <Input value={form.court_name}
                onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))}
                placeholder="e.g. Tribunal de l'Entreprise" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Sender</Label>
              <Input value={form.sender}
                onChange={e => setForm(f => ({ ...f, sender: e.target.value }))}
                placeholder="e.g. Greffe du Tribunal" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Received Date *</Label>
              <Input type="date" value={form.received_date}
                onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Case Reference</Label>
              <Input value={form.case_reference}
                onChange={e => setForm(f => ({ ...f, case_reference: e.target.value }))}
                placeholder="e.g. 2024/AR/1234" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Link to Case (optional)</Label>
            {form.case_id ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 flex-1">{form.case_title}</span>
                {!defaultCaseId && (
                  <button onClick={clearCase} className="text-emerald-500 hover:text-emerald-700">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <Input value={caseSearch}
                  onChange={e => setCaseSearch(e.target.value)}
                  placeholder="Search case by name or reference..." />
                {filteredCases.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-[#E8E4DC] rounded-lg overflow-hidden shadow-md bg-white z-10">
                    {filteredCases.map(c => (
                      <button key={c.id} onClick={() => selectCase(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F7F6F2] text-sm border-b border-[#E8E4DC] last:border-0">
                        <span className="font-medium text-[#1A1A2E]">{c.title}</span>
                        {c.reference_number && <span className="text-xs text-[#9CA3AF] ml-2">{c.reference_number}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Message Content</Label>
            <Textarea value={form.raw_content}
              onChange={e => setForm(f => ({ ...f, raw_content: e.target.value }))}
              placeholder="Paste the full text of the court communication here. The system will automatically extract procedural deadlines using AI..."
              className="h-32 resize-none" />
            <p className="text-xs text-[#9CA3AF] mt-1">Pasting content enables automatic deadline extraction via AI.</p>
          </div>
        </div>

        <div className="p-6 border-t border-[#E8E4DC] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={processing}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.subject || !form.received_date || processing}
            className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white">
            {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Save & Process"}
          </Button>
        </div>
      </div>
    </div>
  );
}