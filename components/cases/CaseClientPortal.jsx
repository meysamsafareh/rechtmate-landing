import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import {
  Users, Plus, MessageSquare, Activity, Shield,
  ToggleLeft, ToggleRight, Send, Loader2, Trash2,
  Clock, LogIn, FileDown, FileUp, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import InviteClientModal from "@/components/client/InviteClientModal";

const PERM_LABELS = [
  { key: "perm_timeline", label: "View Timeline" },
  { key: "perm_documents", label: "View Documents" },
  { key: "perm_messaging", label: "Send Messages" },
];

const EVENT_ICONS = {
  login: LogIn,
  document_downloaded: FileDown,
  document_uploaded: FileUp,
  message_sent: MessageSquare,
  timeline_viewed: Clock,
  document_viewed: FileDown,
};

export default function CaseClientPortal({ caseId, caseTitle }) {
  const [tab, setTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [updatingPerm, setUpdatingPerm] = useState(null);

  const load = async () => {
    setLoading(true);
    const [c, l] = await Promise.all([
      base44.entities.ClientPortalAccess.filter({ case_id: caseId }, "-created_date", 50),
      base44.entities.ClientActivityLog.filter({ case_id: caseId }, "-created_date", 100),
    ]);
    setClients(c);
    setLogs(l);
    if (c.length > 0 && !selectedClientId) setSelectedClientId(c[0].id);
    setLoading(false);
  };

  const loadMessages = async (clientId) => {
    const msgs = await base44.entities.PortalMessage.filter({ portal_access_id: clientId }, "created_date", 100);
    setMessages(msgs);
    // Mark unread as read
    for (const m of msgs.filter(m => m.sender_type === "client" && !m.is_read_by_lawyer)) {
      await base44.entities.PortalMessage.update(m.id, { is_read_by_lawyer: true });
    }
  };

  useEffect(() => { load(); }, [caseId]);

  useEffect(() => {
    if (tab === "messages" && selectedClientId) loadMessages(selectedClientId);
  }, [tab, selectedClientId]);

  const togglePerm = async (client, key) => {
    setUpdatingPerm(`${client.id}-${key}`);
    await base44.entities.ClientPortalAccess.update(client.id, { [key]: !client[key] });
    await load();
    setUpdatingPerm(null);
  };

  const revokeAccess = async (clientId) => {
    if (!confirm("Revoke this client's access? They will no longer be able to log in.")) return;
    await base44.entities.ClientPortalAccess.update(clientId, { is_active: false });
    load();
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedClientId || sending) return;
    setSending(true);
    const client = clients.find(c => c.id === selectedClientId);
    await base44.entities.PortalMessage.create({
      case_id: caseId,
      case_title: caseTitle,
      portal_access_id: selectedClientId,
      client_name: client?.client_name || "",
      sender_type: "lawyer",
      content: replyText.trim(),
      is_read_by_lawyer: true,
      is_read_by_client: false,
    });
    setReplyText("");
    await loadMessages(selectedClientId);
    setSending(false);
  };

  const isExpired = (client) => new Date(client.expires_at) < new Date();

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Client Portal Access</h2>
          <p className="text-sm text-[#6B7280]">Manage client access and permissions for this case</p>
        </div>
        <Button onClick={() => setShowInvite(true)} size="sm"
          className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> Invite Client
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#F7F6F2] p-1 rounded-lg w-fit mb-5">
        {[
          { id: "clients", label: "Clients", icon: Users },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "activity", label: "Activity Log", icon: Activity },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white text-[#1A1A2E] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A2E]"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* === CLIENTS === */}
      {tab === "clients" && (
        <>
          {clients.length === 0 ? (
            <div className="bg-[#F7F6F2] rounded-xl p-12 text-center">
              <Users className="w-9 h-9 text-[#D1CEC8] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF] mb-4">No clients invited yet</p>
              <Button onClick={() => setShowInvite(true)} variant="outline" size="sm">Invite a Client</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(client => {
                const expired = isExpired(client);
                const revoked = !client.is_active;
                return (
                  <div key={client.id} className="bg-white rounded-xl border border-[#E8E4DC] p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#1A1A2E]">{client.client_name}</p>
                          {client.client_role && <span className="text-xs text-[#9CA3AF]">({client.client_role})</span>}
                          <Badge className={`text-xs ${revoked ? "bg-red-50 text-red-600" : expired ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-700"}`}>
                            {revoked ? "Revoked" : expired ? "Expired" : "Active"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.client_email}</span>
                          {client.last_accessed_at && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last seen {format(new Date(client.last_accessed_at), "MMM d, HH:mm")}</span>
                          )}
                        </div>
                      </div>
                      {!revoked && (
                        <button onClick={() => revokeAccess(client.id)}
                          className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                    </div>

                    {/* Permissions */}
                    {!revoked && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Shield className="w-3.5 h-3.5 text-[#C8A96E]" />
                          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Access Permissions</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {PERM_LABELS.map(({ key, label }) => {
                            const enabled = client[key];
                            const isUpdating = updatingPerm === `${client.id}-${key}`;
                            return (
                              <button key={key} onClick={() => togglePerm(client, key)} disabled={isUpdating}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all ${
                                  enabled
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-[#F7F6F2] border-[#E8E4DC] text-[#6B7280]"
                                }`}>
                                <span className="font-medium">{label}</span>
                                {isUpdating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : enabled ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-[#D1D5DB]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === MESSAGES === */}
      {tab === "messages" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
          {/* Client selector */}
          <div className="md:col-span-1 bg-white rounded-xl border border-[#E8E4DC] overflow-y-auto">
            {clients.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#9CA3AF]">No clients yet</div>
            ) : (
              clients.map(client => {
                const unreadCount = logs.filter(l => l.portal_access_id === client.id && l.event_type === "message_sent").length;
                return (
                  <button key={client.id} onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left p-3 border-b border-[#E8E4DC] last:border-0 hover:bg-[#F7F6F2] transition-colors ${selectedClientId === client.id ? "bg-[#F7F6F2]" : ""}`}>
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">{client.client_name}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{client.client_email}</p>
                  </button>
                );
              })
            )}
          </div>

          {/* Thread */}
          <div className="md:col-span-2 bg-white rounded-xl border border-[#E8E4DC] flex flex-col overflow-hidden">
            {!selectedClientId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[#9CA3AF]">Select a client</div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-[#9CA3AF] py-8">No messages yet</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_type === "lawyer" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                          msg.sender_type === "lawyer"
                            ? "bg-[#1B3A5C] text-white"
                            : "bg-[#F7F6F2] text-[#1A1A2E]"
                        }`}>
                          <p className={`text-xs font-semibold mb-1 ${msg.sender_type === "lawyer" ? "text-white/60" : "text-[#C8A96E]"}`}>
                            {msg.sender_type === "lawyer" ? "You" : msg.client_name}
                          </p>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender_type === "lawyer" ? "text-white/40" : "text-[#9CA3AF]"}`}>
                            {msg.created_date && format(new Date(msg.created_date), "MMM d · HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {clients.find(c => c.id === selectedClientId)?.perm_messaging ? (
                  <div className="border-t border-[#E8E4DC] p-3 flex gap-2">
                    <Textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Reply to client…"
                      className="resize-none h-14 flex-1 text-sm"
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    />
                    <Button onClick={sendReply} disabled={!replyText.trim() || sending}
                      className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white self-end h-9 w-9 p-0">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="border-t border-[#E8E4DC] p-3 text-xs text-center text-[#9CA3AF]">
                    Enable messaging permission for this client to reply.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* === ACTIVITY LOG === */}
      {tab === "activity" && (
        <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-9 h-9 text-[#E8E4DC] mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF]">No client activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F7F6F2]">
              {logs.map(log => {
                const Icon = EVENT_ICONS[log.event_type] || Activity;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-[#FAFAF8]">
                    <div className="w-7 h-7 bg-[#F7F6F2] rounded-full flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A2E]">
                        <span className="font-medium">{log.client_name}</span>
                        {" — "}
                        <span className="capitalize">{log.event_type.replace(/_/g, " ")}</span>
                      </p>
                      {log.details && <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{log.details}</p>}
                    </div>
                    <p className="text-xs text-[#C8C4BE] shrink-0">
                      {log.created_date && format(new Date(log.created_date), "MMM d · HH:mm")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showInvite && (
        <InviteClientModal
          caseId={caseId}
          caseTitle={caseTitle}
          onClose={() => setShowInvite(false)}
          onInvited={load}
        />
      )}
    </div>
  );
}