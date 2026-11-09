"use client";

/**
 * SupervisorDashboardView — Clean Architecture Client Component for MindSpace Listener Supervisor.
 *
 * Layer: modules / client / mindspace / supervisor / components
 */

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UsersRound,
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

const ACTIVE_LISTENERS = [
  {
    name: "Aarav S.",
    status: "Active on Roster",
    readiness: "Fully Certified",
    openChats: 2,
    weeklyHours: "14 hrs",
    rating: "4.9/5",
  },
  {
    name: "Priya M.",
    status: "Active on Roster",
    readiness: "Fully Certified",
    openChats: 1,
    weeklyHours: "18 hrs",
    rating: "5.0/5",
  },
  {
    name: "Kabir D.",
    status: "Active on Roster",
    readiness: "Check-in Due",
    openChats: 0,
    weeklyHours: "8 hrs",
    rating: "4.8/5",
  },
  {
    name: "Meera R.",
    status: "In Training",
    readiness: "Module 3 In Progress",
    openChats: 0,
    weeklyHours: "4 hrs",
    rating: "New",
  },
];

export function SupervisorDashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-violet-500 animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
            Listener Supervision & Care Quality
          </p>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
          Supervisor Workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor volunteer listener readiness, workload balance, and empathetic quality practices.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Listeners
            </CardTitle>
            <UsersRound className="size-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 Listeners</div>
            <p className="mt-1 text-xs text-muted-foreground">Available for peer routing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reviews Due
            </CardTitle>
            <CalendarCheck className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Check-ins</div>
            <p className="mt-1 text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Support Quality
            </CardTitle>
            <Award className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.92 / 5.0</div>
            <p className="mt-1 text-xs text-muted-foreground">From member feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Training Modules
            </CardTitle>
            <BookOpen className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 In Progress</div>
            <p className="mt-1 text-xs text-muted-foreground">New volunteer onboarding</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Listener Roster & Readiness</CardTitle>
            <CardDescription>
              Review listener status, open conversations, and weekly commitment hours.
            </CardDescription>
          </div>
          <Link
            href="/mindspace/listener-supervisor/listeners"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Manage full roster
            <ExternalLink className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listener</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Readiness Level</TableHead>
                <TableHead>Active Chats</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Empathy Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ACTIVE_LISTENERS.map((lis) => (
                <TableRow key={lis.name}>
                  <TableCell className="font-semibold text-foreground">
                    {lis.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400">
                      {lis.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{lis.readiness}</TableCell>
                  <TableCell className="text-sm">{lis.openChats}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lis.weeklyHours}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {lis.rating}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

