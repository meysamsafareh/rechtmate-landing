import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParseStatusPill } from "@/components/inbox/ParseReviewPanel";
import ParseReviewPanel from "@/components/inbox/ParseReviewPanel";

/**
 * Self-contained "Parse Document" button + inline results panel.
 * Drop this anywhere: CourtInbox detail, CaseCourtNotifications, etc.
 */
export default function ParseDocumentButton({ notificationId, caseId, onApproved }) {
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!notificationId) return;
    base44.entities.ParsedCourtData.filter({ notification_id: notificationId }).then(res => {
      if (res.length) setParsedData(res[0]);
      setLoaded(true);
    });
  }, [notificationId]);

  const handleParse = async () => {
    setParsing(true);
    // Delete existing parsed record first if re-parsing
    if (parsedData?.id) {
      await base44.entities.ParsedCourtData.delete(parsedData.id);
      setParsedData(null);
    }
    const res = await base44.functions.invoke("parseCourtDocument", { notification_id: notificationId });
    if (res.data?.data) {
      setParsedData({ ...res.data.data });
    } else {
      // Fallback: re-fetch from DB
      const latest = await base44.entities.ParsedCourtData.filter({ notification_id: notificationId });
      if (latest.length) setParsedData({ ...latest[0] });
    }
    setParsing(false);
  };

  const handleApproved = async () => {
    // Re-fetch the latest parsed record to reflect approved state + counts
    const res = await base44.entities.ParsedCourtData.filter({ notification_id: notificationId });
    if (res.length) setParsedData({ ...res[0] });
    if (onApproved) onApproved();
  };

  const handleDismiss = async () => {
    // Re-fetch after dismiss to sync state
    const res = await base44.entities.ParsedCourtData.filter({ notification_id: notificationId });
    if (res.length) setParsedData({ ...res[0] });
    else setParsedData(null);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-3">
      {/* Parse button bar */}
      <div className="flex items-center gap-3">
        {!parsedData ? (
          <Button size="sm" onClick={handleParse} disabled={parsing}
            className="bg-[#1B3A5C] hover:bg-[#2A5080] text-white gap-1.5">
            {parsing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing document...</>
              : <><Brain className="w-3.5 h-3.5" /> Parse Document</>}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <ParseStatusPill status={parsedData.review_status} />
            {parsedData.review_status !== "approved" && (
              <button onClick={handleParse} disabled={parsing}
                className="text-xs text-[#9CA3AF] hover:text-[#374151] flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Re-parse
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results panel */}
      {parsedData && (
        <ParseReviewPanel
          parsedData={parsedData}
          noCaseWarning={!caseId}
          onApproved={handleApproved}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}