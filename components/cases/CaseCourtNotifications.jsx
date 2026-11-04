import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Inbox, Plus, Building2, Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddCourtNotificationModal from "@/components/court/AddCourtNotificationModal";
import ParseDocumentButton from "@/components/inbox/ParseDocumentButton";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";

const statusStyles = {
  unassigned: "bg-orange-50 text-orange-700",
  assigned: "bg-blue-50 text-blue-700",
  processed: "bg-emerald-50 text-emerald-700",
};

export default function CaseCourtNotifications({ caseId, caseTitle }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CourtNotification.filter({ case_id: caseId }, "-received_date", 50);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const parsed = await base44.entities.ParsedCourtData.filter({ notification_id: deleteTarget.id });
    for (const p of parsed) await base44.entities.ParsedCourtData.delete(p.id);
    await base44.entities.CourtNotification.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Court Notifications</h2>
          <p className="text-sm text-[#6B7280]">Communications received from the court for this case</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"
          className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#F7F6F2] rounded-xl p-12 text-center">
          <Inbox className="w-9 h-9 text-[#D1CEC8] mx-auto mb-3" />
          <p className="text-sm text-[#9CA3AF] mb-4">No court notifications for this case yet</p>
          <Button onClick={() => setShowAdd(true)} variant="outline" size="sm">
            Add a notification
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
              {/* Card header */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className={`text-xs capitalize ${statusStyles[n.status] || statusStyles.unassigned}`}>
                      {n.status}
                    </Badge>
                    {n.extracted_deadlines_count > 0 && (
                      <Badge className="text-xs bg-[#C8A96E]/10 text-[#C8A96E]">
                        {n.extracted_deadlines_count} deadline{n.extracted_deadlines_count > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-[#1A1A2E] text-sm">{n.subject}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280] flex-wrap">
                    {n.court_name && (
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{n.court_name}</span>
                    )}
                    {n.received_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{format(parseISO(n.received_date), "d MMM yyyy")}
                      </span>
                    )}
                  </div>
                  {n.raw_content && (
                    <p className="text-xs text-[#9CA3AF] mt-2 line-clamp-2">{n.raw_content}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                    className="flex items-center gap-1 text-xs text-[#1B3A5C] font-medium bg-[#1B3A5C]/5 hover:bg-[#1B3A5C]/10 px-3 py-1.5 rounded-lg transition-colors">
                    {expandedId === n.id
                      ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
                      : <><ChevronDown className="w-3.5 h-3.5" /> Parse</>}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(n)}
                    className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              {/* Expanded parse panel */}
              {expandedId === n.id && (
                <div className="border-t border-[#E8E4DC] px-4 py-4 bg-[#F7F6F2]/50">
                  <ParseDocumentButton
                    notificationId={n.id}
                    caseId={caseId}
                    onApproved={load}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCourtNotificationModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { load(); setShowAdd(false); }}
          defaultCaseId={caseId}
          defaultCaseTitle={caseTitle}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemLabel="court notification"
      />
    </div>
  );
}