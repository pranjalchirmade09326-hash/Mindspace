"use client";

/**
 * MemberDashboardView — Clean Architecture Client Component for MindSpace Member Workspace.
 *
 * Layer: modules / client / mindspace / member / components
 *
 * Implements the user's exact dashboard design:
 *   - Welcome header (Wellbeing journey)
 *   - "A good place to start" conversation intake card (Chat & Voice intake)
 *   - 4 Stat cards (Total, Pending, Completed, Cancelled)
 *   - Radial sessions summary chart
 *   - Recent peer support sessions table
 */

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MessageCircle,
  Mic,
  Shield,
  Smile,
  Sparkles,
  Users,
  XCircle,
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
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import type { TMemberSessionItem, TMemberDashboardStats } from "@/modules/entities/schemas/mindspace";

export interface MemberDashboardViewProps {
  userName?: string;
  stats?: Partial<TMemberDashboardStats>;
  recentSessions?: TMemberSessionItem[];
}

const DEFAULT_MOCK_SESSIONS: TMemberSessionItem[] = [
  {
    id: "sess-1",
    date: new Date().toISOString(),
    listenerName: "Aarav (Peer Listener)",
    status: "active",
    channel: "chat",
    note: "Evening reflection and mindfulness check-in",
  },
  {
    id: "sess-2",
    date: new Date(Date.now() - 86400000).toISOString(),
    listenerName: "Priya (Volunteer Listener)",
    status: "completed",
    channel: "voice",
    note: "Stress management & breathing exercises",
  },
  {
    id: "sess-3",
    date: new Date(Date.now() - 172800000).toISOString(),
    listenerName: "Kabir (Peer Support)",
    status: "completed",
    channel: "chat",
    note: "Work-life balance discussion",
  },
  {
    id: "sess-4",
    date: new Date(Date.now() - 345600000).toISOString(),
    listenerName: "Meera (Peer Listener)",
    status: "completed",
    channel: "chat",
    note: "Initial guided intake walkthrough",
  },
];

export function MemberDashboardView({
  userName = "Member",
  stats: customStats,
  recentSessions = DEFAULT_MOCK_SESSIONS,
}: MemberDashboardViewProps) {
  const firstName = userName.split(" ")[0] || "Member";

  const stats = useMemo(() => {
    const total = customStats?.total ?? 5;
    const pending = customStats?.pending ?? 4;
    const completed = customStats?.completed ?? 1;
    const cancelled = customStats?.cancelled ?? 0;
    return { total, pending, completed, cancelled };
  }, [customStats]);

  const chartData = useMemo(() => [
    { name: "Total", count: stats.total, fill: "var(--card)" },
    { name: "Pending", count: stats.pending, fill: "var(--foreground)" },
    { name: "Completed", count: stats.completed, fill: "#10b981" },
  ], [stats]);

  return (
    <div className="space-y-6">
      {/* ── 1. Welcome Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your wellbeing journey, at your pace.
        </p>
      </div>

      {/* ── 2. "A good place to start" Conversation Card ── */}
      <section className="rounded-3xl border border-emerald-100 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20 p-5 sm:p-7 shadow-xs">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            A good place to start
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-foreground sm:text-2xl font-serif">
            Let&apos;s begin with a conversation.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
            Tell us what has been going on in a chat or by voice. You can take
            your time, and connect with a trained peer listener when you&apos;re ready.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {/* Chat Intake */}
          <Link
            href="/mindspace/member/chat"
            className="group flex items-center gap-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 bg-white/95 dark:bg-card/90 p-4 transition-all duration-200 hover:border-emerald-500 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#236B54] dark:text-emerald-400">
              <MessageCircle className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900 dark:text-foreground">
                Start a chat intake
              </span>
              <span className="text-xs text-slate-500 dark:text-muted-foreground">
                Write in your own time
              </span>
            </span>
            <ArrowRight className="size-4 text-emerald-800 dark:text-emerald-400 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Voice Intake */}
          <Link
            href="/mindspace/member/voice"
            className="group flex items-center gap-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/40 bg-white/95 dark:bg-card/90 p-4 transition-all duration-200 hover:border-teal-500 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-400">
              <Mic className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900 dark:text-foreground">
                Start a voice intake
              </span>
              <span className="text-xs text-slate-500 dark:text-muted-foreground">
                Talk it through out loud
              </span>
            </span>
            <ArrowRight className="size-4 text-teal-800 dark:text-teal-400 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* AI Wellbeing Companion */}
          <Link
            href="/mindspace/member/companion"
            className="group flex items-center gap-3.5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/40 bg-white/95 dark:bg-card/90 p-4 transition-all duration-200 hover:border-cyan-500 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400">
              <Sparkles className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900 dark:text-foreground">
                AI Companion Chat
              </span>
              <span className="text-xs text-slate-500 dark:text-muted-foreground">
                Grounding & reflection
              </span>
            </span>
            <ArrowRight className="size-4 text-cyan-800 dark:text-cyan-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── 3. 4 Stat Cards + Donut Chart Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 4 Stat Cards (2x2 Grid) */}
        <div className="xl:col-span-8 grid grid-cols-2 gap-4">
          <Card className="border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All peer sessions on record</p>
          </Card>

          <Card className="border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting or upcoming</p>
          </Card>

          <Card className="border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Fulfilled support conversations</p>
          </Card>

          <Card className="border-border/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Cancelled</span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <XCircle className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelled or rescheduled</p>
          </Card>
        </div>

        {/* Sessions Summary Radial Donut Chart */}
        <div className="xl:col-span-4">
          <Card className="p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Sessions Summary</h2>
              <Button asChild size="sm" variant="ghost" className="text-xs h-auto p-0 opacity-70 hover:opacity-100 hover:underline">
                <Link href="/mindspace/member/my-support">See details</Link>
              </Button>
            </div>

            <div className="relative flex-1 min-h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={20} data={chartData}>
                  <RadialBar background={{ fill: "var(--border)" }} dataKey="count" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Users className="size-5 text-muted-foreground mb-1" />
                <span className="text-xs font-semibold text-muted-foreground">{stats.total} total</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground" />
                <span>Pending ({stats.pending})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Completed ({stats.completed})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── 4. Recent Support Sessions Table ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Peer Support Sessions</h2>
            <p className="text-xs text-muted-foreground">Conversations and reflections with peer listeners.</p>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs h-8">
            <Link href="/mindspace/member/my-support">View all</Link>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Peer Listener</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Topic / Notes</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="text-xs font-medium">
                  {session.date ? new Date(session.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                </TableCell>
                <TableCell className="text-sm font-semibold">{session.listenerName || "Volunteer Listener"}</TableCell>
                <TableCell className="capitalize text-xs">
                  <Badge variant="outline" className="text-xs font-normal">
                    {session.channel}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                  {session.note || "General wellbeing check-in"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold capitalize ${
                      session.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : session.status === "active"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {session.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

