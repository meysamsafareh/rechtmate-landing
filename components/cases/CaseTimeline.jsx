import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import {
  Plus, Edit2, Trash2, Check, X, Calendar, FileText,
  Scale, Gavel, Clock, BookOpen, FileUp, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_TYPES = [
  { value: "case_creation", label: "Case Created", icon: Scale, color: "bg-[#1B3A5C]" },
  { value: "procedural_step", label: "Procedural Step", icon: Circle, color: "bg-blue-500" },
  { value: "filing", label: "Filing", icon: FileUp, color: "bg-purple-500" },
  { value: "hearing", label: "Hearing", icon: Gavel, color: "bg-orange-500" },
  { value: "deadline", label: "Deadline", icon: Clock, color: "bg-red-500" },
  { value: "note", label: "Note", icon: BookOpen, color: "bg-teal-500" },
  { value: "document", label: "Document", icon: FileText, color: "bg-gray-500" },
  { value: "other", label: "Other", icon: Calendar, color: "bg-[#C8A96E]" },
];

const getTypeInfo = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

export default function CaseTimeline({ caseId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", event_type: "procedural_step", event_date: format(new Date(), "yyyy-MM-dd"), description: "" });

  const load = async () => {
    const data = await base44.entities.TimelineEvent.filter({ case_id: caseId }, "-event_date", 100);
    setEvents(data.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const setF = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await base44.entities.TimelineEvent.create({ ...form, case_id: caseId });
    setForm({ title: "", event_type: "procedural_step", event_date: format(new Date(), "yyyy-MM-dd"), description: "" });
    setShowAdd(false);
    load();
  };

  const handleUpdate = async (id) => {
    const ev = events.find(e => e.id === id);
    await base44.entities.TimelineEvent.update(id, ev);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.TimelineEvent.delete(id);
    load();
  };

  const updateEvent = (id, field, val) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1A1A2E]">Procedural Timeline</h2>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Event
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#C8A96E]/40 p-5 shadow-sm">
          <p className="font-medium text-[#1A1A2E] mb-4 text-sm">New Timeline Event</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Input placeholder="Event title" value={form.title} onChange={e => setF("title", e.target.value)} className="border-[#E8E4DC]" />
            <Input type="date" value={form.event_date} onChange={e => setF("event_date", e.target.value)} className="border-[#E8E4DC]" />
          </div>
          <div className="mb-3">
            <Select value={form.event_type} onValueChange={v => setF("event_type", v)}>
              <SelectTrigger className="border-[#E8E4DC]"><SelectValue /></SelectTrigger>
              <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setF("description", e.target.value)} className="border-[#E8E4DC] mb-3" rows={2} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="text-[#6B7280]"><X className="w-4 h-4" /></Button>
            <Button size="sm" onClick={handleAdd} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white"><Check className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E4DC]">
          <Calendar className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">No timeline events yet</p>
          <p className="text-sm text-[#9CA3AF]">Add procedural steps, hearings, and filings</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[#E8E4DC]" />
          <div className="space-y-2">
            {events.map((event, idx) => {
              const typeInfo = getTypeInfo(event.event_type);
              const isEditing = editingId === event.id;
              const IconComp = typeInfo.icon;
              return (
                <div key={event.id} className="relative flex gap-4 pl-12">
                  <div className={`absolute left-2 top-4 w-6 h-6 rounded-full flex items-center justify-center ${typeInfo.color} shrink-0 z-10`}>
                    <IconComp className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-[#E8E4DC] p-4 hover:border-[#C8A96E]/40 transition-colors group">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input value={event.title} onChange={e => updateEvent(event.id, "title", e.target.value)} className="border-[#E8E4DC] text-sm" />
                          <Input type="date" value={event.event_date} onChange={e => updateEvent(event.id, "event_date", e.target.value)} className="border-[#E8E4DC] text-sm" />
                        </div>
                        <Select value={event.event_type} onValueChange={v => updateEvent(event.id, "event_type", v)}>
                          <SelectTrigger className="border-[#E8E4DC] text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Textarea value={event.description || ""} onChange={e => updateEvent(event.id, "description", e.target.value)} className="border-[#E8E4DC] text-sm" rows={2} />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                          <Button size="sm" onClick={() => handleUpdate(event.id)} className="bg-[#1B3A5C] text-white"><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-[#1A1A2E] text-sm">{event.title}</p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{format(parseISO(event.event_date), "MMMM d, yyyy")} · <span className="capitalize">{typeInfo.label}</span></p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingId(event.id)} className="p-1.5 text-[#9CA3AF] hover:text-[#1B3A5C] rounded-md hover:bg-[#F7F6F2]">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(event.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 rounded-md hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {event.description && <p className="text-sm text-[#6B7280] mt-2">{event.description}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}