"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { beginMindspaceIntakeAction } from "@/modules/server/presentation/actions/mindspace-intake.actions";

type IntakeChannel = "text" | "voice";

interface MindspaceIntakeGateProps {
  channel: IntakeChannel;
  locale: string;
  children: (intakeId: string) => React.ReactNode;
}

export function MindspaceIntakeGate({
  channel,
  locale,
  children,
}: MindspaceIntakeGateProps) {
  const [intakeConsentAccepted, setIntakeConsentAccepted] = useState(false);
  const [transcriptionConsentAccepted, setTranscriptionConsentAccepted] = useState(false);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function startIntake() {
    setIsStarting(true);
    try {
      const createdId = await beginMindspaceIntakeAction({
        channel,
        locale,
        intakeConsentAccepted,
        transcriptionConsentAccepted,
      });
      setIntakeId(createdId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start intake.");
    } finally {
      setIsStarting(false);
    }
  }

  if (intakeId) {
    return children(intakeId);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Before you begin</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your conversation transcript is saved encrypted in your MindSpace account. You can choose not to continue.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          checked={intakeConsentAccepted}
          onChange={(event) => setIntakeConsentAccepted(event.target.checked)}
          className="mt-1 size-4 accent-emerald-700"
        />
        <span>
          I agree to share my {channel === "voice" ? "voice intake transcript" : "chat intake conversation"} with MindSpace for this intake. The transcript will be stored encrypted.
        </span>
      </label>

      {channel === "voice" && (
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={transcriptionConsentAccepted}
            onChange={(event) => setTranscriptionConsentAccepted(event.target.checked)}
            className="mt-1 size-4 accent-emerald-700"
          />
          <span>
            I agree to stream microphone audio to the configured voice assistant to generate the live conversation. MindSpace stores transcript text, not the raw audio recording.
          </span>
        </label>
      )}

      <Button
        type="button"
        onClick={startIntake}
        disabled={
          isStarting
          || !intakeConsentAccepted
          || (channel === "voice" && !transcriptionConsentAccepted)
        }
      >
        {isStarting ? "Starting securely..." : "Continue"}
      </Button>
    </section>
  );
}
