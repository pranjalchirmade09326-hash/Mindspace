/**
 * Seed demo role assignments for a MindSpace user.
 *
 * Usage:
 *   pnpm tsx scripts/seed-demo-roles.ts <userId> [roleCode ...]
 *
 * <userId> is the `sub` claim of the user's MindSpace JWT — i.e. the user id
 * from the identity provider (bezs-iam). With no role args, grants all five
 * product roles so every dashboard can be previewed with one account.
 *
 * Dev/demo tool only — do not run against production data.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_ROLES = [
  "member",
  "listener",
  "listener_supervisor",
  "safety_operations_specialist",
  "platform_administrator",
] as const;

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: pnpm tsx scripts/seed-demo-roles.ts <userId> [roleCode ...]");
    process.exit(1);
  }
  const roles =
    process.argv.slice(3).length > 0
      ? process.argv.slice(3)
      : [...ALL_ROLES];

  // Ensure the principal row exists (provision endpoint normally does this,
  // but seeding must work before the first API call too).
  await prisma.appPrincipal.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  for (const roleCode of roles) {
    const existing = await prisma.roleAssignment.findFirst({
      where: { userId, roleCode, assignmentState: "active" },
    });
    if (existing) {
      console.log(`skip  ${roleCode} (already active)`);
      continue;
    }
    await prisma.roleAssignment.create({
      data: {
        userId,
        roleCode,
        assignmentState: "active",
        decisionReason: "Demo seed — local development only",
      },
    });
    console.log(`grant ${roleCode}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
