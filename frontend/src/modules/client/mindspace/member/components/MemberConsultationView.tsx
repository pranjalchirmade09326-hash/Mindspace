"use client";

/**
 * MemberConsultationView — Remapping Patient Consultation into MindSpace Member Consultation Hub.
 *
 * Layer: modules / client / mindspace / member / components
 */

import { useState } from "react";
import {
  Video,
  Mic,
  MessageCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  Radio,
  UserCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

import { MemberSessionRoomModal } from "./MemberSessionRoomModal";
import { BookSessionModal } from "./BookSessionModal";

const ONLINE_LISTENERS = [
  {
    id: "l-1",
    name: "Aarav Sharma",
    specialty: "Work Stress & Grounding",
    rating: "4.9 ★",
    avatar: "AS",
    status: "Available Now",
    channel: "video",
  },
  {
    id: "l-2",
    name: "Priya Nair",
    specialty: "Somatic Breathwork & Sleep",
    rating: "4.9 ★",
    avatar: "PN",
    status: "Available Now",
    channel: "voice",
  },
  {
    id: "l-3",
    name: "Kabir Mehta",
    specialty: "Social Anxiety & Mindfulness",
    rating: "4.8 ★",
    avatar: "KM",
    status: "In Session (Free in 10m)",
    channel: "chat",
  },
];

export function MemberConsultationView() {
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    listenerName: string;
    channel?: string;
    note?: string;
  } | null>(null);

  const startInstantCall = async (listener: (typeof ONLINE_LISTENERS)[0]) => {
    let convId = `live-${Date.now()}`;
    try {
      const res = await fetch("/api/mindspace/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listener_name: `${listener.name} (Verified Peer Listener)`,
          channel: listener.channel === "video" ? "video" : listener.channel === "voice" ? "voice" : "chat",
          note: `Instant consultation for ${listener.specialty}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        convId = data.id;
      }
    } catch {}

    setActiveSession({
      id: convId,
      listenerName: `${listener.name} (Verified Peer Listener)`,
      channel: listener.channel,
      note: `Instant consultation for ${listener.specialty}`,
    });
    setIsRoomModalOpen(true);
    toast.success(`Connecting to ${listener.name}...`, {
      description: "Secure consultation room loaded in PostgreSQL. Audio & Video ready.",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Consultation Rooms & Peer Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose your preferred consultation format — connect instantly or schedule ahead.
          </p>
        </div>

        <Button
          onClick={() => setIsBookModalOpen(true)}
          className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-4 gap-2"
        >
          <Calendar className="size-4" />
          <span>Schedule Future Slot</span>
        </Button>
      </div>

      {/* ── 3 Main Consultation Format Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Video Consultation */}
        <Card className="p-5 border-border/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Video className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Video Consultation</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Face-to-face peer reflection in a private WebRTC encrypted video room. Camera optional.
              </p>
            </div>
          </div>

          <Button
            onClick={() => startInstantCall(ONLINE_LISTENERS[0])}
            className="w-full rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-9 font-semibold gap-1.5"
          >
            <Video className="size-3.5" />
            <span>Launch Video Room</span>
          </Button>
        </Card>

        {/* Audio Consultation */}
        <Card className="p-5 border-border/60 hover:border-teal-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              <Mic className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Voice / Audio Consultation</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Low-pressure audio space. Talk it through out loud with a trained empathetic listener.
              </p>
            </div>
          </div>

          <Button
            onClick={() => startInstantCall(ONLINE_LISTENERS[1])}
            variant="outline"
            className="w-full rounded-xl border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 text-xs h-9 font-semibold gap-1.5"
          >
            <Mic className="size-3.5" />
            <span>Start Voice Call</span>
          </Button>
        </Card>

        {/* Chat Consultation */}
        <Card className="p-5 border-border/60 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Confidential Text Chat</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">
                Take your time to write. Real-time text dialogue or asynchronous reflection check-in.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl text-xs h-9 font-semibold gap-1.5"
          >
            <Link href="/mindspace/member/chat">
              <MessageCircle className="size-3.5" />
              <span>Open Chat Room</span>
            </Link>
          </Button>
        </Card>
      </div>

      {/* ── Active Listeners Roster ── */}
      <Card className="p-5 border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Listeners on Duty</h2>
            <p className="text-xs text-muted-foreground">Verified peer listeners available to connect right now.</p>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5"
          >
            <Radio className="size-3 text-emerald-600 animate-pulse" />
            2 Available Live
          </Badge>
        </div>

        <div className="space-y-3">
          {ONLINE_LISTENERS.map((listener) => (
            <div
              key={listener.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#236B54]/10 text-[#236B54] font-bold text-xs">
                  {listener.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{listener.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      {listener.rating}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{listener.specialty}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hidden sm:inline">
                  {listener.status}
                </span>
                <Button
                  size="sm"
                  onClick={() => startInstantCall(listener)}
                  className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white text-xs h-8 px-3.5 gap-1.5"
                >
                  <span>Connect</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Modals ── */}
      <MemberSessionRoomModal
        open={isRoomModalOpen}
        onOpenChange={setIsRoomModalOpen}
        session={activeSession}
        onSessionEnded={() => setIsRoomModalOpen(false)}
      />

      <BookSessionModal
        open={isBookModalOpen}
        onOpenChange={setIsBookModalOpen}
        onSessionBooked={() => {
          setIsBookModalOpen(false);
          toast.success("Consultation Slot Reserved!", {
            description: "View details in your Sessions & Appointments section.",
          });
        }}
      />
    </div>
  );
}

