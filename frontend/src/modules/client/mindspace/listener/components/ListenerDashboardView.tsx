"use client";

/**
 * ListenerDashboardView — Clean Architecture Client Component for MindSpace Peer Listener Workspace.
 *
 * Layer: modules / client / mindspace / listener / components
 *
 * Implements:
 *   - Listener greeting & active availability toggle
 *   - Peer listening active queue with:
 *       • "View Intake" (pre-session distress context & active listening guidance)
 *       • "Start Consultation" (live call dialog with live transcript & SOAP note drafting)
 *   - Listener stats (Active conversations, Completed sessions, Empathy rating, Training status)
 *   - Integrated ListenerSessionRoomModal and MemberIntakeViewModal
 */

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Headphones,
  Heart,
  MessageCircle,
  PhoneCall,
  Radio,
  ShieldAlert,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { ListenerSessionRoomModal } from "./ListenerSessionRoomModal";
import { MemberIntakeViewModal } from "./MemberIntakeViewModal";

export interface ListenerDashboardViewProps {
  listenerName?: string;
  isAvailable?: boolean;
}

export interface TQueueMember {
  id: string;
  displayName: string;
  topic: string;
  waitingMinutes: number;
  channel: "chat" | "voice" | "video";
  urgency: "routine" | "support" | "elevated";
  status: "waiting" | "in_call" | "completed";
}

const INITIAL_QUEUE_MEMBERS: TQueueMember[] = [
  {
    id: "req-1",
    displayName: "Ananya",
    topic: "Work anxiety & feeling chronically overwhelmed with deadlines",
    waitingMinutes: 3,
    channel: "video",
    urgency: "routine",
    status: "waiting",
  },
  {
    id: "req-2",
    displayName: "Rohan",
    topic: "Exam stress & disrupted sleep cycle",
    waitingMinutes: 7,
    channel: "chat",
    urgency: "routine",
    status: "waiting",
  },
  {
    id: "req-3",
    displayName: "Simran",
    topic: "Feeling isolated & emotionally drained after city relocation",
    waitingMinutes: 12,
    channel: "voice",
    urgency: "support",
    status: "waiting",
  },
];

export function ListenerDashboardView({
  listenerName = "Listener",
  isAvailable: initialAvailable = true,
}: ListenerDashboardViewProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [queue, setQueue] = useState<TQueueMember[]>(INITIAL_QUEUE_MEMBERS);

  // Modals state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Active selections
  const [selectedMemberForIntake, setSelectedMemberForIntake] = useState<TQueueMember | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<{
    id: string;
    memberName: string;
    topic: string;
    channel?: string;
  } | null>(null);

  const toggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    if (next) {
      toast.success("You are now Active on the Listener Roster", {
        description: "New member peer-support requests will be routed to you in real-time.",
      });
    } else {
      toast.info("Availability paused", {
        description: "You will not receive new incoming queue requests.",
      });
    }
  };

  const handleOpenIntake = (member: TQueueMember) => {
    setSelectedMemberForIntake(member);
    setIsIntakeModalOpen(true);
  };

  const handleStartCall = (member: TQueueMember) => {
    setActiveCallSession({
      id: member.id,
      memberName: member.displayName,
      topic: member.topic,
      channel: member.channel,
    });
    setIsIntakeModalOpen(false);
    setIsRoomModalOpen(true);
    toast.success(`Connected to ${member.displayName}`, {
      description: "Secure peer consultation room opened. Microphone and live audio stream ready.",
    });
  };

  const handleEndCall = () => {
    if (activeCallSession) {
      setQueue((prev) =>
        prev.map((m) => (m.id === activeCallSession.id ? { ...m, status: "completed" } : m))
      );
    }
    setIsRoomModalOpen(false);
    setActiveCallSession(null);
  };

  const activeWaiting = queue.filter((m) => m.status === "waiting");

  return (
    <div className="space-y-6">
      {/* ── 1. Header & Status Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Peer Listener Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Offer warm, empathetic peer support while upholding active listening boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 transition-colors ${
              isAvailable
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-muted bg-muted/60 text-muted-foreground"
            }`}
          >
            <Radio className={`size-3 ${isAvailable ? "text-emerald-600 animate-pulse" : "text-muted-foreground"}`} />
            {isAvailable ? "Available to Listen" : "Offline / Paused"}
          </Badge>

          <Button
            size="sm"
            variant={isAvailable ? "outline" : "default"}
            onClick={toggleAvailability}
            className="rounded-xl text-xs h-9 px-4 font-semibold"
          >
            {isAvailable ? "Pause Queue" : "Go Online"}
          </Button>
        </div>
      </div>

      {/* ── 2. Listener Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{activeWaiting.length} waiting</div>
          <p className="text-[11px] text-muted-foreground">Avg wait time ~ 4 mins</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            <CheckCircle2 className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {queue.filter((m) => m.status === "completed").length + 3} fulfilled
          </div>
          <p className="text-[11px] text-muted-foreground">Consultations completed</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Empathy</span>
            <Heart className="size-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">4.9 / 5.0</div>
          <p className="text-[11px] text-muted-foreground">From member feedback</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Training</span>
            <BadgeCheck className="size-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">Active</div>
          <p className="text-[11px] text-muted-foreground">Verified Level 2 Listener</p>
        </Card>
      </div>

      {/* ── 3. Active Peer Support Queue ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Incoming Consultation & Queue Requests</h2>
            <p className="text-xs text-muted-foreground">Review member intake context before connecting for the consultation.</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {activeWaiting.length} Members in line
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Topic / Reason</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-semibold text-sm">{req.displayName}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{req.topic}</TableCell>
                <TableCell className="capitalize text-xs">
                  <Badge variant="outline" className="text-xs capitalize font-normal">
                    {req.channel}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-amber-500" />
                    {req.waitingMinutes}m ago
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold capitalize ${
                      req.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    {req.status === "completed" ? "Completed" : "Waiting"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenIntake(req)}
                      className="h-8 text-xs rounded-xl gap-1.5 px-3 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      <FileText className="size-3.5" />
                      <span>View Intake</span>
                    </Button>

                    <Button
                      size="sm"
                      disabled={req.status === "completed" || !isAvailable}
                      className="h-8 text-xs rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white gap-1.5 px-3"
                      onClick={() => handleStartCall(req)}
                    >
                      <Headphones className="size-3.5" />
                      <span>Start Call</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ── 4. Safety & Protocol Reminder ── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-950 dark:text-amber-200">
        <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Peer Support Protocols & Safety Guidelines:</span>
          <span>Remember that peer listeners provide empathetic presence, not psychiatric diagnoses or medical advice. If a member expresses immediate danger or crisis, utilize the 1-Click Crisis Handoff tool inside the call room to instantly alert Safety Operations.</span>
        </div>
      </div>

      {/* ── 5. Integrated Modals ── */}
      <MemberIntakeViewModal
        open={isIntakeModalOpen}
        onOpenChange={setIsIntakeModalOpen}
        member={selectedMemberForIntake}
        onStartSession={() => {
          if (selectedMemberForIntake) {
            handleStartCall(selectedMemberForIntake);
          }
        }}
      />

      <ListenerSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        memberSession={activeCallSession}
        onSessionEnded={handleEndCall}
      />
    </div>
  );
}
