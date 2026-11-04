import { format, parseISO } from "date-fns";
import { Building2, Calendar, Paperclip, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SourceBadge from "@/components/court/SourceBadge";

const statusStyles = {
  unassigned: "bg-orange-50 text-orange-700 border-orange-200",
  assigned:   "bg-blue-50 text-blue-700 border-blue-200",
  processed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function InboxMessageList({ messages, selectedId, onSelect }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
        <div className="w-14 h-14 bg-[#F7F6F2] rounded-full flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-[#C8C4BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[#9CA3AF] font-medium text-sm">No messages found</p>
        <p className="text-xs text-[#C8C4BE] mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#F3F4F6]">
      {messages.map(msg => {
        const isSelected = msg.id === selectedId;
        const isUnread = !msg.is_read;
        return (
          <button
            key={msg.id}
            onClick={() => onSelect(msg)}
            className={`w-full text-left px-4 py-3.5 hover:bg-[#FAFAF8] transition-colors relative ${
              isSelected ? "bg-[#F0EDE8] border-l-2 border-[#1B3A5C]" : "border-l-2 border-transparent"
            }`}
          >
            {isUnread && (
              <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-[#1B3A5C]" />
            )}
            <div className="flex items-start gap-2 mb-1.5 pr-4">
              <SourceBadge source={msg.source_system || msg.source || "manual"} />
              <Badge className={`text-xs border capitalize ml-auto shrink-0 ${statusStyles[msg.status] || statusStyles.unassigned}`}>
                {msg.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {msg.subject?.startsWith('[DEMO]') && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                  DEMO
                </span>
              )}
              <p className={`text-sm truncate ${isUnread ? "font-semibold text-[#1A1A2E]" : "font-medium text-[#374151]"}`}>
                {msg.subject?.replace('[DEMO] ', '')}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#9CA3AF]">
              {msg.court_name && (
                <span className="flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 shrink-0" />{msg.court_name}
                </span>
              )}
              {msg.received_date && (
                <span className="flex items-center gap-1 shrink-0 ml-auto">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(msg.received_date), "d MMM yyyy")}
                </span>
              )}
            </div>
            {msg.case_title && (
              <p className="text-xs text-[#1B3A5C] font-medium mt-1 truncate">↳ {msg.case_title}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {(msg.attachment_links || msg.document_links) && (
                <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <Paperclip className="w-3 h-3" /> Attachment
                </span>
              )}
              {msg.raw_payload && (() => {
                try {
                  const p = JSON.parse(msg.raw_payload);
                  if (!p?.parse_status) return null;
                  const statusMap = {
                    pending_review: { label: "Needs Review", cls: "text-amber-600" },
                    approved: { label: "Parsed ✓", cls: "text-emerald-600" },
                    rejected: { label: "Rejected", cls: "text-red-500" },
                  };
                  const s = statusMap[p.parse_status];
                  return s ? (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${s.cls}`}>
                      <Brain className="w-3 h-3" />{s.label}
                    </span>
                  ) : null;
                } catch { return null; }
              })()}
            </div>
          </button>
        );
      })}
    </div>
  );
}