import { Mail, Globe, FileText } from "lucide-react";

const SOURCE_CONFIG = {
  ebox: {
    label: "eBox",
    icon: Mail,
    className: "bg-[#1B3A5C]/10 text-[#1B3A5C] border border-[#1B3A5C]/20",
  },
  justonweb: {
    label: "Just-on-Web",
    icon: Globe,
    className: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  manual: {
    label: "Manual",
    icon: FileText,
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

export default function SourceBadge({ source }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}