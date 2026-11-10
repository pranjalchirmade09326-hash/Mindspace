"use client";

/**
 * ListenerProfileView — Remapping Doctor Profile & Practice Settings into Peer Listener Roster & Practice Profile.
 *
 * Layer: modules / client / mindspace / listener / components
 */

import { useState } from "react";
import {
  User,
  ShieldCheck,
  Award,
  Globe,
  Radio,
  Clock,
  Save,
  CheckCircle2,
  Heart,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface ListenerProfileViewProps {
  listenerName?: string;
}

export function ListenerProfileView({
  listenerName = "Aarav Sharma",
}: ListenerProfileViewProps) {
  const [name, setName] = useState(listenerName);
  const [bio, setBio] = useState(
    "Trained peer listener specializing in workplace boundary restoration and somatic grounding. Here to provide an empathetic, calm, and non-judgmental space."
  );
  const [languages, setLanguages] = useState("English, Hindi");
  const [specialties, setSpecialties] = useState("Work Burnout, Somatic Breathwork, Sleep Anxiety");
  const [capacity, setCapacity] = useState("3");
  const [weeklyHours, setWeeklyHours] = useState("10");
  const [isOnline, setIsOnline] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Listener Roster & Profile Updated!", {
      description: "Changes synced across the Peer Listener Roster and Member Matching Engine.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-serif">
            Listener Profile & Practice Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your peer listening credentials, weekly capacity, and active availability roster.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1.5"
        >
          <Award className="size-3.5 text-emerald-600" />
          Level 2 Verified Listener
        </Badge>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. Profile Info ── */}
        <Card className="p-5 border-border/60">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-emerald-600" />
              <span>Listener Credentials & Bio</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Displayed to members when selecting a peer listener for scheduled consultations.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Listener Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Certified Badge</Label>
                <Input
                  disabled
                  value="Level 2 Certified Peer Listener (4.9 ★ Rating)"
                  className="h-9 text-xs bg-muted/40 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bio / Introduction</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Spoken Languages</Label>
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Peer Support Focus Specialties</Label>
                <Input
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ── 2. Capacity & Roster Availability ── */}
        <Card className="p-5 border-border/60">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-teal-600" />
              <span>Roster Availability & Capacity Boundaries</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Uphold healthy listening limits to prevent volunteer listener fatigue and burnout.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Max Concurrent Active Members</Label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="h-9 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">Standard limit: 3 members</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Weekly Committed Hours</Label>
                <Input
                  type="number"
                  min="2"
                  max="25"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  className="h-9 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">Avg volunteer commitment: 8-12 hrs</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <Radio className={`size-3.5 ${isOnline ? "text-emerald-600 animate-pulse" : "text-muted-foreground"}`} />
                    <span>Active Queue Dispatch Status</span>
                  </span>
                  <span className="text-muted-foreground text-xs block">
                    {isOnline
                      ? "You are currently online and visible in the member consultation booking roster."
                      : "Availability paused. You will not receive new incoming member calls."}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="size-4 accent-[#236B54] rounded"
                />
              </label>
            </div>
          </div>
        </Card>

        {/* ── Submit Action ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="rounded-xl bg-[#236B54] hover:bg-[#1a5240] text-white font-semibold text-xs h-9 px-5 gap-2 shadow-sm"
          >
            <Save className="size-4" />
            <span>Update Practice Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

