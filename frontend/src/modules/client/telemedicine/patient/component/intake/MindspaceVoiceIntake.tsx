"use client";

import { MindspaceIntakeGate } from "./MindspaceIntakeGate";
import { VoiceIntakeTest } from "./VoiceIntakeTest";

export function MindspaceVoiceIntake({
  locale,
  basePath,
  userName,
}: {
  locale: string;
  basePath: string;
  userName: string;
}) {
  return (
    <MindspaceIntakeGate channel="voice" locale={locale}>
      {(intakeId) => (
        <VoiceIntakeTest intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </MindspaceIntakeGate>
  );
}
