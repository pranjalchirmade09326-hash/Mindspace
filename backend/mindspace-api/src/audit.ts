import { prisma } from "./db.js";

type AuditEntry = {
  actorUserId: string;
  actionCode: string;
  resourceType: string;
  resourceId?: string;
  correlationId: string;
  outcome?: "success" | "denied" | "failure";
};

export async function recordAudit(entry: AuditEntry) {
  await prisma.auditEvent.create({
    data: {
      actorUserId: entry.actorUserId,
      actorType: "user",
      actionCode: entry.actionCode,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      purposeCode: "member_access",
      outcome: entry.outcome ?? "success",
      correlationId: entry.correlationId,
    },
  });
}
