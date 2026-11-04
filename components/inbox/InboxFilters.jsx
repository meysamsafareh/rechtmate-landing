import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const SOURCES = ["all", "ebox", "justonweb", "manual"];
const STATUSES = ["all", "unassigned", "assigned", "processed"];

export default function InboxFilters({ filters, onChange, totalCounts }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="p-3 border-b border-[#E8E4DC] space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
        <Input
          value={filters.search}
          onChange={e => set("search", e.target.value)}
          placeholder="Search subject, court, reference..."
          className="pl-8 h-8 text-xs"
        />
        {filters.search && (
          <button onClick={() => set("search", "")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#374151]" />
          </button>
        )}
      </div>

      {/* Source pills */}
      <div>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Source</p>
        <div className="flex flex-wrap gap-1">
          {SOURCES.map(s => (
            <button key={s} onClick={() => set("source", s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border transition-colors ${
                filters.source === s
                  ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                  : "bg-white text-[#6B7280] border-[#E8E4DC] hover:border-[#1B3A5C]"
              }`}>
              {s === "all" ? `All (${totalCounts.all})` : s === "ebox" ? `eBox (${totalCounts.ebox})` : s === "justonweb" ? `Just-on-Web (${totalCounts.justonweb})` : `Manual (${totalCounts.manual})`}
            </button>
          ))}
        </div>
      </div>

      {/* Status pills */}
      <div>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Status</p>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => set("status", s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border transition-colors ${
                filters.status === s
                  ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                  : "bg-white text-[#6B7280] border-[#E8E4DC] hover:border-[#1B3A5C]"
              }`}>
              {s === "all" ? `All` : s}
            </button>
          ))}
        </div>
      </div>

      {/* Unread toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => set("unreadOnly", !filters.unreadOnly)}
          className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${filters.unreadOnly ? "bg-[#1B3A5C]" : "bg-[#E8E4DC]"}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${filters.unreadOnly ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-xs text-[#6B7280]">Unread only</span>
      </label>
    </div>
  );
}