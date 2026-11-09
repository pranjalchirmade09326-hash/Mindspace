"use client";

/**
 * ListenerDashboardView — Clean Architecture Client Component for MindSpace Peer Listener Workspace.
 *
 * Layer: modules / client / mindspace / listener / components
 *
 * Implements:
 *   - Listener greeting & active availability toggle
 *   - Peer listening active queue
 *   - Listener stats (Active conversations, Completed sessions, Empathy rating, Training hours)
 *   - Recent support conversations
 */

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Headphones,
  Heart,
  MessageCircle,
  Radio,
  ShieldAlert,
  Sparkles,
  Users,
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

export interface ListenerDashboardViewProps {
  listenerName?: string;
  isAvailable?: boolean;
}

const MOCK_WAITING_MEMBERS = [
  {
    id: "req-1",
    displayName: "Ananya",
    topic: "Work anxiety & feeling overwhelmed",
    waitingMinutes: 3,
    channel: "chat",
    urgency: "routine",
  },
  {
    id: "req-2",
    displayName: "Rohan",
    topic: "Exam stress & sleeping trouble",
    waitingMinutes: 7,
    channel: "chat",
    urgency: "routine",
  },
  {
    id: "req-3",
    displayName: "Simran",
    topic: "Feeling isolated after relocating",
    waitingMinutes: 12,
    channel: "voice",
    urgency: "support",
  },
];

export function ListenerDashboardView({
  listenerName = "Listener",
  isAvailable: initialAvailable = true,
}: ListenerDashboardViewProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);

  const toggleAvailability = () => {
    const next = !isAvailable;
    setIsAvailable(next);
    if (next) {
      toast.success("You are now Active on the Listener Roster", {
        description: "New member peer-support requests will be routed to you.",
      });
    } else {
      toast.info("Availability paused", {
        description: "You will not receive new incoming queue requests.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Header & Status Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Listener Workspace
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
          <div className="text-2xl font-bold text-foreground">{MOCK_WAITING_MEMBERS.length} waiting</div>
          <p className="text-[11px] text-muted-foreground">Avg wait time ~ 5 mins</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            <CheckCircle2 className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">3 completed</div>
          <p className="text-[11px] text-muted-foreground">Peer sessions fulfilled</p>
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
          <p className="text-[11px] text-muted-foreground">Module 3 passed</p>
        </Card>
      </div>

      {/* ── 3. Active Peer Support Queue ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Active Peer Support Queue</h2>
            <p className="text-xs text-muted-foreground">Members currently waiting to connect with a listener.</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {MOCK_WAITING_MEMBERS.length} Members in line
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Waiting Time</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_WAITING_MEMBERS.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-semibold text-sm">{req.displayName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{req.topic}</TableCell>
                <TableCell className="capitalize text-xs">
                  <Badge variant="outline" className="text-xs capitalize">
                    {req.channel}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3 text-amber-500" />
                  {req.waitingMinutes}m ago
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    className="h-8 text-xs rounded-lg bg-[#236B54] hover:bg-[#1a5240] text-white"
                    onClick={() => toast.success(`Connected to ${req.displayName}`, { description: "Opening secure peer support chat room…" })}
                  >
                    Accept & Chat
                  </Button>
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
          <span>Remember that peer listeners provide empathetic presence, not psychiatric diagnoses or medical advice. If a member expresses immediate danger or crisis, utilize the 1-Click Crisis Handoff tool to alert Safety Operations.</span>
        </div>
      </div>
    </div>
  );
}

