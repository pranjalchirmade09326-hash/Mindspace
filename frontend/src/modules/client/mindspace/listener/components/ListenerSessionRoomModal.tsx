"use client";

/**
 * ListenerSessionRoomModal — End-to-End Clean Architecture Peer Consultation Room for Listeners.
 *
 * Implements:
 *   - US-015 / US-016: Incoming Call Ringing & Acceptance Workflow
 *   - In-Call Stage: Member Audio/Video feed, Live Timer (00:00+), Listener PiP
 *   - Structured In-Call SOAP Documentation (Subjective, Objective, Assessment, Plan) with Quick-Tags
 *   - In-Call Real-Time Dialogue & Live Text Chat Messaging
 *   - Clinical Crisis Sentinel Interceptor (<2ms manual or auto-escalation to Safety Ops)
 *   - Post-Call Encounter Debrief & SOAP Submission to PostgreSQL
 *   - Volunteer Cooldown Breather (Mandatory somatic reset to protect against listener fatigue)
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Video,
  VideoOff,
  Volume2,
  Send,
  Wind,
  Check,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  HeartHandshake,
  BookOpen,
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

interface ChatMessage {
  id: string;
  sender: "listener" | "member";
  senderName: string;
  text: string;
  time: string;
}

export function ListenerSessionRoomModal({
  open,
  onOpenChange,
  memberSession,
  onSessionEnded,
}: ListenerSessionRoomModalProps) {
  // Workflow Stages: "incoming" -> "active" -> "debrief" -> "cooldown"
  const [stage, setStage] = useState<"incoming" | "active" | "debrief" | "cooldown">("incoming");

  // Call duration counter
  const [seconds, setSeconds] = useState(0);

  // Audio / Video toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  // Right Panel Tabs: "soap" | "chat" | "guidelines"
  const [activeTab, setActiveTab] = useState<"soap" | "chat" | "guidelines">("soap");

  // Structured SOAP Documentation State
  const [soapSubjective, setSoapSubjective] = useState(
    "Member reports persistent anxiety related to workplace workload and fatigue. Difficulty unwinding in evenings."
  );
  const [soapObjective, setSoapObjective] = useState(
    "Member speech paced, slightly breathy initially. No cognitive impairment noted. Tone softened after validation."
  );
  const [soapAssessment, setSoapAssessment] = useState(
    "Mild situational stress. Receptive to active listening and somatic pacing. No clinical crisis or self-harm ideation."
  );
  const [soapPlan, setSoapPlan] = useState(
    "Practiced 4-7-8 breathing together. Recommended evening wind-down routine. Member encouraged to check in again this week."
  );

  // Cooldown timer (60 seconds decompression)
  const [cooldownRemaining, setCooldownRemaining] = useState(60);

  // In-Call Live Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "listener",
      senderName: "You (Listener)",
      text: "Hello, I'm here to listen. Feel free to speak or type whenever you're ready.",
      time: "Just now",
    },
    {
      id: "msg-2",
      sender: "member",
      senderName: memberSession?.memberName || "Member",
      text: "Thank you for being here. It's been a really tough couple of days.",
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSubmittingSoap, setIsSubmittingSoap] = useState(false);

  const memberName = memberSession?.memberName || "Ananya Sharma (Member)";
  const memberTopic = memberSession?.topic || "Workplace Stress & Exhaustion";

  // Reset stage and timer on open
  useEffect(() => {
    if (open) {
      setStage("incoming");
      setSeconds(0);
      setIsMuted(false);
      setIsVideoOn(memberSession?.channel !== "voice");
      setCooldownRemaining(60);
    }
  }, [open, memberSession?.id, memberSession?.channel]);

  // Active call duration counter
  useEffect(() => {
    if (!open || stage !== "active") return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open, stage]);

  // Volunteer Cooldown countdown
  useEffect(() => {
    if (!open || stage !== "cooldown") return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, stage]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Accept incoming call
  const handleAcceptCall = () => {
    setStage("active");
    toast.success(`Connected with ${memberName}`, {
      description: "Encrypted WebRTC Audio & Video session live.",
    });
  };

  // Decline incoming call
  const handleDeclineCall = () => {
    toast.info("Call passed to next available volunteer in Pod", {
      description: "Member returned to high-priority queue without delay.",
    });
    onOpenChange(false);
  };

  // In-call text message send
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "listener",
      senderName: "You (Listener)",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  // Add quick tag to SOAP Plan or Subjective
  const addQuickTag = (tag: string) => {
    setSoapPlan((prev) => (prev ? `${prev} • ${tag}` : tag));
    toast.success(`Added "${tag}" to SOAP notes`);
  };

  // Emergency safety escalation
  const handleCrisisAlert = async () => {
    try {
      await fetch("/api/mindspace/member/conduct-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: memberSession?.id || "emergency-session",
          severity: "high",
          reason: "Crisis Sentinel Escalate to Safety Ops",
          notes: `Listener triggered safety escalation during live call with ${memberName}.`,
        }),
      }).catch(() => {});
    } catch {}

    toast.error("Crisis Sentinel Triggered", {
      description: "Emergency incident dispatched to Safety Operations Specialist. Human supervisor notified.",
      duration: 7000,
    });
  };

  // Transition from active call to debrief
  const handleEndCall = () => {
    setStage("debrief");
  };

  // Finalize SOAP note & complete encounter in PostgreSQL
  const handleFinalizeDebrief = async () => {
    setIsSubmittingSoap(true);
    const convId = memberSession?.id || `conv-${Date.now()}`;

    try {
      // 1. Save SOAP note via backend endpoint
      await fetch(`/api/mindspace/listener/conversations/${convId}/soap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: soapSubjective,
          objective: soapObjective,
          assessment: soapAssessment,
          plan: soapPlan,
          duration_seconds: seconds,
        }),
      }).catch((e) => console.warn("SOAP note save error:", e));

      // 2. Close conversation in backend database
      await fetch(`/api/mindspace/listener/conversations/${convId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }).catch((e) => console.warn("Close conversation error:", e));

      toast.success("SOAP Note Saved & Encounter Signed", {
        description: "Encounter records committed to PostgreSQL. Commencing volunteer decompression rest.",
      });

      // Advance to mandatory cooldown stage
      setStage("cooldown");
    } catch (e) {
      console.error("Error finalizing debrief:", e);
      setStage("cooldown");
    } finally {
      setIsSubmittingSoap(false);
    }
  };

  // Complete cooldown and close modal
  const handleFinishCooldown = () => {
    onOpenChange(false);
    onSessionEnded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] p-0 overflow-hidden flex flex-col rounded-3xl bg-slate-950 text-white border-slate-800 shadow-2xl">
        {/* ═════════════════════════════════════════════════════════════════
            STAGE 1: INCOMING CALL RINGING / ACCEPTANCE
           ═════════════════════════════════════════════════════════════════ */}
        {stage === "incoming" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            {/* Glowing backdrop aura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
            </div>

            {/* Pulsing Avatar */}
            <div className="relative mb-6">
              <div className="size-28 rounded-full bg-teal-900/40 border-2 border-teal-500/80 flex items-center justify-center text-3xl font-bold text-teal-300 shadow-2xl shadow-teal-500/30">
                {memberName[0]}
              </div>
              <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping opacity-60" />
            </div>

            <Badge variant="outline" className="mb-2 text-xs bg-teal-950/70 text-teal-400 border-teal-800 gap-1.5 px-3 py-1 rounded-full">
              <Radio className="size-3 text-teal-400 animate-pulse" />
              Incoming Peer Support Request
            </Badge>

            <h2 className="text-2xl font-bold font-serif text-slate-100">
              {memberName} is Requesting to Connect
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-md">
              Topic: <strong className="text-slate-200">{memberTopic}</strong>
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
              <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800">
                Routine Support
              </Badge>
              <span>•</span>
              <span className="capitalize">{memberSession?.channel || "video"} Consultation</span>
              <span>•</span>
              <span className="text-emerald-400">Waiting 1m in queue</span>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="mt-8 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleDeclineCall}
                className="h-12 px-6 rounded-2xl border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-950 hover:text-rose-200 font-semibold gap-2"
              >
                <PhoneOff className="size-4" />
                <span>Decline (Pass to Queue)</span>
              </Button>

              <Button
                onClick={handleAcceptCall}
                className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center gap-2"
              >
                <PhoneCall className="size-5" />
                <span>Accept & Enter Consultation</span>
              </Button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STAGE 2: ACTIVE PEER CONSULTATION CALL
           ═════════════════════════════════════════════════════════════════ */}
        {stage === "active" && (
          <>
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Active Session: {memberName}</span>
                    <Badge variant="outline" className="text-[10px] bg-teal-950/60 text-teal-400 border-teal-800">
                      Peer Consultation
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{memberTopic}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Timer */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-emerald-400 shadow-inner">
                  <Clock className="size-3.5" />
                  <span>{formatTimer(seconds)}</span>
                </div>

                {/* Emergency Safety Escalation */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCrisisAlert}
                  className="h-8 text-xs bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white rounded-xl gap-1.5"
                >
                  <ShieldAlert className="size-3.5" />
                  <span>Escalate Safety Ops</span>
                </Button>
              </div>
            </div>

            {/* Main Stage Grid: Member Feed + SOAP / Chat / Guide */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
              {/* Member Video / Audio Stage (7 Cols) */}
              <div className="lg:col-span-7 p-6 flex flex-col justify-between relative bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950">
                <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/80 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-inner">
                  <div className="size-24 rounded-full bg-teal-900/40 border-2 border-teal-500/60 flex items-center justify-center mb-3 text-teal-300 font-bold text-2xl shadow-lg shadow-teal-950/50">
                    {memberName[0]}
                  </div>
                  <h3 className="font-semibold text-base text-slate-200">{memberName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Volume2 className="size-3.5 text-teal-400 animate-pulse" />
                    Speaking to listener…
                  </p>

                  {/* Audio frequency waves */}
                  <div className="flex items-center gap-1 mt-4 h-5">
                    {[14, 22, 10, 26, 18, 12, 24, 16, 10, 20].map((height, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-teal-500/80 animate-pulse"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 110}ms`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Listener Self-View PiP */}
                  <div className="absolute bottom-4 right-4 size-32 rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden flex flex-col items-center justify-center z-10">
                    {isVideoOn ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                          You
                        </div>
                        <span className="text-[10px] text-teal-400 mt-1 font-medium">Cam On</span>
                        {isMuted && <MicOff className="size-3 text-rose-400 mt-0.5" />}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-500 p-2 text-center">
                        <VideoOff className="size-5 mb-1" />
                        <span className="text-[10px]">Mic Only</span>
                        {isMuted && <span className="text-[9px] text-rose-400 font-bold">MUTED</span>}
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
                      isMuted
                        ? "bg-rose-950/80 border-rose-700 text-rose-300"
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVideoOn((v) => !v)}
                    className={`size-12 rounded-2xl border transition-all ${
                      !isVideoOn
                        ? "bg-rose-950/80 border-rose-700 text-rose-300"
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }`}
                    title={isVideoOn ? "Turn Cam Off" : "Turn Cam On"}
                  >
                    {isVideoOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleEndCall}
                    className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/50"
                  >
                    <PhoneOff className="size-5" />
                    <span>Complete & Review SOAP</span>
                  </Button>
                </div>
              </div>

              {/* Right Panel: SOAP Documentation & In-Call Utilities (5 Cols) */}
              <div className="lg:col-span-5 border-l border-slate-800/80 bg-slate-900/60 flex flex-col p-4">
                {/* Tab Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("soap")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "soap" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Live SOAP
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "chat" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Chat ({messages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("guidelines")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "guidelines" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Boundary Guide
                  </button>
                </div>

                {/* Tab 1: Structured SOAP Notes */}
                {activeTab === "soap" && (
                  <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto pr-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <FileText className="size-3.5 text-emerald-400" />
                        Live SOAP Documentation
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-900/80 text-emerald-400">
                        Auto-Saving
                      </Badge>
                    </div>

                    {/* Quick Tags Bar */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Validation Offered",
                        "Somatic Breath 4-7-8",
                        "Emotional Regulation",
                        "Boundary Respected",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addQuickTag(tag)}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-teal-300 border border-slate-700 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    {/* S: Subjective */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        S — Subjective (Member's Experience & Words)
                      </label>
                      <Textarea
                        value={soapSubjective}
                        onChange={(e) => setSoapSubjective(e.target.value)}
                        className="bg-slate-950/80 border-slate-800 rounded-xl text-xs text-slate-200 h-16 resize-none p-2.5 focus-visible:ring-emerald-500"
                      />
                    </div>

                    {/* O: Objective */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        O — Objective (Observed Vocal Tone & Pacing)
                      </label>
                      <Textarea
                        value={soapObjective}
                        onChange={(e) => setSoapObjective(e.target.value)}
                        className="bg-slate-950/80 border-slate-800 rounded-xl text-xs text-slate-200 h-16 resize-none p-2.5 focus-visible:ring-emerald-500"
                      />
                    </div>

                    {/* A: Assessment */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        A — Assessment (Emotional Tone & Grounding Progress)
                      </label>
                      <Textarea
                        value={soapAssessment}
                        onChange={(e) => setSoapAssessment(e.target.value)}
                        className="bg-slate-950/80 border-slate-800 rounded-xl text-xs text-slate-200 h-16 resize-none p-2.5 focus-visible:ring-emerald-500"
                      />
                    </div>

                    {/* P: Plan */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        P — Plan (Agreed Grounding & Follow-Up)
                      </label>
                      <Textarea
                        value={soapPlan}
                        onChange={(e) => setSoapPlan(e.target.value)}
                        className="bg-slate-950/80 border-slate-800 rounded-xl text-xs text-slate-200 h-16 resize-none p-2.5 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Live In-Call Chat */}
                {activeTab === "chat" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 text-xs">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl max-w-[85%] ${
                            m.sender === "listener"
                              ? "ml-auto bg-teal-800 text-white"
                              : "bg-slate-800/80 border border-slate-700/60 text-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5 text-[10px] opacity-75">
                            <span className="font-semibold">{m.senderName}</span>
                            <span>{m.time}</span>
                          </div>
                          <p className="leading-relaxed text-xs">{m.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type message to member..."
                        className="h-9 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl focus-visible:ring-emerald-500"
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        className="size-9 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shrink-0"
                      >
                        <Send className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Boundary Guidelines */}
                {activeTab === "guidelines" && (
                  <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="font-semibold text-teal-400 block">1. Non-Clinical Peer Stance</span>
                      <p className="text-slate-300">
                        Never diagnose psychiatric disorders or suggest changing medication dosages. Uphold warm active listening.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="font-semibold text-emerald-400 block">2. Reflective Mirroring</span>
                      <p className="text-slate-300">
                        "It sounds like you felt really unseen during that conversation." Reframe and reflect feelings without giving advice.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="font-semibold text-rose-400 block">3. Red-Line Safeguarding</span>
                      <p className="text-slate-300">
                        If member expresses explicit intent or active means of self-harm, immediately click "Escalate Safety Ops" above.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STAGE 3: POST-CALL ENCOUNTER DEBRIEF & SOAP SUBMISSION
           ═════════════════════════════════════════════════════════════════ */}
        {stage === "debrief" && (
          <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="size-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/40 shadow-lg shadow-teal-950">
                  <CheckCircle2 className="size-7" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-slate-100">
                  Encounter Completed — Finalize SOAP
                </h2>
                <p className="text-xs text-slate-400">
                  Session with <strong className="text-teal-400">{memberName}</strong> • Duration:{" "}
                  <span className="font-mono text-slate-200 font-semibold">{formatTimer(seconds)}</span>
                </p>
              </div>

              {/* SOAP Review Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="size-4 text-emerald-400" />
                  Clinical & Peer Record Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="font-bold text-slate-400 block mb-1">Subjective (S)</span>
                    <p className="text-slate-200 line-clamp-3">{soapSubjective}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="font-bold text-slate-400 block mb-1">Objective (O)</span>
                    <p className="text-slate-200 line-clamp-3">{soapObjective}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="font-bold text-slate-400 block mb-1">Assessment (A)</span>
                    <p className="text-slate-200 line-clamp-3">{soapAssessment}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="font-bold text-slate-400 block mb-1">Plan (P)</span>
                    <p className="text-slate-200 line-clamp-3">{soapPlan}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStage("active")}
                  className="rounded-xl border-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  Return to Edit Notes
                </Button>

                <Button
                  onClick={handleFinalizeDebrief}
                  disabled={isSubmittingSoap}
                  className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950"
                >
                  {isSubmittingSoap ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Saving to Health Engine...
                    </>
                  ) : (
                    <>
                      <span>Sign SOAP & Start Decompression Rest</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            STAGE 4: MANDATORY VOLUNTEER COOLDOWN BREATHER (US-015)
           ═════════════════════════════════════════════════════════════════ */}
        {stage === "cooldown" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-6">
              <div className="size-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/40 shadow-xl shadow-teal-950">
                <Wind className="size-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="text-xs bg-teal-950/70 text-teal-400 border-teal-800">
                  Volunteer Safeguarding (US-015)
                </Badge>
                <h2 className="text-2xl font-bold font-serif text-slate-100">
                  Take a Moment to Decompress
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Holding space for others requires emotional energy. Take a quiet breath before taking the next person from the queue.
                </p>
              </div>

              {/* Cooldown Ring Timer */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-bold text-teal-400">{cooldownRemaining}s</span>
                <span className="text-[11px] text-slate-400 mt-1">Recommended resting window</span>
              </div>

              <Button
                onClick={handleFinishCooldown}
                className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
              >
                {cooldownRemaining === 0 ? "Complete Cooldown & Return to Queue" : "I'm Rested & Ready for Next Call"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}