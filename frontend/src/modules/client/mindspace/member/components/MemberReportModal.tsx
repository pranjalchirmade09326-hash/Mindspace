"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Heart,
  Printer,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

export interface MemberReportModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  session?: {
    id: string;
    date: string;
    listenerName: string;
    note?: string;
  } | null;
}

export function MemberReportModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  session,
}: MemberReportModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };
  const listenerName = session?.listenerName || "Aarav Sharma (Verified Peer Listener)";
  const sessionDate = session?.date
    ? new Date(session.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "November 9, 2026, 06:00 PM";

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Wellbeing Summary Downloaded", {
      description: "Encrypted PDF report saved to your downloads.",
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              MindSpace Peer Support & Wellbeing Reflection Report
            </span>
            <Badge variant="outline" className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-300">
              Verified Session
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold font-serif text-slate-950 dark:text-foreground">
            Personal Care Reflection & Session Summary
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Session ID: <span className="font-mono">{session?.id || "MS-SESS-9082"}</span> • Date: {sessionDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[11px]">Member ID:</span>
              <span className="font-semibold text-foreground">MEM-40912 (You)</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Peer Listener:</span>
              <span className="font-semibold text-foreground">{listenerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Safety State:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> Cleared (Tier 1)
              </span>
            </div>
          </div>

          {/* Section 1: Intake & Mood Screening */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="size-4 text-emerald-600" />
                Intake Assessment & Screening Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl border border-border/50 text-center">
                  <span className="text-muted-foreground text-[10px] block">Primary Sentiment</span>
                  <span className="text-sm font-bold text-foreground">Reflective / Seeking Calm</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border/50 text-center">
                  <span className="text-muted-foreground text-[10px] block">Emotional Energy</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Moderate (6/10)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border/50 text-center">
                  <span className="text-muted-foreground text-[10px] block">Triage Level</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Stepped-Care Tier 1</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-foreground block mb-1">Focus Area & Concerns:</span>
                <p className="text-muted-foreground leading-relaxed">
                  Member reported situational stress regarding work-life balance, evening mental rumination, and desire for somatic grounding techniques.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Listener Reflection Notes */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-teal-600" />
                Peer Reflection & Supportive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div>
                <span className="font-bold text-foreground">Member Focus:</span>
                <p className="text-muted-foreground mt-0.5">
                  Member felt validated sharing daily pressures out loud. Expressed appreciation for empathetic, non-judgmental active listening.
                </p>
              </div>
              <div>
                <span className="font-bold text-foreground">Grounding Tools Explored:</span>
                <p className="text-muted-foreground mt-0.5">
                  Engaged in 4-7-8 somatic breathing exercises and discussed establishing gentle evening boundaries around work devices.
                </p>
              </div>
              <div>
                <span className="font-bold text-foreground">Agreed Self-Care Plan:</span>
                <p className="text-muted-foreground mt-0.5">
                  Member aims to take a 10-minute mindful outdoor walk tomorrow and log an evening mood check-in.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4 border-t border-border/40 mt-3 flex sm:justify-between items-center gap-2">
          <p className="text-[11px] text-muted-foreground">
            Confidential MindSpace Peer Support & Non-Clinical Reflection.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl text-xs gap-1.5">
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="rounded-xl text-xs bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 font-semibold"
            >
              <Download className="size-3.5" />
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
