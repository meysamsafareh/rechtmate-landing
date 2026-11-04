import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { X, Loader2, CheckCircle2, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function InboxUploadModal({ onClose, onCreated }) {
  const [cases, setCases] = useState([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // { name, url }
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    subject: "",
    court_name: "",
    sender: "",
    received_date: format(new Date(), "yyyy-MM-dd"),
    case_reference: "",
    case_id: "",
    case_title: "",
    raw_content: "",
    message_body: "",
    source: "manual",
    source_system: "manual",
    status: "unassigned",
  });

  useEffect(() => {
    base44.entities.Case.list("-updated_date", 100).then(setCases);
  }, []);

  const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
  const ALLOWED_EXT = [".pdf", ".docx", ".txt"];

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
      setFileError("Only PDF, DOCX, or TXT files are supported.");
      return;
    }
    setFileError("");
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFile({ name: file.name, url: file_url });
    // Auto-fill subject if empty
    if (!form.subject) {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setForm(f => ({ ...f, subject: nameWithoutExt }));
    }
    setUploadingFile(false);
  };

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

  const handleSubmit = async () => {
    if (!form.subject || !form.received_date) return;
    setSaving(true);

    // Build payload — attach file URL in document_links if uploaded
    const payload = {
      ...form,
      ...(uploadedFile ? { document_links: uploadedFile.url, attachment_links: uploadedFile.name } : {}),
    };

    const notif = await base44.entities.CourtNotification.create(payload);

    if (form.case_id) {
      await base44.entities.TimelineEvent.create({
        case_id: form.case_id,
        case_title: form.case_title,
        title: `Court communication: ${form.subject}`,
        event_type: "other",
        event_date: form.received_date,
        description: `Manually uploaded. Court: ${form.court_name || "—"}. ${uploadedFile ? `File: ${uploadedFile.name}.` : ""} ${form.raw_content?.slice(0, 200) || ""}`,
        ...(uploadedFile ? { attached_file_url: uploadedFile.url, attached_file_name: uploadedFile.name } : {}),
      });
    }

    // Trigger smart parsing if we have text content or a file URL
    if (form.raw_content || uploadedFile) {
      try { await base44.functions.invoke("processCourtNotification", { notification_id: notif.id }); } catch {}
    }

    setSaving(false);
    setDone(true);
  };

  if (done) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">Message Saved</h3>
        <p className="text-sm text-[#6B7280]">The court communication has been added to the inbox.</p>
        {uploadedFile && (
          <p className="text-xs text-[#9CA3AF] mt-1">File: {uploadedFile.name}</p>
        )}
        <span className="inline-block mt-2 text-xs bg-[#F0EDE8] text-[#6B7280] px-2 py-1 rounded-full">Source: Manual Upload</span>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Email notification sent
        </div>
        <Button onClick={() => { onCreated(); onClose(); }} className="mt-5 bg-[#1B3A5C] hover:bg-[#2A5080] text-white w-full">
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#E8E4DC]">
          <h2 className="text-lg font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload Court Communication
          </h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1A2E]"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">

          {/* ── File Upload ── */}
          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Upload File (PDF, DOCX, TXT)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadedFile ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 flex-1 truncate">{uploadedFile.name}</span>
                <button onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <X className="w-4 h-4 text-emerald-500 hover:text-emerald-700" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#D1C9BE] rounded-xl py-6 text-sm text-[#9CA3AF] hover:border-[#C8A96E] hover:text-[#1B3A5C] hover:bg-[#FDFAF6] transition-colors"
              >
                {uploadingFile
                  ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Uploading…</span></>
                  : <><Upload className="w-5 h-5" /><span>Click to select a file</span><span className="text-xs">PDF, DOCX or TXT</span></>
                }
              </button>
            )}
            {fileError && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />{fileError}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Subject *</Label>
            <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Convocation — Hearing 15 April 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Court Name</Label>
              <Input value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))}
                placeholder="Tribunal de l'Entreprise" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Sender</Label>
              <Input value={form.sender} onChange={e => setForm(f => ({ ...f, sender: e.target.value }))}
                placeholder="Greffe du Tribunal" />
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
              <Input value={form.case_reference} onChange={e => setForm(f => ({ ...f, case_reference: e.target.value }))}
                placeholder="2024/AR/1234" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-[#374151] mb-1.5 block">Link to Case (optional)</Label>
            {form.case_id ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 flex-1">{form.case_title}</span>
                <button onClick={() => { setForm(f => ({ ...f, case_id: "", case_title: "", status: "unassigned" })); setCaseSearch(""); }}>
                  <X className="w-4 h-4 text-emerald-500 hover:text-emerald-700" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input value={caseSearch} onChange={e => setCaseSearch(e.target.value)}
                  placeholder="Search case by name or reference..." />
                {filteredCases.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-[#E8E4DC] rounded-lg overflow-hidden shadow-md bg-white z-10">
                    {filteredCases.map(c => (
                      <button key={c.id} onClick={() => selectCase(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F7F6F2] text-sm border-b border-[#E8E4DC] last:border-0">
                        <span className="font-medium">{c.title}</span>
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
            <Textarea value={form.raw_content} onChange={e => setForm(f => ({ ...f, raw_content: e.target.value }))}
              placeholder="Paste full text of the court communication. AI will extract procedural deadlines automatically."
              className="h-28 resize-none" />
          </div>
        </div>

        <div className="p-6 border-t border-[#E8E4DC] flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.subject || !form.received_date || saving || uploadingFile}
            className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save & Process"}
          </Button>
        </div>
      </div>
    </div>
  );
}