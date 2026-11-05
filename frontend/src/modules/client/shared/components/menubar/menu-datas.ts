/**
 * Sidebar navigation data for the MindSpace app.
 *
 * Layer: client / shared / menubar
 *
 * Dynamically provides sidebar navigation filtered to the active role/workspace
 * so that each dashboard (Member, Listener, Supervisor, Safety, Admin) only shows
 * its own relevant pages.
 */

import { type NavGroup } from "./types";

export interface RoleNavConfig {
  title: string;
  navGroups: NavGroup[];
}

export const roleNavData: Record<string, RoleNavConfig> = {
  member: {
    title: "Member Space",
    navGroups: [
      {
        title: "My Space",
        items: [
          {
            title: "Overview",
            url: "/mindspace/member",
            icon: "layout-dashboard",
          },
          {
            title: "My support",
            url: "/mindspace/member/my-support",
            icon: "messages-square",
          },
          {
            title: "Wellbeing",
            url: "/mindspace/member/wellbeing",
            icon: "activity",
          },
          {
            title: "Mood tracking",
            url: "/mindspace/member/mood",
            icon: "smile",
          },
          {
            title: "Journal",
            url: "/mindspace/member/journal",
            icon: "book-open",
          },
          {
            title: "Goals",
            url: "/mindspace/member/goals",
            icon: "target",
          },
          {
            title: "Privacy & consent",
            url: "/mindspace/member/privacy",
            icon: "lock",
          },
        ],
      },
    ],
  },

  listener: {
    title: "Listener Workspace",
    navGroups: [
      {
        title: "Peer Support",
        items: [
          {
            title: "Overview",
            url: "/mindspace/listener",
            icon: "headphones",
          },
          {
            title: "Peer support queue",
            url: "/mindspace/listener/queue",
            icon: "users",
          },
          {
            title: "Active conversations",
            url: "/mindspace/listener/conversations",
            icon: "messages-square",
          },
          {
            title: "Training modules",
            url: "/mindspace/listener/training",
            icon: "book-open",
          },
          {
            title: "Availability & hours",
            url: "/mindspace/listener/availability",
            icon: "calendar",
          },
        ],
      },
    ],
  },

  "listener-supervisor": {
    title: "Supervisor Workspace",
    navGroups: [
      {
        title: "Supervision",
        items: [
          {
            title: "Overview",
            url: "/mindspace/listener-supervisor",
            icon: "users",
          },
          {
            title: "Listener roster",
            url: "/mindspace/listener-supervisor/listeners",
            icon: "users-round",
          },
          {
            title: "Training reviews",
            url: "/mindspace/listener-supervisor/training-reviews",
            icon: "book-open",
          },
          {
            title: "Quality check-ins",
            url: "/mindspace/listener-supervisor/quality",
            icon: "clipboard-check",
          },
        ],
      },
    ],
  },

  "safety-operations": {
    title: "Safety Operations",
    navGroups: [
      {
        title: "Safety Ops",
        items: [
          {
            title: "Overview",
            url: "/mindspace/safety-operations",
            icon: "life-buoy",
          },
          {
            title: "Assigned case queue",
            url: "/mindspace/safety-operations/case-queue",
            icon: "shield-alert",
          },
          {
            title: "Human handoffs",
            url: "/mindspace/safety-operations/handoffs",
            icon: "radio",
          },
          {
            title: "Safety resources",
            url: "/mindspace/safety-operations/resources",
            icon: "book-open",
          },
        ],
      },
    ],
  },

  "platform-administrator": {
    title: "Administration",
    navGroups: [
      {
        title: "Admin Tools",
        items: [
          {
            title: "Overview",
            url: "/mindspace/platform-administrator",
            icon: "shield",
          },
          {
            title: "Users & roles",
            url: "/mindspace/platform-administrator/users-roles",
            icon: "users",
          },
          {
            title: "Service health",
            url: "/mindspace/platform-administrator/service-health",
            icon: "activity",
          },
          {
            title: "Audit log",
            url: "/mindspace/platform-administrator/audit-log",
            icon: "clipboard-list",
          },
        ],
      },
    ],
  },

  all: {
    title: "All Workspaces",
    navGroups: [
      {
        title: "MindSpace Workspaces",
        items: [
          {
            title: "Member dashboard",
            url: "/mindspace/member",
            icon: "heart",
          },
          {
            title: "Listener dashboard",
            url: "/mindspace/listener",
            icon: "headphones",
          },
          {
            title: "Supervisor dashboard",
            url: "/mindspace/listener-supervisor",
            icon: "users-round",
          },
          {
            title: "Safety operations",
            url: "/mindspace/safety-operations",
            icon: "life-buoy",
          },
          {
            title: "Administrator",
            url: "/mindspace/platform-administrator",
            icon: "shield",
          },
        ],
      },
      {
        title: "Intake",
        items: [
          {
            title: "Choose an intake",
            url: "/intake",
            icon: "clipboard-list",
          },
          {
            title: "Chat intake",
            url: "/intake/chat",
            icon: "message-circle",
          },
          {
            title: "Voice intake",
            url: "/intake/voice",
            icon: "mic",
          },
        ],
      },
    ],
  },
};

/**
 * Returns the relevant navigation groups based on current URL path or user role.
 */
export function getMindspaceNavForPath(
  pathname: string,
  userRole?: string | null
): NavGroup[] {
  // Normalize path by stripping language prefix (/en, /hi, /ta, etc.)
  const cleanPath = pathname.replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");

  // Check URL: /mindspace/[role]
  const match = cleanPath.match(/^\/mindspace\/([^\/]+)/);
  if (match) {
    const roleSlug = match[1];
    if (roleNavData[roleSlug]) {
      return roleNavData[roleSlug].navGroups;
    }
  }

  // If path is under /intake, it is member intake flow
  if (cleanPath.startsWith("/intake")) {
    return roleNavData.member.navGroups;
  }

  // If path is exactly /mindspace or /mindspace/
  if (cleanPath === "/mindspace" || cleanPath === "/mindspace/") {
    return roleNavData.all.navGroups;
  }

  // Fallback to user role if provided and mapped
  if (userRole && roleNavData[userRole]) {
    return roleNavData[userRole].navGroups;
  }

  // Default to member navigation
  return roleNavData.member.navGroups;
}

// Backward-compatibility export
export const mindspaceSidebarData = roleNavData.all;
