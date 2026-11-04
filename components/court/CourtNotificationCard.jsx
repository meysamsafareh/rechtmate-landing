import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Building2, Calendar, User, Loader2, ExternalLink, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SourceBadge from "@/components/court/SourceBadge";

const statusStyles = {
  unassigned: "bg-orange-50 text-orange-700 border-orange-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  processed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function CourtNotificationCard({ notification: n, onUpdated }) {
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await base44.functions.invoke("processCourtNotification", { notification_id: n.id });
      await onUpdated();
    } catch {}
    setProcessing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this court notification?")) return;
    await base44.entities.CourtNotification.delete(n.id);
    onUpdated();
  };

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DC] p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={`text-xs capitalize border ${statusStyles[n.status] || statusStyles.unassigned}`}>
              {n.status}
            </Badge>
            <SourceBadge source={n.source_system || n.source || "manual"} />
            {n.extracted_deadlines_count > 0 && (
              <Badge className="text-xs bg-[#C8A96E]/10 text-[#C8A96E] border border-[#C8A96E]/20">
                {n.extracted_deadlines_count} deadline{n.extracted_deadlines_count > 1 ? "s" : ""} extracted
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-[#1A1A2E] truncate">{n.subject}</h3>

          <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280] flex-wrap">
            {n.court_name && (
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{n.court_name}</span>
            )}
            {n.sender && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{n.sender}</span>
            )}
            {n.received_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(n.received_date), "d MMM yyyy")}
              </span>
            )}
          </div>

          {n.case_title && n.case_id && (
            <Link to={`${createPageUrl("CaseDetail")}?id=${n.case_id}&tab=court`}
              className="inline-flex items-center gap-1 mt-2 text-xs text-[#1B3A5C] hover:underline font-medium">
              <ExternalLink className="w-3 h-3" />{n.case_title}
            </Link>
          )}

          {n.raw_content && (
            <p className="text-xs text-[#9CA3AF] mt-2 line-clamp-2">{n.raw_content}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {n.status !== "processed" && n.raw_content && (
            <Button size="sm" onClick={handleProcess} disabled={processing}
              className="bg-[#C8A96E] hover:bg-[#B8955A] text-white text-xs h-8 gap-1.5">
              {processing
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><Zap className="w-3 h-3" /> Process</>
              }
            </Button>
          )}
          <button onClick={handleDelete}
            className="p-1.5 text-[#C8C4BE] hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}