export const roleCodes = [
  "member",
  "listener",
  "listener_supervisor",
  "safety_operations_specialist",
  "platform_administrator",
  "ai_agent_service",
] as const;

export type RoleCode = (typeof roleCodes)[number];

export const recognizedRoleCodes: ReadonlySet<string> = new Set(roleCodes);

export function parseRoles(value: string | null | undefined): RoleCode[] {
  if (!value) return [];
  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is RoleCode => recognizedRoleCodes.has(role));
}

export function primaryRole(value: string | null | undefined): RoleCode | null {
  const roles = parseRoles(value);
  return roles[0] ?? null;
}

// Workspace slugs used by the frontend MindSpace dashboards.
export const roleWorkspacePath: Record<RoleCode, string> = {
  member: "/mindspace/member",
  listener: "/mindspace/listener",
  listener_supervisor: "/mindspace/listener-supervisor",
  safety_operations_specialist: "/mindspace/safety-operations",
  platform_administrator: "/mindspace/platform-administrator",
  ai_agent_service: "/mindspace/ai-agent",
};

const rolePriority: RoleCode[] = [
  "platform_administrator",
  "safety_operations_specialist",
  "listener_supervisor",
  "listener",
  "ai_agent_service",
  "member",
];

export function workspaceForRoles(value: string | null | undefined): string {
  const roles = parseRoles(value);
  const highest = rolePriority.find((role) => roles.includes(role));
  return highest ? roleWorkspacePath[highest] : "/mindspace/member";
}
