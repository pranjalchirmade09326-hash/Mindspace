export const mindspaceRoleWorkspaces = {
  member: "/mindspace/member",
  listener: "/mindspace/listener",
  listener_supervisor: "/mindspace/supervisor",
  "listener-supervisor": "/mindspace/supervisor",
  supervisor: "/mindspace/supervisor",
  safety_operations_specialist: "/mindspace/safety",
  safety_operations: "/mindspace/safety",
  "safety-operations": "/mindspace/safety",
  safety: "/mindspace/safety",
  platform_administrator: "/mindspace/admin",
  "platform-administrator": "/mindspace/admin",
  admin: "/mindspace/admin",
} as const;

export type MindspaceRoleCode = keyof typeof mindspaceRoleWorkspaces;

const rolePriority: MindspaceRoleCode[] = [
  "platform_administrator",
  "platform-administrator",
  "admin",
  "safety_operations_specialist",
  "safety_operations",
  "safety-operations",
  "safety",
  "listener_supervisor",
  "listener-supervisor",
  "supervisor",
  "listener",
  "member",
];

export function normalizeRoleCode(role?: string | null): MindspaceRoleCode | null {
  if (!role || typeof role !== "string") return null;
  const lower = role.trim().toLowerCase().replace(/[-_]/g, "");
  if (lower.includes("supervisor")) return "listener_supervisor";
  if (lower.includes("safety")) return "safety_operations_specialist";
  if (lower.includes("admin")) return "platform_administrator";
  if (lower.includes("listener") || lower.includes("doctor")) return "listener";
  if (lower.includes("member") || lower.includes("patient")) return "member";
  return null;
}

export function parseRoles(value: string | null | undefined): MindspaceRoleCode[] {
  if (!value) return [];
  return value
    .split(",")
    .map((role) => normalizeRoleCode(role.trim()))
    .filter((role): role is MindspaceRoleCode => role !== null);
}

export function workspaceForRoles(value: string | null | undefined, locale?: string): string {
  const roles = parseRoles(value);
  const highest = rolePriority.find((role) => roles.includes(role)) ?? "member";
  const rawPath = mindspaceRoleWorkspaces[highest] ?? "/mindspace/member";
  if (locale) {
    const cleanPath = rawPath.replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");
    return `/${locale}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
  }
  return rawPath;
}
