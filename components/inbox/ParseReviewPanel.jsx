import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, Clock, MapPin, FileText, Brain, Loader2, Edit3, Check, X, Pencil, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";

/* ── Confidence badge ── */
const ConfidenceBadge = ({ score }) => {
  if (score >= 0.8) return <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">High</span>;
  if (score >= 0.6) return <span className="text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded-full">Medium</span>;
  return (
    <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />Low
    </span>
  );
};

/* ── Inline editable date/text field ── */
function EditableField({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  if (editing) return (
    <span className="inline-flex items-center gap-1">
      <input value={draft} onChange={e => setDraft(e.target.value)}
        className="border border-[#1B3A5C] rounded px-1.5 py-0.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-[#1B3A5C]" />
      <button onClick={() => { onChange(draft); setEditing(false); }}>
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      </button>
      <button onClick={() => setEditing(false)}>
        <X className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </button>
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 cursor-pointer group" onClick={() => setEditing(true)}>
      <span className="underline decoration-dotted underline-offset-2">{value || "—"}</span>
      <Pencil className="w-2.5 h-2.5 text-[#C8C4BE] group-hover:text-[#6B7280] ml-0.5" />
    </span>
  );
}

/* ── Single extracted item row ── */
function ItemRow({ item, checked, onToggle, onEdit, accentClass, fields }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all ${
      checked
        ? `${accentClass.border} ${accentClass.bg} border-l-${accentClass.accent}`
        : "border-[#E8E4DC] bg-white border-l-transparent"
    }`}
    style={checked ? { borderLeftColor: accentClass.leftColor } : {}}>
      <button onClick={onToggle} className="mt-0.5 shrink-0">
        {checked
          ? <CheckCircle2 className="w-5 h-5" style={{ color: accentClass.leftColor }} />
          : <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB]" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#1A1A2E]">{item.title || item.hearing_type || "Hearing"}</span>
          <ConfidenceBadge score={item.confidence_score} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {fields.map(f => (
            <span key={f.label} className="text-xs text-[#6B7280] flex items-center gap-1">
              <f.Icon className="w-3 h-3 shrink-0" />
              {f.editable
                ? <EditableField value={f.value} onChange={v => onEdit(f.key, v)} />
                : (f.value || <span className="text-[#C4C0B8]">—</span>)}
            </span>
          ))}
        </div>
        {item.description && <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{item.description}</p>}
        {item.calculation_basis && (
          <p className="text-xs text-[#B0AAA0] mt-0.5 italic">Basis: {item.calculation_basis}</p>
        )}
      </div>
    </div>
  );
}

/* ── Section header with select-all ── */
function SectionHeader({ icon: Icon, label, count, color, allSelected, onSelectAll }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" /> {label} <span className="font-normal opacity-70">({count})</span>
      </p>
      <button onClick={onSelectAll} className="text-xs text-[#9CA3AF] hover:text-[#374151] underline decoration-dotted">
        {allSelected ? "Deselect all" : "Select all"}
      </button>
    </div>
  );
}

/* ── Parse status pill (used externally too) ── */
export function ParseStatusPill({ status }) {
  const map = {
    pending_review: { label: "Needs Review", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    approved:       { label: "Parsed ✓",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    rejected:       { label: "Rejected",      cls: "bg-red-100 text-red-600 border-red-200" },
    partial:        { label: "Partial",        cls: "bg-blue-100 text-blue-700 border-blue-200" },
  };
  const s = map[status] || map.pending_review;
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>
      <Brain className="w-3 h-3 mr-1" />{s.label}
    </span>
  );
}

/* ══════════════════════════════════════════
   Main ParseReviewPanel
══════════════════════════════════════════ */
export default function ParseReviewPanel({ parsedData, onApproved, onDismiss, noCaseWarning }) {
  const deadlines = parsedData?.extracted_deadlines ? JSON.parse(parsedData.extracted_deadlines) : [];
  const hearings  = parsedData?.extracted_hearings  ? JSON.parse(parsedData.extracted_hearings)  : [];
  const actions   = parsedData?.extracted_actions   ? JSON.parse(parsedData.extracted_actions)   : [];

  const [selDeadlines, setSelDeadlines] = useState(() => deadlines.map((_, i) => i));
  const [selHearings,  setSelHearings]  = useState(() => hearings.map((_, i) => i));
  const [selActions,   setSelActions]   = useState(() => actions.map((_, i) => i));
  const [editedDeadlines, setEditedDeadlines] = useState(deadlines);
  const [editedHearings,  setEditedHearings]  = useState(hearings);
  const [editedActions,   setEditedActions]   = useState(actions);
  const [applying, setApplying] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [showDeleteParse, setShowDeleteParse] = useState(false);

  const toggle = (sel, setSel, idx) =>
    setSel(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

  const editItem = (setArr, idx, key, value) =>
    setArr(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));

  const handleApprove = async () => {
    setApplying(true);
    await base44.functions.invoke("applyParsedCourtData", {
      parsed_id: parsedData.id,
      approved_deadlines: selDeadlines.map(i => editedDeadlines[i]),
      approved_hearings:  selHearings.map(i  => editedHearings[i]),
      approved_actions:   selActions.map(i   => editedActions[i]),
    });
    setApplying(false);
    onApproved();
  };

  const handleReject = async () => {
    await base44.entities.ParsedCourtData.update(parsedData.id, { review_status: "rejected" });
    if (onDismiss) onDismiss();
  };

  const handleDeleteParsed = async () => {
    await base44.entities.ParsedCourtData.delete(parsedData.id);
    if (onDismiss) onDismiss();
  };

  const totalApproved = selDeadlines.length + selHearings.length + selActions.length;
  const conf = parsedData?.overall_confidence || 0;
  const isApproved = parsedData?.review_status === "approved";
  const isRejected = parsedData?.review_status === "rejected";

  return (
    <div className="rounded-xl overflow-hidden border border-[#1B3A5C]/20 shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1B3A5C]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#C8A96E]" />
          <span className="text-sm font-bold text-white">Smart Parse Results</span>
          <ParseStatusPill status={parsedData?.review_status || "pending_review"} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">{conf >= 0.8 ? "🟢" : conf >= 0.6 ? "🟡" : "🔴"} {Math.round(conf * 100)}%</span>
          {parsedData?.detected_language && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-medium">{parsedData.detected_language}</span>
          )}
          <button
            onClick={() => setShowDeleteParse(true)}
            title="Delete parsed results"
            className="ml-1 flex items-center gap-1 text-xs text-red-300 hover:text-white bg-red-900/40 hover:bg-red-700/60 px-2 py-1 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-white">
        {/* ── No case warning ── */}
        {noCaseWarning && !isApproved && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Assign this message to a case before approving — results will be committed there.
          </div>
        )}

        {/* ── Summary ── */}
        {parsedData?.summary && (
          <div className="rounded-lg border border-[#E8E4DC] overflow-hidden">
            <button onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wide px-3 py-2.5 hover:bg-[#F7F6F2] w-full transition-colors">
              <FileText className="w-3.5 h-3.5" /> Summary
              {showSummary ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>
            {showSummary && (
              <p className="text-sm text-[#374151] px-3 pb-3 leading-relaxed border-t border-[#E8E4DC] pt-2.5">
                {parsedData.summary}
              </p>
            )}
          </div>
        )}

        {/* ── Approved state ── */}
        {isApproved && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 overflow-hidden">
            <div className="flex items-center gap-3 text-sm text-emerald-700 p-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Structured data successfully extracted</p>
                <p className="text-xs text-emerald-600 mt-0.5">Parsing completed — data applied to case.{parsedData.reviewed_by && <> · Approved by {parsedData.reviewed_by}</>}</p>
              </div>
            </div>
            {/* Extraction summary */}
            <div className="border-t border-emerald-200 px-3 py-2.5 flex flex-wrap gap-3">
              {deadlines.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  <Calendar className="w-3 h-3" /> {deadlines.length} deadline{deadlines.length !== 1 ? 's' : ''} created
                </span>
              )}
              {hearings.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" /> {hearings.length} hearing{hearings.length !== 1 ? 's' : ''} added
                </span>
              )}
              {actions.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] bg-[#F7F6F2] border border-[#E8E4DC] px-2.5 py-1 rounded-full">
                  <FileText className="w-3 h-3" /> {actions.length} action{actions.length !== 1 ? 's' : ''} detected
                </span>
              )}
              {deadlines.length === 0 && hearings.length === 0 && actions.length === 0 && (
                <span className="text-xs text-emerald-600">Document summarized — no procedural items to commit.</span>
              )}
            </div>
          </div>
        )}

        {/* ── Rejected state ── */}
        {isRejected && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <XCircle className="w-4 h-4 shrink-0" />
            Parse results were rejected and not applied.
          </div>
        )}

        {/* ── Review items (only if pending) ── */}
        {!isApproved && !isRejected && (
          <>
            {/* Deadlines — red */}
            {editedDeadlines.length > 0 && (
              <div>
                <SectionHeader
                  icon={Calendar} label="Deadlines" count={editedDeadlines.length}
                  color="text-red-600"
                  allSelected={selDeadlines.length === editedDeadlines.length}
                  onSelectAll={() => setSelDeadlines(
                    selDeadlines.length === editedDeadlines.length ? [] : editedDeadlines.map((_, i) => i)
                  )}
                />
                <div className="space-y-2">
                  {editedDeadlines.map((d, i) => (
                    <ItemRow key={i} item={d}
                      checked={selDeadlines.includes(i)}
                      onToggle={() => toggle(selDeadlines, setSelDeadlines, i)}
                      onEdit={(k, v) => editItem(setEditedDeadlines, i, k, v)}
                      accentClass={{ border: "border-red-200", bg: "bg-red-50/40", leftColor: "#ef4444" }}
                      fields={[
                        { label: "Date", Icon: Calendar, value: d.date, key: "date", editable: true },
                      ]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hearings — blue */}
            {editedHearings.length > 0 && (
              <div>
                <SectionHeader
                  icon={Clock} label="Hearings" count={editedHearings.length}
                  color="text-blue-600"
                  allSelected={selHearings.length === editedHearings.length}
                  onSelectAll={() => setSelHearings(
                    selHearings.length === editedHearings.length ? [] : editedHearings.map((_, i) => i)
                  )}
                />
                <div className="space-y-2">
                  {editedHearings.map((h, i) => (
                    <ItemRow key={i} item={{ ...h, title: h.hearing_type || "Hearing" }}
                      checked={selHearings.includes(i)}
                      onToggle={() => toggle(selHearings, setSelHearings, i)}
                      onEdit={(k, v) => editItem(setEditedHearings, i, k, v)}
                      accentClass={{ border: "border-blue-200", bg: "bg-blue-50/40", leftColor: "#3b82f6" }}
                      fields={[
                        { label: "Date",     Icon: Calendar, value: h.date,     key: "date",     editable: true },
                        { label: "Time",     Icon: Clock,    value: h.time,     key: "time",     editable: true },
                        { label: "Location", Icon: MapPin,   value: h.location, key: "location", editable: false },
                      ]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions — neutral */}
            {editedActions.length > 0 && (
              <div>
                <SectionHeader
                  icon={FileText} label="Required Actions" count={editedActions.length}
                  color="text-[#6B7280]"
                  allSelected={selActions.length === editedActions.length}
                  onSelectAll={() => setSelActions(
                    selActions.length === editedActions.length ? [] : editedActions.map((_, i) => i)
                  )}
                />
                <div className="space-y-2">
                  {editedActions.map((a, i) => (
                    <ItemRow key={i} item={a}
                      checked={selActions.includes(i)}
                      onToggle={() => toggle(selActions, setSelActions, i)}
                      onEdit={(k, v) => editItem(setEditedActions, i, k, v)}
                      accentClass={{ border: "border-[#E8E4DC]", bg: "bg-[#F7F6F2]", leftColor: "#9CA3AF" }}
                      fields={[
                        { label: "Due", Icon: Calendar, value: a.related_deadline, key: "related_deadline", editable: true },
                      ]}
                    />
                  ))}
                </div>
              </div>
            )}

            {editedDeadlines.length === 0 && editedHearings.length === 0 && editedActions.length === 0 && (
              <div className="text-center py-6 space-y-1">
                <p className="text-sm text-[#9CA3AF]">No procedural items extracted.</p>
                <p className="text-xs text-[#C4C0B8]">The document may contain only narrative content — review the summary above.</p>
              </div>
            )}

            {/* ── Action bar ── */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#E8E4DC]">
              <Button onClick={handleApprove}
                disabled={applying || totalApproved === 0 || !!noCaseWarning}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1">
                {applying
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Committing...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Approve & Commit {totalApproved > 0 ? `(${totalApproved})` : ""}</>}
              </Button>
              <Button variant="outline" onClick={handleReject} disabled={applying}
                className="text-red-500 border-red-200 hover:bg-red-50 gap-1.5">
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteParse}
        onClose={() => setShowDeleteParse(false)}
        onConfirm={handleDeleteParsed}
        itemLabel="parsed results"
      />
    </div>
  );
}