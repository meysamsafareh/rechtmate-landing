import { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable destructive-action confirmation modal.
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   onConfirm    – async () => void   (called after type-check passes)
 *   title        – string (optional, default "Delete Permanently")
 *   itemLabel    – string (optional, shown in title, e.g. "court notification")
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, itemLabel }) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const canDelete = typed.trim() === "DELETE";

  const handleConfirm = async () => {
    if (!canDelete) return;
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setTyped("");
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    setTyped("");
    setDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Red header bar */}
        <div className="bg-red-600 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {title || `Delete ${itemLabel || "item"}`}
                </h2>
                <p className="text-red-200 text-xs mt-0.5">High-risk destructive action</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-2xl">✓</span>
              </div>
              <p className="text-sm font-semibold text-emerald-700">Item successfully deleted.</p>
            </div>
          ) : (
            <>
              {/* Warning text */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm text-red-800">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Warning: You are about to permanently delete this data.
                </p>
                <p className="text-red-700 leading-relaxed">
                  This action may remove the selected item from the system and could affect related case data,
                  including deadlines, timeline events, and parsed information.
                </p>
                <p className="font-semibold text-red-800">This action cannot be undone.</p>
                <p className="text-red-700">Are you sure you want to continue?</p>
              </div>

              {/* Type-to-confirm */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Type <span className="font-mono bg-[#F3F4F6] px-1.5 py-0.5 rounded text-red-600">DELETE</span> to confirm
                </label>
                <input
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  placeholder="Type DELETE to enable the button"
                  autoFocus
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 transition-colors ${
                    typed.length > 0 && !canDelete
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : canDelete
                      ? "border-emerald-400 focus:ring-emerald-200 bg-emerald-50"
                      : "border-[#E8E4DC] focus:ring-red-200"
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!canDelete || deleting}
                  className={`flex-1 gap-2 transition-all ${
                    canDelete
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-200 text-red-400 cursor-not-allowed"
                  }`}
                >
                  {deleting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                    : <><Trash2 className="w-4 h-4" /> Delete Permanently</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}