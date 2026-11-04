import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import {
  Scale, FileText, MessageSquare, Clock, Home, Download,
  Send, Loader2, AlertCircle, Lock, CheckCircle2, TrendingUp, History
} from "lucide-react";

const STATUS_CONFIG = {
  case_preparation: { label: "Case Preparation", explanation: "Your lawyer is currently preparing your case file, gathering the necessary documents and building the legal strategy.", stage: 1, dot: "bg-blue-500" },
  filed_with_court: { label: "Filed with Court", explanation: "Your case has been officially submitted to the court. The court has received all necessary documents to open your file.", stage: 2, dot: "bg-indigo-500" },
  waiting_for_court_response: { label: "Waiting for Court Response", explanation: "Your case has been submitted to the court. We are currently waiting for the court to review the file and provide the next procedural step.", stage: 2, dot: "bg-amber-500" },
  hearing_scheduled: { label: "Hearing Scheduled", explanation: "A court hearing has been scheduled for your case. Your lawyer will represent you and present your case before the judge.", stage: 3, dot: "bg-orange-500" },
  evidence_phase: { label: "Evidence Phase", explanation: "The court is currently in the evidence-gathering phase. Documents and statements are being reviewed by all parties.", stage: 3, dot: "bg-orange-500" },
  awaiting_decision: { label: "Awaiting Decision", explanation: "All arguments and evidence have been presented. We are now waiting for the judge to deliver a final decision in your case.", stage: 4, dot: "bg-purple-500" },
  decision_received: { label: "Decision Received", explanation: "The court has issued a decision in your case. Your lawyer will review the ruling and discuss the next steps with you.", stage: 4, dot: "bg-emerald-500" },
  case_closed: { label: "Case Closed", explanation: "Your case has been fully concluded. All proceedings have been completed.", stage: 5, dot: "bg-gray-400" },
};

const PROGRESS_STAGES = [
  { id: 1, label: "Case Filed" },
  { id: 2, label: "Under Review" },
  { id: 3, label: "Hearing" },
  { id: 4, label: "Decision" },
  { id: 5, label: "Closed" },
];
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TABS = [
  { id: "overview", label: "Case Overview", icon: Home },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

export default function ClientPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) { setError("Invalid link — no access token found."); setLoading(false); return; }
    loadData();
  }, [token]);

  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, portalData?.messages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getClientPortalData", { token });
      setPortalData(res.data);
      base44.functions.invoke("logPortalActivity", { token, event_type: "login" }).catch(() => {});
    } catch (e) {
      setError(
        e?.response?.data?.error ||
        "Unable to access portal. The link may be invalid or expired."
      );
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendPortalMessage", { token, content: message });
      setMessage("");
      await loadData();
    } catch {}
    setSending(false);
  };

  const logActivity = (event_type, details) => {
    base44.functions.invoke("logPortalActivity", { token, event_type, details }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#1B3A5C] border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-[#6B7280]">Loading your secure portal…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Access Denied</h2>
          <p className="text-[#6B7280] text-sm">{error}</p>
          <div className="mt-6 p-3 bg-[#F7F6F2] rounded-lg">
            <p className="text-xs text-[#9CA3AF]">Please contact your lawyer to receive a new invitation link.</p>
          </div>
        </div>
      </div>
    );
  }

  const { access, case: caseData, documents = [], timeline = [], messages = [], status_updates = [] } = portalData;

  const availableTabs = TABS.filter(tab => {
    if (tab.id === "overview") return true;
    if (tab.id === "documents") return access.perm_documents;
    if (tab.id === "timeline") return access.perm_timeline;
    if (tab.id === "messages") return access.perm_messaging;
    return false;
  });

  const unreadMessages = messages.filter(m => m.sender_type === "lawyer" && !m.is_read_by_client).length;

  return (
    <div className="min-h-screen bg-[#F7F6F2]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <header className="bg-[#1B3A5C] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#C8A96E] flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">RechtMate Client Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-white/40" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-tight">{access.client_name}</p>
              <p className="text-xs text-white/50">{access.client_email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Case banner + tabs */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-0">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Your Case</p>
          <h1 className="text-xl font-bold text-[#1A1A2E]">{caseData.title}</h1>
          <div className="flex items-center gap-4 mt-1 mb-4 text-xs text-[#6B7280]">
            {caseData.reference_number && <span>Ref: {caseData.reference_number}</span>}
            {caseData.court && <span>{caseData.court}</span>}
            <span className="capitalize text-emerald-600 font-medium">{caseData.status}</span>
          </div>

          <div className="flex gap-0 overflow-x-auto -mb-px">
            {availableTabs.map(tab => {
              const hasUnread = tab.id === "messages" && unreadMessages > 0;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors relative ${
                    activeTab === tab.id
                      ? "border-[#1B3A5C] text-[#1B3A5C]"
                      : "border-transparent text-[#6B7280] hover:text-[#1A1A2E]"
                  }`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {hasUnread && <span className="w-2 h-2 bg-[#C8A96E] rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* === OVERVIEW === */}
        {activeTab === "overview" && (() => {
          const statusCfg = STATUS_CONFIG[caseData.client_status];
          const currentStage = statusCfg?.stage || 0;
          return (
            <div className="space-y-4">

              {/* Your Case Status — primary card */}
              {caseData.client_status && statusCfg ? (
                <div className="bg-white rounded-xl border border-[#E8E4DC] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-[#C8A96E]" />
                    <h2 className="font-semibold text-[#1A1A2E]">Your Case Status</h2>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex gap-1.5 mb-2">
                      {PROGRESS_STAGES.map(stage => (
                        <div key={stage.id} className="flex-1">
                          <div className={`h-2 rounded-full transition-colors ${stage.id <= currentStage ? "bg-[#C8A96E]" : "bg-[#E8E4DC]"}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      {PROGRESS_STAGES.map(stage => (
                        <span key={stage.id} className={`text-xs ${stage.id === currentStage ? "text-[#C8A96E] font-semibold" : "text-[#C8C4BE]"}`} style={{ flex: 1, textAlign: "center" }}>
                          {stage.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-3 ${statusCfg.dot.replace("bg-", "bg-").replace("500", "50")} `}
                    style={{ background: "rgba(200,169,110,0.1)", color: "#1B3A5C" }}>
                    <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </div>

                  <p className="text-sm text-[#374151] leading-relaxed">{statusCfg.explanation}</p>

                  {caseData.client_status_note && (
                    <div className="mt-4 p-4 bg-[#F7F6F2] rounded-xl border-l-3 border-l-[#C8A96E]" style={{ borderLeftWidth: 3, borderLeftColor: "#C8A96E" }}>
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Message from your lawyer</p>
                      <p className="text-sm text-[#1A1A2E] leading-relaxed">"{caseData.client_status_note}"</p>
                    </div>
                  )}

                  {caseData.client_status_updated_at && (
                    <p className="text-xs text-[#9CA3AF] mt-3">
                      Last updated: {format(new Date(caseData.client_status_updated_at), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E8E4DC] p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-[#E8E4DC] mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">Your lawyer will provide a status update soon.</p>
                </div>
              )}

              {/* Status update history */}
              {status_updates.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E8E4DC] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-[#9CA3AF]" />
                    <h3 className="text-sm font-semibold text-[#1A1A2E]">Case Updates History</h3>
                  </div>
                  <div className="relative">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-[#E8E4DC]" />
                    <div className="space-y-3 pl-7">
                      {status_updates.map((u, i) => (
                        <div key={u.id} className="relative">
                          <div className={`absolute -left-5 w-2 h-2 rounded-full border-2 border-white mt-1.5 ${i === 0 ? "bg-[#C8A96E]" : "bg-[#D1D5DB]"}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[#1A1A2E]">{u.client_status_label || STATUS_CONFIG[u.client_status]?.label}</p>
                              {u.note && <p className="text-xs text-[#6B7280] mt-0.5 italic">"{u.note}"</p>}
                            </div>
                            <span className="text-xs text-[#C8C4BE] shrink-0 whitespace-nowrap">
                              {u.created_date && format(new Date(u.created_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Case details */}
              <div className="bg-white rounded-xl border border-[#E8E4DC] p-6">
                <h2 className="font-semibold text-[#1A1A2E] mb-4">Case Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {caseData.case_type && (
                    <div><dt className="text-[#9CA3AF] text-xs uppercase tracking-wide mb-0.5">Type</dt><dd className="capitalize font-medium text-[#1A1A2E]">{caseData.case_type}</dd></div>
                  )}
                  {caseData.court && (
                    <div><dt className="text-[#9CA3AF] text-xs uppercase tracking-wide mb-0.5">Court</dt><dd className="font-medium text-[#1A1A2E]">{caseData.court}</dd></div>
                  )}
                  {caseData.jurisdiction && (
                    <div><dt className="text-[#9CA3AF] text-xs uppercase tracking-wide mb-0.5">Jurisdiction</dt><dd className="font-medium text-[#1A1A2E]">{caseData.jurisdiction}</dd></div>
                  )}
                  {caseData.start_date && (
                    <div><dt className="text-[#9CA3AF] text-xs uppercase tracking-wide mb-0.5">Start Date</dt><dd className="font-medium text-[#1A1A2E]">{format(parseISO(caseData.start_date), "MMMM d, yyyy")}</dd></div>
                  )}
                </dl>
                {caseData.description && (
                  <div className="mt-5 pt-5 border-t border-[#E8E4DC]">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{caseData.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Confidential Information</p>
                  <p className="text-xs text-amber-700 mt-0.5">This portal is for your eyes only. Do not share your access link.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* === DOCUMENTS === */}
        {activeTab === "documents" && (
          <div>
            <h2 className="font-semibold text-[#1A1A2E] mb-4">
              Shared Documents <span className="text-[#9CA3AF] font-normal text-sm">({documents.length})</span>
            </h2>
            {documents.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8E4DC] p-12 text-center">
                <FileText className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
                <p className="text-[#9CA3AF]">No documents have been shared yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white rounded-xl border border-[#E8E4DC] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F7F6F2] rounded-lg flex items-center justify-center text-xl shrink-0">
                      {doc.file_type?.includes("pdf") ? "📕" : doc.file_type?.includes("image") ? "🖼️" : doc.file_type?.includes("word") ? "📘" : "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E]">{doc.name}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {doc.created_date && format(new Date(doc.created_date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logActivity("document_downloaded", `Downloaded: ${doc.name}`)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#1B3A5C] hover:text-[#C8A96E] transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === TIMELINE === */}
        {activeTab === "timeline" && (() => {
          if (activeTab === "timeline") logActivity("timeline_viewed", "Viewed case timeline");
          return null;
        })()}
        {activeTab === "timeline" && (
          <div>
            <h2 className="font-semibold text-[#1A1A2E] mb-5">Case Timeline</h2>
            {timeline.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E8E4DC] p-12 text-center">
                <Clock className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
                <p className="text-[#9CA3AF]">No timeline events available yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E8E4DC]" />
                <div className="space-y-4 pl-10">
                  {timeline.map(event => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-6 w-2.5 h-2.5 bg-[#C8A96E] rounded-full border-2 border-white mt-3.5" />
                      <div className="bg-white rounded-xl border border-[#E8E4DC] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-medium text-[#1A1A2E] text-sm">{event.title}</h3>
                          <span className="text-xs text-[#9CA3AF] whitespace-nowrap shrink-0">
                            {event.event_date && format(parseISO(event.event_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-[#6B7280] mt-1">{event.description}</p>
                        )}
                        <span className="text-xs text-[#C8A96E] capitalize mt-1.5 inline-block">{event.event_type?.replace("_", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === MESSAGES === */}
        {activeTab === "messages" && (
          <div>
            <h2 className="font-semibold text-[#1A1A2E] mb-4">Secure Messages</h2>
            <div className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden flex flex-col" style={{ height: "calc(100vh - 340px)", minHeight: 380 }}>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="w-10 h-10 text-[#E8E4DC] mb-3" />
                    <p className="text-sm text-[#9CA3AF]">No messages yet.</p>
                    <p className="text-xs text-[#C8C4BE] mt-1">Start a conversation with your lawyer.</p>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_type === "client" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender_type === "client"
                            ? "bg-[#1B3A5C] text-white rounded-br-sm"
                            : "bg-[#F7F6F2] text-[#1A1A2E] rounded-bl-sm"
                        }`}>
                          <p className={`text-xs mb-1 font-semibold ${msg.sender_type === "client" ? "text-white/60" : "text-[#C8A96E]"}`}>
                            {msg.sender_type === "client" ? "You" : "Your Lawyer"}
                          </p>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1.5 ${msg.sender_type === "client" ? "text-white/40" : "text-[#C8C4BE]"}`}>
                            {msg.created_date && format(new Date(msg.created_date), "MMM d · HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t border-[#E8E4DC] p-4 flex gap-3 bg-[#FAFAF8]">
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message to your lawyer…"
                  className="resize-none h-16 flex-1 text-sm bg-white"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button onClick={sendMessage} disabled={!message.trim() || sending}
                  className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white self-end h-9 w-9 p-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}