"use client";

/**
 * ListenerConsultationsView — Remapping Doctor Appointments & Consultations into Peer Listener Consultation Hub.
 *
 * Layer: modules / client / mindspace / listener / components
 */

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Mic,
  MessageCircle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Headphones,
  Users,
  Radio,
  Eye,
  Check,
  X,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ListenerReviewModal } from "./ListenerReviewModal";

export interface TListenerSessionItem {
  id: string;
  memberName: string;
  topic: string;
  channel: "video" | "voice" | "chat";
  timeSlot: string;
  status: "waiting" | "confirmed" | "completed";
  urgency: "routine" | "support" | "elevated";
  waitingMinutes: number;
}

const INITIAL_SESSIONS: TListenerSessionItem[] = [
  {
    id: "sess-d1",
    memberName: "Ananya",
    topic: "Work anxiety & feeling chronically overwhelmed with deadlines",
    channel: "video",
    timeSlot: "Today, 6:30 PM (Waiting in queue)",
    status: "waiting",
    urgency: "routine",
    waitingMinutes: 3,
  },
  {
    id: "sess-d2",
    memberName: "Rohan",
    topic: "Exam stress & disrupted sleep cycle",
    channel: "chat",
    timeSlot: "Today, 7:15 PM",
    status: "confirmed",
    urgency: "routine",
    waitingMinutes: 0,
  },
  {
    id: "sess-d3",
    memberName: "Simran",
    topic: "Feeling isolated & emotionally drained after city relocation",
    channel: "voice",
    timeSlot: "Today, 8:00 PM",
    status: "confirmed",
    urgency: "support",
    waitingMinutes: 0,
  },
  {
    id: "sess-d4",
    memberName: "Dev",
    topic: "Career transition fatigue & imposter thoughts",
    channel: "video",
    timeSlot: "Yesterday, 5:30 PM",
    status: "completed",
    urgency: "routine",
    waitingMinutes: 0,
  },
];

export function ListenerConsultationsView() {
  const [sessions, setSessions] = useState<TListenerSessionItem[]>(INITIAL_SESSIONS);
  const [filterTab, setFilterTab] = useState<"all" | "waiting" | "confirmed" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Live session queue loading
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch("/api/mindspace/listener/conversations");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: TListenerSessionItem[] = data.map((item: any, idx: number) => ({
              id: item.id || `sess-d${idx + 1}`,
              memberName: item.member_name || item.memberName || "Member",
              topic: item.note || item.topic || "Work stress & active listening support",
              channel: (item.channel === "voice" || item.channel === "video") ? item.channel : "chat",
              timeSlot: item.started_at ? new Date(item.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
              status: item.status === "completed" ? "completed" : (item.status === "confirmed" ? "confirmed" : "waiting"),
              urgency: "routine",
              waitingMinutes: item.waitingMinutes || (idx + 1) * 3,
            }));
            setSessions(mapped);
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    loadSessions();
  }, []);

  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Selections
  const [activeCallSession, setActiveCallSession] = useState<{
    id: string;
    memberName: string;
    topic: string;
    channel?: string;
  } | null>(null);

  const [selectedMemberForIntake, setSelectedMemberForIntake] = useState<{
    id: string;
    displayName: string;
    topic: string;
    urgency: string;
    waitingMinutes: number;
    channel: string;
  } | null>(null);

  const [selectedSessionForReview, setSelectedSessionForReview] = useState<{
    id: string;
    memberName: string;
    topic: string;
  } | null>(null);

  const handleConfirmRequest = (id: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s))
    );
    toast.success(`Request Confirmed for ${name}`, {
      description: "Member notified. You can start the consultation call when ready.",
    });
  };

  const handleStartCall = (session: TListenerSessionItem) => {
    setActiveCallSession({
      id: session.id,
      memberName: session.memberName,
      topic: session.topic,
      channel: session.channel,
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenReview = (session: TListenerSessionItem) => {
    setSelectedSessionForReview({
      id: session.id,
      memberName: session.memberName,
      topic: session.topic,
    });
    setIsReviewModalOpen(true);
  };

  const filtered = sessions.filter((s) => {
    if (filterTab === "waiting" && s.status !== "waiting") return false;
    if (filterTab === "confirmed" && s.status !== "confirmed") return false;
    if (filterTab === "completed" && s.status !== "completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.memberName.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue</span>
            <Users className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "waiting").length} waiting
          </div>
          <p className="text-[11px] text-muted-foreground">Needs listener pickup</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed</span>
            <Clock className="size-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "confirmed").length} slots
          </div>
          <p className="text-[11px] text-muted-foreground">Scheduled for today</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="size-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sessions.filter((s) => s.status === "completed").length + 4} sessions
          </div>
          <p className="text-[11px] text-muted-foreground">Documented with SOAP</p>
        </Card>

        <Card className="p-4 border-border/60 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Duration</span>
            <Headphones className="size-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">38 mins</div>
          <p className="text-[11px] text-muted-foreground">Empathetic listening</p>
        </Card>
      </div>

      {/* ── Consultations Roster Table Card ── */}
      <Card className="p-5 border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground">Consultations & Active Schedule</h2>
            <p className="text-xs text-muted-foreground">
              Accept incoming queue requests, review member intake context, join live consultation calls, and file SOAP documentation.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterTab === "all" ? "default" : "outline"}
              onClick={() => setFilterTab("all")}
              className="text-xs h-8 rounded-lg"
            >
              All ({sessions.length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "waiting" ? "default" : "outline"}
              onClick={() => setFilterTab("waiting")}
              className="text-xs h-8 rounded-lg"
            >
              Waiting Queue ({sessions.filter((s) => s.status === "waiting").length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "confirmed" ? "default" : "outline"}
              onClick={() => setFilterTab("confirmed")}
              className="text-xs h-8 rounded-lg"
            >
              Confirmed ({sessions.filter((s) => s.status === "confirmed").length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === "completed" ? "default" : "outline"}
              onClick={() => setFilterTab("completed")}
              className="text-xs h-8 rounded-lg"
            >
              Completed ({sessions.filter((s) => s.status === "completed").length})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search member or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Discussion Topic</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Scheduled Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">{session.memberName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {session.status === "waiting" ? `${session.waitingMinutes}m ago in queue` : "Scheduled"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate font-medium">
                    {session.topic}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize font-normal gap-1">
                      {session.channel === "video" && <Video className="size-3 text-emerald-600" />}
                      {session.channel === "voice" && <Mic className="size-3 text-teal-600" />}
                      {session.channel === "chat" && <MessageCircle className="size-3 text-blue-600" />}
                      {session.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {session.timeSlot}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold capitalize ${
                        session.status === "waiting"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                          : session.status === "confirmed"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Intake Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        title="View Intake Context"
                        onClick={() => {
                          setSelectedMemberForIntake({
                            id: session.id,
                            displayName: session.memberName,
                            topic: session.topic,
                            urgency: session.urgency,
                            waitingMinutes: session.waitingMinutes,
                            channel: session.channel,
                          });
                          setIsIntakeModalOpen(true);
                        }}
                        className="h-8 text-xs rounded-xl gap-1 px-2.5 border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                      >
                        <FileText className="size-3.5" />
                        <span>Intake</span>
                      </Button>

                      {/* Confirm Button if waiting */}
                      {session.status === "waiting" && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmRequest(session.id, session.memberName)}
                          className="h-8 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1 px-2.5"
                        >
                          <Check className="size-3.5" />
                          <span>Accept</span>
                        </Button>
                      )}

                      {/* Start Call Button if confirmed or waiting */}
                      {session.status !== "completed" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartCall(session)}
                          className="h-8 text-xs rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white gap-1 px-2.5"
                        >
                          <Headphones className="size-3.5" />
                          <span>Start Call</span>
                        </Button>
                      )}

                      {/* Review & SOAP Button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenReview(session)}
                        className="h-8 text-xs rounded-xl gap-1 px-2.5"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>SOAP Notes</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Modals ── */}
      <ListenerSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        memberSession={activeCallSession}
        onSessionEnded={async () => {
          setIsRoomModalOpen(false);
          if (activeCallSession) {
            try {
              await fetch(`/api/mindspace/listener/conversations/${activeCallSession.id}/close`, {
                method: "PUT",
              });
            } catch {
              // Continue
            }
            setSessions((prev) =>
              prev.map((s) => (s.id === activeCallSession.id ? { ...s, status: "completed" } : s))
            );
            // Prompt SOAP review
            toast.info("Consultation Ended", {
              description: "Please complete post-session SOAP documentation for this member.",
            });
          }
        }}
      />

      <MemberIntakeViewModal
        open={isIntakeModalOpen}
        onOpenChange={setIsIntakeModalOpen}
        member={selectedMemberForIntake}
        onStartSession={() => {
          if (selectedMemberForIntake) {
            setIsIntakeModalOpen(false);
            const found = sessions.find((s) => s.id === selectedMemberForIntake.id);
            if (found) handleStartCall(found);
          }
        }}
      />

      <ListenerReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        session={selectedSessionForReview}
        onSaved={() => {
          if (selectedSessionForReview) {
            setSessions((prev) =>
              prev.map((s) => (s.id === selectedSessionForReview.id ? { ...s, status: "completed" } : s))
            );
          }
        }}
      />
    </div>
  );
}

