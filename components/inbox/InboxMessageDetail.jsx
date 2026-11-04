import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import {
  Building2, Calendar, User, ExternalLink,
  CheckCircle2, X, Link2, Paperclip, MailOpen, Brain, Loader2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SourceBadge from "@/components/court/SourceBadge";
import ParseDocumentButton from "@/components/inbox/ParseDocumentButton";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";

const statusStyles = {
  unassigned: "bg-orange-50 text-orange-700 border-orange-200",
  assigned:   "bg-blue-50 text-blue-700 border-blue-200",
  processed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function InboxMessageDetail({ message, onUpdated, onClose, onDeleted }) {
  const [cases, setCases] = useState([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  useEffect(() => {
    base44.entities.Case.list("-updated_date", 100).then(setCases);
    // Mark as read
    if (!message.is_read) {
      base44.entities.CourtNotification.update(message.id, { is_read: true }).then(onUpdated);
    }
  }, [message.id]);

  const filteredCases = caseSearch
    ? cases.filter(c =>
        c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
        (c.reference_number || "").toLowerCase().includes(caseSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const assignToCase = async (c) => {
    setAssigning(true);
    await base44.entities.CourtNotification.update(message.id, {
      case_id: c.id,
      case_title: c.title,
      status: "assigned",
    });
    // Create timeline event
    await base44.entities.TimelineEvent.create({
      case_id: c.id,
      case_title: c.title,
      title: `Court communication: ${message.subject}`,
      event_type: "other",
      event_date: message.received_date,
      description: `Source: ${message.source_system || message.source || "manual"}. Court: ${message.court_name || "—"}. ${message.raw_content ? message.raw_content.slice(0, 300) : ""}`,
    });
    // Create notification
    await base44.entities.Notification.create({
      message: `New court message linked to case: ${c.title}`,
      case_id: c.id,
      case_title: c.title,
      type: "activity",
      is_read: false,
    });
    setAssigning(false);
    setShowAssign(false);
    setCaseSearch("");
    onUpdated();
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await base44.functions.invoke("processCourtNotification", { notification_id: message.id });
    } catch {}
    setProcessing(false);
    onUpdated();
  };

  const markProcessed = async () => {
    await base44.entities.CourtNotification.update(message.id, { status: "processed" });
    onUpdated();
  };

  const handleDelete = async () => {
    // Delete related parsed data
    const parsed = await base44.entities.ParsedCourtData.filter({ notification_id: message.id });
    for (const p of parsed) {
      await base44.entities.ParsedCourtData.delete(p.id);
    }
    // Delete the notification itself
    await base44.entities.CourtNotification.delete(message.id);
    if (onDeleted) onDeleted();
    else onUpdated();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E4DC] shrink-0">
        <div className="flex items-center gap-2">
          <SourceBadge source={message.source_system || message.source || "manual"} />
          <Badge className={`text-xs border capitalize ${statusStyles[message.status] || statusStyles.unassigned}`}>
            {message.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {message.status !== "processed" && (
            <Button size="sm" variant="outline" onClick={markProcessed} className="text-xs h-7 gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Processed
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowDelete(true)}
            className="text-xs h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          {onClose && (
            <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#374151] lg:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Demo banner */}
        {message.subject?.startsWith('[DEMO]') && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <span className="font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">DEMO</span>
            <span>This is a simulated court communication — not real data.</span>
          </div>
        )}

        {/* Subject */}
        <h2 className="text-lg font-bold text-[#1A1A2E] leading-snug">
          {message.subject?.replace('[DEMO] ', '')}
        </h2>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { IconComp: Building2, label: "Court", value: message.court_name },
            { IconComp: User, label: "Sender", value: message.sender },
            { IconComp: Calendar, label: "Received", value: message.received_date ? format(parseISO(message.received_date), "d MMMM yyyy") : null },
            { IconComp: MailOpen, label: "Reference", value: message.case_reference },
          ].map(({ IconComp, label, value }) => value ? (
            <div key={label} className="bg-[#F7F6F2] rounded-lg p-3">
              <p className="text-xs text-[#9CA3AF] font-medium mb-0.5">{label}</p>
              <div className="flex items-center gap-1.5 text-sm text-[#1A1A2E] font-medium">
                <IconComp className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                {value}
              </div>
            </div>
          ) : null)}
        </div>

        {/* Case link */}
        <div className="border border-[#E8E4DC] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Linked Case</p>
            {!message.case_id && (
              <button onClick={() => setShowAssign(!showAssign)}
                className="text-xs text-[#1B3A5C] font-medium hover:underline flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Assign to Case
              </button>
            )}
          </div>

          {message.case_id ? (
            <Link to={`${createPageUrl("CaseDetail")}?id=${message.case_id}`}
              className="flex items-center gap-2 text-sm font-semibold text-[#1B3A5C] hover:underline">
              <ExternalLink className="w-4 h-4" />{message.case_title}
            </Link>
          ) : (
            <p className="text-sm text-[#9CA3AF]">Not yet assigned to a case</p>
          )}

          {showAssign && !message.case_id && (
            <div className="mt-3 relative">
              <input
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                placeholder="Search case by name or reference..."
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A5C]"
                autoFocus
              />
              {filteredCases.length > 0 && (
                <div className="mt-1 border border-[#E8E4DC] rounded-lg overflow-hidden shadow-md bg-white z-10">
                  {filteredCases.map(c => (
                    <button key={c.id} onClick={() => assignToCase(c)} disabled={assigning}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#F7F6F2] text-sm border-b border-[#E8E4DC] last:border-0">
                      <span className="font-medium text-[#1A1A2E]">{c.title}</span>
                      {c.reference_number && <span className="text-xs text-[#9CA3AF] ml-2">{c.reference_number}</span>}
                    </button>
                  ))}
                </div>
              )}
              {assigning && <p className="text-xs text-[#9CA3AF] mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Assigning...</p>}
            </div>
          )}
        </div>

        {/* Message body */}
        {(message.raw_content || message.message_body) && (
          <div className="border border-[#E8E4DC] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Message Content</p>
            <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">
              {message.message_body || message.raw_content}
            </p>
          </div>
        )}

        {/* Attachments */}
        {(message.attachment_links || message.document_links) && (
          <div className="border border-[#E8E4DC] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </p>
            {[...(message.attachment_links || "").split(","), ...(message.document_links || "").split(",")]
              .map(s => s.trim()).filter(Boolean).map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="block text-sm text-[#1B3A5C] hover:underline truncate mb-1">
                  {link}
                </a>
              ))}
          </div>
        )}

        {/* Smart Parse Engine */}
        <div className="border-t border-[#E8E4DC] pt-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Smart Parsing Engine
          </p>
          <ParseDocumentButton
            notificationId={message.id}
            caseId={message.case_id}
            onApproved={onUpdated}
          />
        </div>
      </div>
    <DeleteConfirmModal
      isOpen={showDelete}
      onClose={() => setShowDelete(false)}
      onConfirm={handleDelete}
      itemLabel="court notification"
    />
    </div>
  );
}