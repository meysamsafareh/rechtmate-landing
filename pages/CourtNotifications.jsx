import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Plus, Inbox, AlertCircle, MailOpen, Wifi, WifiOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddCourtNotificationModal from "@/components/court/AddCourtNotificationModal";
import CourtNotificationCard from "@/components/court/CourtNotificationCard";

export default function CourtNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CourtNotification.list("-received_date", 100);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unassigned = notifications.filter(n => n.status === "unassigned");
  const processed = notifications.filter(n => n.status === "processed");
  const displayed = activeTab === "unassigned" ? unassigned : notifications;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Court Notifications</h1>
          <p className="text-sm text-[#6B7280] mt-1">Court communications via eBox, Just-on-Web, and manual entry</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2">
          <Plus className="w-4 h-4" /> Add Notification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-[#E8E4DC]">
          <p className="text-2xl font-bold text-[#1A1A2E]">{notifications.length}</p>
          <p className="text-sm text-[#6B7280]">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E8E4DC]">
          <p className="text-2xl font-bold text-orange-600">{unassigned.length}</p>
          <p className="text-sm text-[#6B7280]">Unassigned</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#E8E4DC]">
          <p className="text-2xl font-bold text-emerald-600">{processed.length}</p>
          <p className="text-sm text-[#6B7280]">Processed</p>
        </div>
      </div>

      {/* Integration status banners */}
      <div className="space-y-3 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">eBox — Not Connected</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Configure eBox credentials in Settings → Integrations to enable automatic polling every 5 minutes.
            </p>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Globe className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-800">Just-on-Web — Ready for Activation</p>
            <p className="text-sm text-purple-700 mt-0.5">
              The Just-on-Web integration architecture is fully implemented and ready. 
              Configure API credentials in <span className="font-semibold">Settings → Integrations → Just-on-Web</span> to activate automatic court notification syncing.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#F7F6F2] p-1 rounded-lg w-fit">
        {[
          { id: "all", label: `All (${notifications.length})` },
          { id: "unassigned", label: `Unassigned (${unassigned.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-[#1A1A2E] shadow-sm"
                : "text-[#6B7280] hover:text-[#1A1A2E]"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DC] p-12 text-center">
          <Inbox className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] mb-1">
            {activeTab === "unassigned" ? "No unassigned notifications" : "No court notifications yet"}
          </p>
          {activeTab === "all" && (
            <Button onClick={() => setShowAdd(true)} variant="outline" className="mt-3">
              Add your first notification
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(n => (
            <CourtNotificationCard key={n.id} notification={n} onUpdated={load} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddCourtNotificationModal
          onClose={() => setShowAdd(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}