import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plus, Edit2, Trash2, Check, X, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function CaseDeadlines({ caseId, caseTitle }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", deadline_date: "", description: "" });

  const load = async () => {
    const data = await base44.entities.Deadline.filter({ case_id: caseId }, "deadline_date", 100);
    setDeadlines(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const setF = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleAdd = async () => {
    if (!form.title.trim() || !form.deadline_date) return;
    await base44.entities.Deadline.create({ ...form, case_id: caseId, case_title: caseTitle, status: "pending" });
    await base44.entities.Notification.create({
      message: `New deadline: "${form.title}"`,
      case_id: caseId, case_title: caseTitle, type: "deadline", is_read: false
    });
    setForm({ title: "", deadline_date: "", description: "" });
    setShowAdd(false);
    load();
  };

  const toggleStatus = async (d) => {
    const newStatus = d.status === "completed" ? "pending" : "completed";
    await base44.entities.Deadline.update(d.id, { status: newStatus });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Deadline.delete(id);
    load();
  };

  const updateDeadline = (id, field, val) => setDeadlines(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));

  const handleUpdate = async (id) => {
    const d = deadlines.find(x => x.id === id);
    await base44.entities.Deadline.update(id, d);
    setEditingId(null);
    load();
  };

  const getUrgency = (d) => {
    if (d.status === "completed") return { label: "Completed", cls: "bg-emerald-50 text-emerald-700" };
    const days = differenceInDays(parseISO(d.deadline_date), new Date());
    if (days < 0) return { label: "Overdue", cls: "bg-red-50 text-red-700" };
    if (days === 0) return { label: "Today", cls: "bg-red-50 text-red-700" };
    if (days <= 3) return { label: `${days}d left`, cls: "bg-orange-50 text-orange-700" };
    if (days <= 7) return { label: `${days}d left`, cls: "bg-yellow-50 text-yellow-700" };
    return { label: `${days}d left`, cls: "bg-blue-50 text-blue-700" };
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  const pending = deadlines.filter(d => d.status !== "completed");
  const completed = deadlines.filter(d => d.status === "completed");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1A1A2E]">Deadlines <span className="text-[#9CA3AF] font-normal text-sm">({pending.length} pending)</span></h2>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Deadline
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#C8A96E]/40 p-5 shadow-sm">
          <p className="font-medium text-sm text-[#1A1A2E] mb-4">New Deadline</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Input placeholder="Deadline title" value={form.title} onChange={e => setF("title", e.target.value)} className="border-[#E8E4DC]" />
            <Input type="date" value={form.deadline_date} onChange={e => setF("deadline_date", e.target.value)} className="border-[#E8E4DC]" />
          </div>
          <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setF("description", e.target.value)} className="border-[#E8E4DC] mb-3" rows={2} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="text-[#6B7280]"><X className="w-4 h-4" /></Button>
            <Button size="sm" onClick={handleAdd} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white"><Check className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
        </div>
      )}

      {deadlines.length === 0 && !showAdd ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E4DC]">
          <Clock className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">No deadlines yet</p>
          <p className="text-sm text-[#9CA3AF]">Add deadlines to track procedural obligations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...pending, ...completed].map(d => {
            const urgency = getUrgency(d);
            const isEditing = editingId === d.id;
            return (
              <div key={d.id} className={`bg-white rounded-xl border p-4 transition-all group ${d.status === "completed" ? "border-[#E8E4DC] opacity-70" : "border-[#E8E4DC] hover:border-[#C8A96E]/40"}`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input value={d.title} onChange={e => updateDeadline(d.id, "title", e.target.value)} className="border-[#E8E4DC] text-sm" />
                      <Input type="date" value={d.deadline_date} onChange={e => updateDeadline(d.id, "deadline_date", e.target.value)} className="border-[#E8E4DC] text-sm" />
                    </div>
                    <Textarea value={d.description || ""} onChange={e => updateDeadline(d.id, "description", e.target.value)} className="border-[#E8E4DC] text-sm" rows={2} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                      <Button size="sm" onClick={() => handleUpdate(d.id)} className="bg-[#1B3A5C] text-white"><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleStatus(d)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${d.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-[#D1D5DB] hover:border-[#1B3A5C]"}`}>
                      {d.status === "completed" && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${d.status === "completed" ? "line-through text-[#9CA3AF]" : "text-[#1A1A2E]"}`}>{d.title}</p>
                        <Badge className={`text-xs ${urgency.cls}`}>{urgency.label}</Badge>
                      </div>
                      {d.deadline_date && <p className="text-xs text-[#9CA3AF] mt-0.5">{format(parseISO(d.deadline_date), "MMMM d, yyyy")}</p>}
                      {d.description && <p className="text-sm text-[#6B7280] mt-1">{d.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditingId(d.id)} className="p-1.5 text-[#9CA3AF] hover:text-[#1B3A5C] rounded-md hover:bg-[#F7F6F2]"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}