import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Plus, Briefcase, Search, Filter, ChevronRight, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import CaseWizard from "@/components/cases/CaseWizard";

const typeColors = {
  civil: "bg-blue-50 text-blue-700",
  commercial: "bg-purple-50 text-purple-700",
  family: "bg-pink-50 text-pink-700",
  labour: "bg-orange-50 text-orange-700",
  criminal: "bg-red-50 text-red-700",
  other: "bg-gray-50 text-gray-700",
};

const statusColors = {
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gray-50 text-gray-600",
  archived: "bg-yellow-50 text-yellow-700",
};

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showWizard, setShowWizard] = useState(false);

  const load = async () => {
    const data = await base44.entities.Case.list("-updated_date", 100);
    setCases(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleCreated = () => {
    setShowWizard(false);
    load();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Cases</h1>
          <p className="text-sm text-[#6B7280] mt-1">{cases.length} total cases</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2">
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-[#E8E4DC] bg-white"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "closed", "archived"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-[#1B3A5C] text-white" : "bg-white text-[#6B7280] border border-[#E8E4DC] hover:border-[#1B3A5C]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">No cases found</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Create your first case to get started</p>
          <Button onClick={() => setShowWizard(true)} className="mt-4 bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-2">
            <Plus className="w-4 h-4" /> New Case
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link key={c.id} to={`${createPageUrl("CaseDetail")}?id=${c.id}`}
              className="bg-white rounded-xl border border-[#E8E4DC] p-5 hover:border-[#C8A96E] hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#F7F6F2] rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#1B3A5C]" />
                </div>
                <Badge className={`text-xs ${statusColors[c.status] || statusColors.active}`}>
                  {c.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-[#1A1A2E] mb-1 line-clamp-2 group-hover:text-[#1B3A5C] transition-colors">
                {c.title}
              </h3>
              {c.reference_number && (
                <p className="text-xs text-[#9CA3AF] mb-2">Ref: {c.reference_number}</p>
              )}
              {c.description && (
                <p className="text-sm text-[#6B7280] line-clamp-2 mb-3">{c.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs capitalize ${typeColors[c.case_type] || typeColors.other}`}>
                  {c.case_type?.replace("_", " ")}
                </Badge>
                {c.court && (
                  <span className="text-xs text-[#9CA3AF]">{c.court}</span>
                )}
              </div>
              {c.start_date && (
                <div className="flex items-center gap-1 mt-3 text-xs text-[#9CA3AF]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Started {format(parseISO(c.start_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showWizard && (
        <CaseWizard onClose={() => setShowWizard(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}