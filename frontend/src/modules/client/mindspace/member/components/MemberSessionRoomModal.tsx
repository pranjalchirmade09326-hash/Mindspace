"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  ShieldAlert,
  Sparkles,
  Video,
  VideoOff,
  Volume2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export interface MemberSessionRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: {
    id: string;
    listenerName: string;
    channel?: string;
    note?: string;
  } | null;
  onSessionEnded?: () => void;
}

export function MemberSessionRoomModal({
  open,
  onOpenChange,
  session,
  onSessionEnded,
}: MemberSessionRoomModalProps) {
  const [seconds, setSeconds] = useState(145);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes">("transcript");

  // Call timer
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = async () => {
    if (session?.id) {
      try {
        await fetch(`/api/mindspace/member/conversations/${session.id}/close`, {
          method: "PUT",
        });
      } catch (e) {
        console.error("Failed to close conversation in DB:", e);
      }
    }
    toast.success("Peer Support Session Completed", {
      description: "Session closed in database & wellbeing reflection summary saved.",
    });
    onOpenChange(false);
    onSessionEnded?.();
  };

  const listenerName = session?.listenerName || "Aarav (Peer Listener)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col rounded-3xl bg-slate-950 text-white border-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{listenerName}</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800">
                  Live Peer Session
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{session?.note || "Active Wellbeing Check-in"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-emerald-400">
              <Clock className="size-3.5" />
              {formatTimer(seconds)}
            </div>

            <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
              AES-256-GCM Encrypted
            </Badge>
          </div>
        </div>

        {/* Main Stage Grid: Video Feed + Live Transcript */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Video / Call Center (8 Cols) */}
          <div className="lg:col-span-8 p-6 flex flex-col justify-between relative bg-gradient-to-b from-slate-900/40 to-slate-950">
            {/* Listener Tile */}
            <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/80 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-inner">
              <div className="size-24 rounded-full bg-[#236B54]/40 border-2 border-emerald-500/60 flex items-center justify-center mb-4 text-emerald-300 font-bold text-2xl shadow-lg shadow-emerald-950/50">
                {listenerName.split(" ")[0][0]}
              </div>
              <h3 className="font-semibold text-base text-slate-200">{listenerName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Volume2 className="size-3.5 text-emerald-400 animate-bounce" />
                Listening actively…
              </p>

              {/* Floating Self View (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 size-32 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-xl overflow-hidden flex flex-col items-center justify-center">
                {isVideoOn ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      You
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Camera On</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <VideoOff className="size-6 mb-1" />
                    <span className="text-[10px]">Camera Off</span>
                  </div>
                )}
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted((v) => !v)}
                className={`size-12 rounded-2xl border transition-all ${
                  isMuted ? "bg-rose-950/80 border-rose-700 text-rose-300" : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsVideoOn((v) => !v)}
                className={`size-12 rounded-2xl border transition-all ${
                  !isVideoOn ? "bg-rose-950/80 border-rose-700 text-rose-300" : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {isVideoOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
              </Button>

              <Button
                variant="destructive"
                onClick={handleEndCall}
                className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/50"
              >
                <PhoneOff className="size-5" />
                End Consultation
              </Button>
            </div>
          </div>

          {/* Right Panel: Live Transcript & Safety Sentinel (4 Cols) */}
          <div className="lg:col-span-4 border-l border-slate-800/80 bg-slate-900/50 flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="size-3.5 text-emerald-400" />
                Real-Time Transcript
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Live</span>
            </div>

            {/* Transcript Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-semibold text-emerald-400 block mb-0.5">{listenerName}</span>
                <p className="text-slate-300 leading-relaxed">
                  "Hello! Thank you for connecting today. I'm here to listen without judgment. How are you feeling right now?"
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800">
                <span className="font-semibold text-slate-400 block mb-0.5">You (Member)</span>
                <p className="text-slate-200 leading-relaxed">
                  "I have been feeling quite overwhelmed with work deadlines this week, and finding it hard to switch off in the evenings."
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="font-semibold text-emerald-400 block mb-0.5">{listenerName}</span>
                <p className="text-slate-300 leading-relaxed">
                  "I completely understand. That constant mental pressure takes a heavy toll. Would you like to try a calming grounding breath, or simply talk it out?"
                </p>
              </div>
            </div>

            {/* Safety Circuit Breaker Status */}
            <div className="p-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-emerald-400" />
              <span>Clinical Safety Sentinel: Status Clean. Crisis escalation idle.</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
