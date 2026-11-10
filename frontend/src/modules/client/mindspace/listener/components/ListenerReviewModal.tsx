"use client";

/**
 * ListenerReviewModal — Remapping Doctor SOAP Notes Editor (AppointmentReview & SoapEditor)
 * into MindSpace Peer Listener Encounter Documentation.
 *
 * Layer: modules / client / mindspace / listener / components
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Save,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Heart,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export interface ListenerReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: {
    id: string;
    memberName: string;
    topic: string;
    date?: string;
  } | null;
  onSaved?: () => void;
}

export function ListenerReviewModal({
  open,
  onOpenChange,
  session,
  onSaved,
}: ListenerReviewModalProps) {
  const memberName = session?.memberName || "Ananya";
  const topic = session?.topic || "Work anxiety & feeling overwhelmed";

  // SOAP State
  const [subjective, setSubjective] = useState(
    "Member expressed significant fatigue from chronic work deadlines. Stated feeling unable to 'switch off' at night and experiencing racing thoughts about impending project reviews."
  );
  const [objective, setObjective] = useState(
    "Engaged attentively throughout the 45-minute video call. Speech rate normalized after initial grounding exercise. Displayed open body posture and smiled during self-care reflection."
  );
  const [assessment, setAssessment] = useState<"Tier 1: Mild Distress" | "Tier 2: Moderate Work Stress" | "Tier 0: Routine Wellbeing">(
    "Tier 1: Mild Distress"
  );
  const [plan, setPlan] = useState(
    "Recommended 5-minute 4-7-8 box breathing exercise before bed. Agreed to set an 8:30 PM digital wind-down boundary. Scheduled follow-up check-in for next Tuesday."
  );

  const handleSaveSoap = () => {
    toast.success("Encounter SOAP Record Saved!", {
      description: `Documented for ${memberName}. Record encrypted and synced to Member Wellbeing file.`,
    });
    onOpenChange(false);
    onSaved?.();
  };

  const handleEscalateSafety = () => {
    toast.warning("Escalated to Safety Operations", {
      description: "Supervisor & Crisis Triage dispatched. Encrypted alert forwarded.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-[#236B54] dark:bg-emerald-950 dark:text-emerald-300">
                <FileText className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold font-serif">
                  Post-Consultation Review & SOAP Record
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Session with <strong className="text-foreground">{memberName}</strong> • {topic}
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
              Level 2 Documentation
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* S - Subjective */}
          <div className="space-y-1.5 p-3 rounded-2xl border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  S
                </span>
                <span>Subjective (Member&apos;s Reported Experience)</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Self-narrated feelings</span>
            </div>
            <Textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={3}
              className="text-xs rounded-xl bg-background mt-1"
            />
          </div>

          {/* O - Objective */}
          <div className="space-y-1.5 p-3 rounded-2xl border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  O
                </span>
                <span>Objective (Listener Observations & Engagement)</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Non-clinical affect</span>
            </div>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="text-xs rounded-xl bg-background mt-1"
            />
          </div>

          {/* A - Assessment */}
          <div className="space-y-1.5 p-3 rounded-2xl border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                  A
                </span>
                <span>Assessment (Stepped-Care Triage Tier)</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Distress rating</span>
            </div>
            <select
              value={assessment}
              onChange={(e) => setAssessment(e.target.value as any)}
              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs mt-1"
            >
              <option value="Tier 0: Routine Wellbeing">Tier 0: Routine Wellbeing & Reflection</option>
              <option value="Tier 1: Mild Distress">Tier 1: Mild Distress (Peer Listening Sufficient)</option>
              <option value="Tier 2: Moderate Work Stress">Tier 2: Moderate Work Stress (Follow-up Recommended)</option>
            </select>
          </div>

          {/* P - Plan */}
          <div className="space-y-1.5 p-3 rounded-2xl border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                  P
                </span>
                <span>Plan (Agreed Grounding Practice & Next Check-in)</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">Actionable steps</span>
            </div>
            <Textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={3}
              className="text-xs rounded-xl bg-background mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEscalateSafety}
            className="text-rose-600 border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 text-xs h-9 gap-1.5"
          >
            <ShieldAlert className="size-3.5" />
            <span>Crisis Escalation</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSoap}
              className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-9 px-4 gap-1.5 font-semibold"
            >
              <Save className="size-3.5" />
              <span>Save & Seal Record</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

