import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Upload, FileText, Trash2, Download, Edit2, Check, X, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

export default function CaseDocuments({ caseId, caseTitle }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const fileRef = useRef();

  const load = async () => {
    const data = await base44.entities.Document.filter({ case_id: caseId }, "-created_date", 100);
    setDocuments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [caseId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({
      name: file.name,
      case_id: caseId,
      case_title: caseTitle,
      file_url,
      file_type: file.type,
      file_size: file.size,
    });
    setUploading(false);
    load();
    e.target.value = "";
  };

  const handleRename = async (doc) => {
    if (!editName.trim()) return;
    await base44.entities.Document.update(doc.id, { name: editName });
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Document.delete(id);
    load();
  };

  const getFileIcon = (type) => {
    if (!type) return "📄";
    if (type.includes("pdf")) return "📕";
    if (type.includes("word") || type.includes("docx")) return "📘";
    if (type.includes("image")) return "🖼️";
    if (type.includes("sheet") || type.includes("excel")) return "📗";
    return "📄";
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#1B3A5C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#1A1A2E]">Documents <span className="text-[#9CA3AF] font-normal text-sm">({documents.length})</span></h2>
        <div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5" disabled={uploading}>
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload
          </Button>
        </div>
      </div>

      {/* Drop zone hint */}
      <div
        className="border-2 border-dashed border-[#E8E4DC] rounded-xl p-8 text-center cursor-pointer hover:border-[#C8A96E] transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
        <p className="text-sm text-[#9CA3AF]">Click to upload or drag and drop</p>
        <p className="text-xs text-[#D1D5DB] mt-1">PDF, Word, Excel, Images and more</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-[#E8E4DC]">
          <FileText className="w-10 h-10 text-[#E8E4DC] mx-auto mb-2" />
          <p className="text-[#9CA3AF] text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-[#E8E4DC] p-4 flex items-center gap-3 hover:border-[#C8A96E]/40 transition-colors group">
              <div className="w-10 h-10 bg-[#F7F6F2] rounded-lg flex items-center justify-center shrink-0 text-xl">
                {getFileIcon(doc.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === doc.id ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="border-[#E8E4DC] text-sm h-8 flex-1" autoFocus onKeyDown={e => e.key === "Enter" && handleRename(doc)} />
                    <button onClick={() => handleRename(doc)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-[#9CA3AF] hover:bg-[#F7F6F2] rounded-md"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">{doc.name}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {doc.created_date && format(new Date(doc.created_date), "MMM d, yyyy")}
                      {doc.file_size && ` · ${formatBytes(doc.file_size)}`}
                    </p>
                  </>
                )}
              </div>
              {editingId !== doc.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={async () => {
                      await base44.entities.Document.update(doc.id, { shared_with_client: !doc.shared_with_client });
                      load();
                    }}
                    title={doc.shared_with_client ? "Shared with client — click to make internal" : "Internal — click to share with client"}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      doc.shared_with_client
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-[#F7F6F2] text-[#9CA3AF] hover:bg-[#EEE] hover:text-[#6B7280]"
                    }`}>
                    {doc.shared_with_client ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {doc.shared_with_client ? "Shared" : "Internal"}
                  </button>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-[#9CA3AF] hover:text-[#1B3A5C] rounded-md hover:bg-[#F7F6F2]">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => { setEditingId(doc.id); setEditName(doc.name); }}
                    className="p-1.5 text-[#9CA3AF] hover:text-[#1B3A5C] rounded-md hover:bg-[#F7F6F2]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 rounded-md hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}