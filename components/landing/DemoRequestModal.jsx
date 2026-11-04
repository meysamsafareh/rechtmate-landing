import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle, Scale } from "lucide-react";

const POSITIONS = ["Lawyer", "Partner", "Associate", "Other"];
const FIRM_SIZES = ["1", "2–5", "6–15", "16–30", "30+"];

export default function DemoRequestModal({ onClose }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", law_firm_name: "",
    position: "", firm_size: "", practice_area: "", message: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSubmitting(true);
    await base44.entities.DemoRequest.create(form);
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-[#1B3A5C] rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#C8A96E] flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-base">Request a Demo</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-8 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Request Received!</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Thank you. Our team will contact you to schedule a demo of RechtMate.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1B3A5C] text-white font-semibold rounded-xl hover:bg-[#2A5080] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div>
              <p className="text-sm text-gray-500">Fill in your details and we'll get back to you within one business day.</p>
            </div>

            {/* Personal */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#1B3A5C] uppercase tracking-widest">Personal Information</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors ${errors.full_name ? "border-red-400" : "border-gray-200"}`}
                  placeholder="e.g. Jan De Smet" />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors ${errors.email ? "border-red-400" : "border-gray-200"}`}
                  placeholder="jan@lawfirm.be" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors"
                  placeholder="+32 ..." />
              </div>
            </div>

            {/* Professional */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#1B3A5C] uppercase tracking-widest">Professional Information</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Law Firm Name</label>
                <input value={form.law_firm_name} onChange={e => set("law_firm_name", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors"
                  placeholder="De Smet & Partners" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select value={form.position} onChange={e => set("position", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors bg-white">
                    <option value="">Select...</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lawyers in Firm</label>
                  <select value={form.firm_size} onChange={e => set("firm_size", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors bg-white">
                    <option value="">Select...</option>
                    {FIRM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#1B3A5C] uppercase tracking-widest">Optional</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practice Area</label>
                <input value={form.practice_area} onChange={e => set("practice_area", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors"
                  placeholder="e.g. Commercial litigation, Family law..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message / Details</label>
                <textarea value={form.message} onChange={e => set("message", e.target.value)} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B3A5C] transition-colors resize-none"
                  placeholder="Tell us about your needs..." />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-[#C8A96E] hover:bg-[#B8955A] disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-sm">
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}