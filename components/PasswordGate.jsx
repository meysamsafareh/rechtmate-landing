import { useState } from "react";
import { Scale, Lock, ArrowLeft } from "lucide-react";

const CORRECT_PASSWORD = "151520";
const STORAGE_KEY = "rm_preview_access";

export default function PasswordGate({ children }) {
  const [granted, setGranted] = useState(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [input, setInput] = useState("");
  const [denied, setDenied] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      try { sessionStorage.setItem(STORAGE_KEY, "true"); } catch {}
      setGranted(true);
    } else {
      setDenied(true);
    }
  };

  const handleRetry = () => {
    setDenied(false);
    setInput("");
  };

  if (granted) return children;

  return (
    <div className="min-h-screen bg-[#1B3A5C] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b07855b00f9aeb57127e88/8a1eb54cb_LogoNahieSite.png"
            alt="RechtMate"
            className="h-10 w-10 object-contain rounded-xl"
          />
          <span className="text-white font-semibold text-2xl tracking-tight">RechtMate</span>
        </div>

        {denied ? (
          /* Denied State */
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-[#1B3A5C] mb-3">Access Restricted</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              We apologize, but RechtMate is currently in a private preview stage and is not yet publicly available.
              <br /><br />
              If you are interested in the product, please check back later when the public launch is announced.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B3A5C] text-white text-sm font-semibold rounded-lg hover:bg-[#2A5080] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Homepage
            </button>
          </div>
        ) : (
          /* Password Gate */
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-7">
              <div className="w-12 h-12 rounded-full bg-[#1B3A5C]/8 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-[#1B3A5C]" />
              </div>
              <h1 className="text-xl font-bold text-[#1B3A5C] mb-1">RechtMate – Private Preview</h1>
              <p className="text-gray-500 text-sm">This platform is currently in a private testing phase.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Enter Access Password
                </label>
                <input
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#C8A96E] hover:bg-[#B8955A] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Access Preview
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} RechtMate — Internal use only
        </p>
      </div>
    </div>
  );
}