import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, Check, X, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CaseNotes({ caseId, caseTitle }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });

  const load = async () => {
    const data = await base44.entities.Note.filter({ case_id: caseId }, "-updated_date", 100);
    setNotes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const setF = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await base44.entities.Note.create({ ...form, case_id: caseId, case_title: caseTitle });
    setForm({ title: "", content: "" });
    setShowAdd(false);
    load();
  };

  const handleUpdate = async (note) => {
    await base44.entities.Note.update(note.id, note);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Note.delete(id);
    load();
  };

  const updateNote = (id, field, val) => setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n));

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1A1A2E]">Notes</h2>
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Note
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#C8A96E]/40 p-5 shadow-sm">
          <Input placeholder="Note title" value={form.title} onChange={e => setF("title", e.target.value)} className="border-[#E8E4DC] mb-3" />
          <Textarea placeholder="Write your notes here — facts, strategy, observations..." value={form.content} onChange={e => setF("content", e.target.value)} className="border-[#E8E4DC] mb-3" rows={5} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="text-[#6B7280]"><X className="w-4 h-4" /></Button>
            <Button size="sm" onClick={handleAdd} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white"><Save className="w-3.5 h-3.5 mr-1" />Save Note</Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showAdd ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E4DC]">
          <BookOpen className="w-10 h-10 text-[#E8E4DC] mx-auto mb-3" />
          <p className="text-[#6B7280] font-medium">No notes yet</p>
          <p className="text-sm text-[#9CA3AF]">Record facts, strategy, and procedural observations</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {notes.map(note => {
            const isEditing = editingId === note.id;
            return (
              <div key={note.id} className="bg-white rounded-xl border border-[#E8E4DC] p-5 hover:border-[#C8A96E]/40 transition-colors group">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input value={note.title} onChange={e => updateNote(note.id, "title", e.target.value)} className="border-[#E8E4DC] font-medium" />
                    <Textarea value={note.content || ""} onChange={e => updateNote(note.id, "content", e.target.value)} className="border-[#E8E4DC] text-sm" rows={6} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                      <Button size="sm" onClick={() => handleUpdate(note)} className="bg-[#1B3A5C] text-white"><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-[#1A1A2E] text-sm leading-snug">{note.title}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <button onClick={() => setEditingId(note.id)} className="p-1.5 text-[#9CA3AF] hover:text-[#1B3A5C] rounded-md hover:bg-[#F7F6F2]"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(note.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 rounded-md hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {note.content && <p className="text-sm text-[#6B7280] whitespace-pre-wrap line-clamp-6">{note.content}</p>}
                    <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                      <p className="text-xs text-[#9CA3AF]">
                        {note.updated_date ? `Updated ${format(new Date(note.updated_date), "MMM d, yyyy")}` : note.created_date ? `Created ${format(new Date(note.created_date), "MMM d, yyyy")}` : ""}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}