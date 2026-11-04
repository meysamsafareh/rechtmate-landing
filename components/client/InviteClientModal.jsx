import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteClientModal({ caseId, caseTitle, onClose, onInvited }) {
  const [step, setStep] = useState("form"); // form | success
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_email: "", client_role: "" });

  const handleInvite = async () => {
    if (!form.client_name || !form.client_email) return;
    setLoading(true);

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const url = `${window.location.origin}/ClientPortal?token=${token}`;

    await base44.entities.ClientPortalAccess.create({
      token,
      case_id: caseId,
      case_title: caseTitle,
      client_name: form.client_name,
      client_email: form.client_email,
      client_role: form.client_role || "",
      expires_at: expiresAt,
      is_active: true,
      perm_timeline: false,
      perm_documents: false,
      perm_deadlines: false,
      perm_messaging: false,
    });

    await base44.integrations.Core.SendEmail({
      to: form.client_email,
      subject: `You have been invited to your case portal — ${caseTitle}`,
      body: `Dear ${form.client_name},\n\nYou have been invited to access your case portal on RechtMate.\n\nCase: ${caseTitle}\n\nClick the link below to access your case updates:\n\n${url}\n\n⚠️ This link expires in 48 hours.\n\nDo not share this link with others. If you have any questions, please contact your lawyer directly.\n\nRechtMate Client Portal`,
    });

    setPortalUrl(url);
    setStep("success");
    setLoading(false);
    if (onInvited) onInvited();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {step === "form" && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-[#E8E4DC]">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Invite Client</h2>
                <p className="text-sm text-[#6B7280] mt-0.5">Generate a secure 48-hour portal link</p>
              </div>
              <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A1A2E]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#F7F6F2] rounded-lg text-sm text-[#6B7280]">
                <span className="font-medium text-[#1A1A2E]">Case: </span>{caseTitle}
              </div>

              <div>
                <Label className="text-sm font-medium text-[#374151] block mb-1.5">Client Name *</Label>
                <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                  placeholder="e.g. Jean Dupont" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#374151] block mb-1.5">Client Email *</Label>
                <Input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                  placeholder="client@example.com" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#374151] block mb-1.5">Client Role (optional)</Label>
                <Input value={form.client_role} onChange={e => setForm(f => ({ ...f, client_role: e.target.value }))}
                  placeholder="e.g. Plaintiff, Defendant" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                After inviting, configure access permissions from the Client Access tab. All permissions default to OFF.
              </div>
            </div>

            <div className="p-6 border-t border-[#E8E4DC] flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!form.client_name || !form.client_email || loading}
                className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white">
                {loading ? "Sending invitation…" : "Send Invitation"}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">Invitation Sent</h3>
            <p className="text-sm text-[#6B7280] mb-5">
              An email has been sent to {form.client_email}. The link expires in 48 hours.
            </p>

            <div className="bg-[#F7F6F2] rounded-xl p-4 mb-5 text-left">
              <p className="text-xs text-[#9CA3AF] mb-1.5 font-medium uppercase tracking-wide">Portal Link</p>
              <p className="text-xs text-[#1A1A2E] break-all font-mono mb-3">{portalUrl}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 text-xs flex-1">
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(portalUrl, "_blank")} className="gap-1.5 text-xs">
                  <ExternalLink className="w-3 h-3" /> Preview
                </Button>
              </div>
            </div>

            <p className="text-xs text-[#9CA3AF] mb-5">
              ⚙️ Remember to configure access permissions for this client in the <strong>Clients</strong> tab.
            </p>
            <Button onClick={onClose} className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white w-full">Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}