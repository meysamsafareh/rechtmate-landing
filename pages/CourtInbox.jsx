import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import InboxFilters from "@/components/inbox/InboxFilters";
import InboxMessageList from "@/components/inbox/InboxMessageList";
import InboxMessageDetail from "@/components/inbox/InboxMessageDetail";
import InboxUploadModal from "@/components/inbox/InboxUploadModal";

const DEFAULT_FILTERS = { search: "", source: "all", status: "all", unreadOnly: false };

export default function CourtInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CourtNotification.list("-received_date", 200);
    setMessages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Keep selected message fresh after updates
  const refreshSelected = async () => {
    await load();
    if (selected) {
      const fresh = messages.find(m => m.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleUpdated = () => {
    load().then(() => {
      if (selected) {
        setMessages(prev => {
          const fresh = prev.find(m => m.id === selected.id);
          if (fresh) setSelected(fresh);
          return prev;
        });
      }
    });
  };

  const filtered = useMemo(() => {
    return messages.filter(m => {
      const src = m.source_system || m.source || "manual";
      if (filters.source !== "all" && src !== filters.source) return false;
      if (filters.status !== "all" && m.status !== filters.status) return false;
      if (filters.unreadOnly && m.is_read) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${m.subject} ${m.court_name} ${m.case_reference} ${m.case_title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [messages, filters]);

  const totalCounts = useMemo(() => ({
    all: messages.length,
    ebox: messages.filter(m => (m.source_system || m.source) === "ebox").length,
    justonweb: messages.filter(m => (m.source_system || m.source) === "justonweb").length,
    manual: messages.filter(m => (m.source_system || m.source || "manual") === "manual").length,
  }), [messages]);

  const unreadCount = messages.filter(m => !m.is_read).length;

  const bulkMarkRead = async () => {
    await Promise.all([...selectedIds].map(id =>
      base44.entities.CourtNotification.update(id, { is_read: true })
    ));
    setSelectedIds(new Set());
    load();
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} message(s)?`)) return;
    await Promise.all([...selectedIds].map(id =>
      base44.entities.CourtNotification.delete(id)
    ));
    setSelectedIds(new Set());
    if (selected && selectedIds.has(selected.id)) setSelected(null);
    load();
  };

  const handleSelect = (msg) => {
    setSelected(msg);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#F7F6F2]">

      {/* ── Left panel: filters + message list ── */}
      <div className={`flex flex-col bg-white border-r border-[#E8E4DC] ${selected ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-[#E8E4DC] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#1B3A5C]" />
              <h1 className="text-base font-bold text-[#1A1A2E]">Court Inbox</h1>
              {unreadCount > 0 && (
                <span className="bg-[#1B3A5C] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={load} className="p-1.5 rounded-lg hover:bg-[#F7F6F2] text-[#6B7280] hover:text-[#1A1A2E]">
                <RefreshCw className="w-4 h-4" />
              </button>
              <Button size="sm" onClick={() => setShowUpload(true)}
                className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 py-1.5 px-2 bg-[#F0EDE8] rounded-lg">
              <span className="text-xs text-[#6B7280]">{selectedIds.size} selected</span>
              <button onClick={bulkMarkRead} className="text-xs text-[#1B3A5C] font-medium hover:underline ml-auto">Mark read</button>
              <button onClick={bulkDelete} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[#9CA3AF]">✕</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <InboxFilters filters={filters} onChange={setFilters} totalCounts={totalCounts} />

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <InboxMessageList
              messages={filtered}
              selectedId={selected?.id}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {/* ── Right panel: message detail ── */}
      <div className={`flex-1 overflow-hidden ${selected ? "flex" : "hidden lg:flex"} flex-col`}>
        {selected ? (
          <InboxMessageDetail
            key={selected.id}
            message={selected}
            onUpdated={handleUpdated}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 bg-[#F0EDE8] rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-9 h-9 text-[#C8C4BE]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">Select a message</h3>
            <p className="text-sm text-[#9CA3AF] max-w-xs">
              Choose a court communication from the list to read its content, link it to a case, and extract deadlines.
            </p>
          </div>
        )}
      </div>

      {showUpload && (
        <InboxUploadModal onClose={() => setShowUpload(false)} onCreated={load} />
      )}
    </div>
  );
}