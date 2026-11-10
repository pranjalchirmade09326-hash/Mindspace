"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  ShieldAlert,
  Sparkles,
  User,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

export interface ListenerSessionRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberSession?: {
    id: string;
    memberName: string;
    topic: string;
    channel?: string;
  } | null;
  onSessionEnded?: () => void;
}

export function ListenerSessionRoomModal({
  open,
  onOpenChange,
  memberSession,
  onSessionEnded,
}: ListenerSessionRoomModalProps) {
  const [seconds, setSeconds] = useState(210);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [notes, setNotes] = useState(
    "Member shared initial feelings of exhaustion. Engaging in empathetic validation. Breathwork pacing suggested."
  );

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

  const handleEndCall = () => {
    toast.success("Consultation Closed & Encounter Recorded", {
      description: "SOAP reflection notes saved to MindSpace Health Engine.",
    });
    onOpenChange(false);
    onSessionEnded?.();
  };

  const handleCrisisAlert = () => {
    toast.error("Crisis Sentinel Triggered", {
      description: "Case immediately routed to Safety Operations Specialist. Human supervisor notified.",
      duration: 6000,
    });
  };

  const memberName = memberSession?.memberName || "Ananya (Member)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] p-0 overflow-hidden flex flex-col rounded-3xl bg-slate-950 text-white border-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Active Call with {memberName}</span>
                <Badge variant="outline" className="text-[10px] bg-teal-950/60 text-teal-400 border-teal-800">
                  Peer Consultation
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{memberSession?.topic || "Stress Management & Active Listening"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-emerald-400">
              <Clock className="size-3.5" />
              {formatTimer(seconds)}
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleCrisisAlert}
              className="h-8 text-xs bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white rounded-xl gap-1.5"
            >
              <ShieldAlert className="size-3.5" />
              Escalate to Safety Ops
            </Button>
          </div>
        </div>

        {/* Main Stage Grid: Member Video Feed + Doctor-Style Notes & Transcript */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Member Video / Audio Stage (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between relative bg-gradient-to-b from-slate-900/40 to-slate-950">
            <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/80 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-inner">
              <div className="size-24 rounded-full bg-teal-900/40 border-2 border-teal-500/60 flex items-center justify-center mb-4 text-teal-300 font-bold text-2xl shadow-lg shadow-teal-950/50">
                {memberName[0]}
              </div>
              <h3 className="font-semibold text-base text-slate-200">{memberName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Volume2 className="size-3.5 text-teal-400 animate-pulse" />
                Speaking to listener…
              </p>

              {/* Listener Self-View Pip */}
              <div className="absolute bottom-4 right-4 size-32 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-xl overflow-hidden flex flex-col items-center justify-center">
                {isVideoOn ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      You
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Listener Cam On</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <VideoOff className="size-6 mb-1" />
                    <span className="text-[10px]">Mic Only</span>
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
                Complete Consultation
              </Button>
            </div>
          </div>

          {/* Right Panel: Doctor-style Notes + Real-time Captions (5 Cols) */}
          <div className="lg:col-span-5 border-l border-slate-800/80 bg-slate-900/60 flex flex-col p-4 space-y-4">
            {/* Real-time Captions Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Radio className="size-3.5 text-teal-400" />
                  Live Dialogue Stream
                </span>
                <span className="text-[10px] text-teal-400 font-mono">Synced</span>
              </div>
              <div className="h-36 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-teal-400">{memberName}:</span>
                  <p className="text-slate-300">"I've been carrying this constant knot in my chest because of the workload."</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">You (Listener):</span>
                  <p className="text-slate-200">"That must feel exhausting. Let's take a slow breath together."</p>
                </div>
              </div>
            </div>

            {/* Listener Consultation Notes */}
            <div className="flex-1 flex flex-col space-y-2 min-h-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-emerald-400" />
                  Session Consultation Notes (SOAP)
                </span>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                  Auto-Saving
                </Badge>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your clinical / peer observations, member emotional tone, and recommended follow-up..."
                className="flex-1 bg-slate-950/80 border-slate-800 rounded-xl text-xs text-slate-200 resize-none p-3 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Quick Empathy Suggestion Pill */}
            <div className="p-3 rounded-xl border border-teal-900/40 bg-teal-950/20 text-[11px] text-teal-300">
              <span className="font-bold block mb-0.5">💡 Active Listening Prompt:</span>
              Reflect back: "It sounds like you're carrying a lot on your shoulders alone right now."
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
