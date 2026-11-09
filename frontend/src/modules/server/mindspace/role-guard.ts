import "server-only";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/server/auth/get-session";
import {
  workspaceForRoles,
  type MindspaceRoleCode,
} from "@/modules/client/mindspace-dashboard/role-map";

const slugToRole: Record<string, MindspaceRoleCode> = {
  member: "member",
  listener: "listener",
  "listener-supervisor": "listener_supervisor",
  "safety-operations": "safety_operations_specialist",
  "platform-administrator": "platform_administrator",
};

/**
 * Redirects signed-in users away from a role workspace that their account
 * does not hold. Anonymous/dev requests fall through to the layout's own
 * auth handling.
 */
export async function enforceMindspaceRoleAccess(slug: string): Promise<void> {
  const required = slugToRole[slug];
  if (!required) return;

  const session = await getServerSession();
  if (!session) return;

  const roleValue = session.user?.role || session.session?.activeRole || "";
  const knownRoles = new Set<string>(Object.values(slugToRole));
  const roles = roleValue
    .split(",")
    .map((role) => role.trim())
    .filter((role) => knownRoles.has(role));

  // Legacy/dev roles (e.g. "patient") have no MindSpace workspace of their
  // own; redirecting them here would loop, so let the dashboard render.
  if (roles.length === 0) return;
  if (roles.includes(required)) return;

  const locale = await getLocale();
  redirect({ href: workspaceForRoles(roleValue), locale });
}
