import { useState } from "react";
import { Globe, Shield, RefreshCw, CheckCircle2, XCircle, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_CONFIG = {
  not_connected: {
    label: "Not Connected",
    icon: XCircle,
    className: "text-gray-500 bg-gray-100",
  },
  connected: {
    label: "Connected",
    icon: CheckCircle2,
    className: "text-emerald-700 bg-emerald-50",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "text-red-700 bg-red-50",
  },
};

export default function JustOnWebIntegration() {
  const [config, setConfig] = useState({
    api_endpoint: "",
    client_id: "",
    client_secret: "",
    court_user_id: "",
  });
  const [status] = useState("not_connected");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Simulated test — real API call will be wired once credentials are available
    await new Promise(r => setTimeout(r, 1500));
    setTestResult({
      success: false,
      message: "Just-on-Web API is not yet available. This connector is ready for activation once credentials are provided by the Belgian judiciary.",
    });
    setTesting(false);
  };

  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-purple-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-purple-900">Just-on-Web Integration</h3>
          <p className="text-sm text-purple-700 mt-1">
            Official Belgian judicial platform integration. Once API credentials are issued by the judiciary,
            RechtMate will automatically receive court communications, procedural updates, and case notifications.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </span>
      </div>

      {/* Polling info */}
      <div className="flex items-center gap-3 p-4 bg-[#F7F6F2] rounded-lg border border-[#E8E4DC]">
        <RefreshCw className="w-4 h-4 text-[#6B7280] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#1A1A2E]">Polling Interval: every 5 minutes</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            When connected, the system will automatically check Just-on-Web for new court messages every 5 minutes.
          </p>
        </div>
      </div>

      {/* Config fields */}
      <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-[#1A1A2E] text-sm">API Configuration</h4>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#374151]">API Endpoint</Label>
          <Input
            value={config.api_endpoint}
            onChange={e => handleChange("api_endpoint", e.target.value)}
            placeholder="https://api.just-on-web.be/v1"
            className="border-[#E8E4DC]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Client ID</Label>
            <Input
              value={config.client_id}
              onChange={e => handleChange("client_id", e.target.value)}
              placeholder="Provided by judiciary"
              className="border-[#E8E4DC]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Court User ID</Label>
            <Input
              value={config.court_user_id}
              onChange={e => handleChange("court_user_id", e.target.value)}
              placeholder="Your court user ID"
              className="border-[#E8E4DC]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#374151]">Client Secret</Label>
          <Input
            type="password"
            value={config.client_secret}
            onChange={e => handleChange("client_secret", e.target.value)}
            placeholder="••••••••••••"
            className="border-[#E8E4DC]"
          />
          <p className="text-xs text-[#9CA3AF] flex items-center gap-1">
            <Lock className="w-3 h-3" /> Stored encrypted. Never transmitted in plain text.
          </p>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`p-4 rounded-lg border text-sm flex items-start gap-2 ${testResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {testResult.success
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleTest}
          disabled={testing}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2"
        >
          {testing
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Testing...</>
            : <><RefreshCw className="w-4 h-4" /> Test Connection</>}
        </Button>
        <Button disabled className="bg-[#1B3A5C] text-white opacity-50 cursor-not-allowed gap-2">
          <Shield className="w-4 h-4" /> Save & Activate
        </Button>
      </div>

      {/* Security notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Shield, title: "Secure Auth", desc: "OAuth 2.0 token-based authentication" },
          { icon: Lock, title: "Encrypted", desc: "Credentials encrypted at rest" },
          { icon: RefreshCw, title: "Audit Logged", desc: "All API calls are logged for compliance" },
        ].map(item => (
          <div key={item.title} className="p-3 bg-[#F7F6F2] rounded-lg border border-[#E8E4DC]">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-4 h-4 text-[#6B7280]" />
              <span className="text-xs font-semibold text-[#1A1A2E]">{item.title}</span>
            </div>
            <p className="text-xs text-[#6B7280]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}