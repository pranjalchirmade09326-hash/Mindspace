/**
 * Sidebar navigation data for the MindSpace app.
 *
 * Layer: client / shared / menubar
 *
 * Single source of truth for the sidebar links. MindSpace-only — the legacy
 * telemedicine/FHIR navigation has been removed. Role dashboards live under
 * /mindspace/[role]; intake flows live under /intake/*.
 */

export const mindspaceSidebarData = {
  navGroups: [
    {
      title: "MindSpace",
      items: [
        {
          title: "All workspaces",
          url: "/mindspace",
          icon: "layout-dashboard",
        },
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
};
