"use client";

import { MindspaceIntakeGate } from "./MindspaceIntakeGate";
import { TextIntake } from "./TextIntake";

export function MindspaceTextIntake({
  locale,
  basePath,
  userName,
}: {
  locale: string;
  basePath: string;
  userName: string;
}) {
  return (
    <MindspaceIntakeGate channel="text" locale={locale}>
      {(intakeId) => (
        <TextIntake intakeId={intakeId} basePath={basePath} userName={userName} />
      )}
    </MindspaceIntakeGate>
  );
}
