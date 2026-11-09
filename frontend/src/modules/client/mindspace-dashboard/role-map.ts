export const mindspaceRoleWorkspaces = {
  member: "/mindspace/member",
  listener: "/mindspace/listener",
  listener_supervisor: "/mindspace/listener-supervisor",
  safety_operations_specialist: "/mindspace/safety-operations",
  platform_administrator: "/mindspace/platform-administrator",
} as const;

export type MindspaceRoleCode = keyof typeof mindspaceRoleWorkspaces;

const rolePriority: MindspaceRoleCode[] = [
  "platform_administrator",
  "safety_operations_specialist",
  "listener_supervisor",
  "listener",
  "member",
];

function parseRoles(value: string | null | undefined): MindspaceRoleCode[] {
  if (!value) return [];
  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is MindspaceRoleCode => role in mindspaceRoleWorkspaces);
}

export function workspaceForRoles(value: string | null | undefined): string {
  const roles = parseRoles(value);
  const highest = rolePriority.find((role) => roles.includes(role));
  return highest ? mindspaceRoleWorkspaces[highest] : mindspaceRoleWorkspaces.member;
}
