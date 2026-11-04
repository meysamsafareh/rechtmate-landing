import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft, Clock, FileText, BookOpen, CheckSquare, Activity,
  Calendar, Users, Building, Inbox, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CaseOverview from "@/components/cases/CaseOverview";
import CaseTimeline from "@/components/cases/CaseTimeline";
import CaseDeadlines from "@/components/cases/CaseDeadlines";
import CaseDocuments from "@/components/cases/CaseDocuments";
import CaseNotes from "@/components/cases/CaseNotes";
import CaseTasks from "@/components/cases/CaseTasks";
import CaseCourtNotifications from "@/components/cases/CaseCourtNotifications";
import CaseClientPortal from "@/components/cases/CaseClientPortal";
import CaseStatusManager from "@/components/cases/CaseStatusManager";
import CaseProcedure from "@/components/procedural/CaseProcedure";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "deadlines", label: "Deadlines", icon: Calendar },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "court", label: "Court", icon: Inbox },
  { id: "clients", label: "Clients", icon: Users },
  { id: "client_status", label: "Client Status", icon: Activity },
  { id: "procedure", label: "Procedure", icon: Zap },
];

const typeColors = {
  civil: "bg-blue-50 text-blue-700",
  commercial: "bg-purple-50 text-purple-700",
  family: "bg-pink-50 text-pink-700",
  labour: "bg-orange-50 text-orange-700",
  criminal: "bg-red-50 text-red-700",
  other: "bg-gray-50 text-gray-700",
};

export default function CaseDetail() {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("id");

  useEffect(() => {
    if (!caseId) { navigate(createPageUrl("Cases")); return; }
    base44.entities.Case.filter({ id: caseId }).then(results => {
      if (results.length === 0) { navigate(createPageUrl("Cases")); return; }
      setCaseData(results[0]);
      setLoading(false);
    });
  }, [caseId]);

  const handleTabFromUrl = () => {
    const tab = urlParams.get("tab");
    if (tab && TABS.find(t => t.id === tab)) setActiveTab(tab);
  };

  useEffect(() => { handleTabFromUrl(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusColor = caseData?.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-600";

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <button onClick={() => navigate(createPageUrl("Cases"))}
              className="p-2 rounded-lg hover:bg-[#F7F6F2] transition-colors text-[#6B7280] hover:text-[#1A1A2E]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#1A1A2E] truncate">{caseData?.title}</h1>
                <Badge className={`text-xs capitalize ${statusColor}`}>{caseData?.status}</Badge>
                {caseData?.case_type && (
                  <Badge className={`text-xs capitalize ${typeColors[caseData.case_type] || typeColors.other}`}>
                    {caseData.case_type.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-[#9CA3AF] flex-wrap">
                {caseData?.reference_number && <span>Ref: {caseData.reference_number}</span>}
                {caseData?.court && (
                  <span className="flex items-center gap-1"><Building className="w-3 h-3" />{caseData.court}</span>
                )}
                {caseData?.start_date && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {format(parseISO(caseData.start_date), "MMM d, yyyy")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-[#1B3A5C] text-[#1B3A5C]"
                    : "border-transparent text-[#6B7280] hover:text-[#1A1A2E]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        {activeTab === "overview" && <CaseOverview caseData={caseData} onCaseUpdated={setCaseData} />}
        {activeTab === "timeline" && <CaseTimeline caseId={caseId} />}
        {activeTab === "deadlines" && <CaseDeadlines caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "documents" && <CaseDocuments caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "notes" && <CaseNotes caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "tasks" && <CaseTasks caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "court" && <CaseCourtNotifications caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "clients" && <CaseClientPortal caseId={caseId} caseTitle={caseData?.title} />}
        {activeTab === "client_status" && <CaseStatusManager caseId={caseId} caseData={caseData} onStatusUpdated={() => base44.entities.Case.filter({ id: caseId }).then(r => r[0] && setCaseData(r[0]))} />}
        {activeTab === "procedure" && <CaseProcedure caseId={caseId} caseType={caseData?.case_type} caseTitle={caseData?.title} />}
      </div>
    </div>
  );
}