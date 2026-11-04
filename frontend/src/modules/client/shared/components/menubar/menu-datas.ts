export const settingsSidebarData = {
  navGroups: [
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          url: "/bezs/settings/profile",
          icon: "user-circle",
        },
        {
          title: "Password & Auth",
          url: "/bezs/settings/security",
          icon: "key-round",
        },
        {
          title: "Active Sessions",
          url: "/bezs/settings/sessions",
          icon: "monitor-smartphone",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          title: "Appearance",
          url: "/bezs/settings/appearance",
          icon: "palette",
        },
      ],
    },
  ],
};

export const telemedicineSidebarData = {
  navGroups: [
    {
      title: "Doctor Portal",
      items: [
        {
          title: "Overview",
          url: "/bezs/telemedicine/doctor/dashboard",
          icon: "layout-dashboard",
        },
        {
          title: "Appointments",
          url: "/bezs/telemedicine/doctor/appointments",
          icon: "calendar",
        },
        {
          title: "Clinical Records",
          url: "/bezs/telemedicine/doctor/clinical-records",
          icon: "file-text",
        },
        {
          title: "AI EMR Assistant",
          url: "/bezs/telemedicine/doctor/emr",
          icon: "sparkles",
        },
        {
          title: "Video Consult Room",
          url: "/bezs/telemedicine/doctor/oc-demo",
          icon: "video",
        },
      ],
    },
    {
      title: "Patient Portal",
      items: [
        {
          title: "Patient Dashboard",
          url: "/bezs/telemedicine/patient",
          icon: "user",
        },
        {
          title: "Choose an intake",
          url: "/bezs/telemedicine/patient/intake/start",
          icon: "heart",
        },
        {
          title: "Chat intake",
          url: "/bezs/telemedicine/patient/intake",
          icon: "message-circle",
        },
        {
          title: "Voice intake",
          url: "/bezs/telemedicine/patient/appointments/intake",
          icon: "mic",
        },
        {
          title: "My Appointments",
          url: "/bezs/telemedicine/patient/appointments",
          icon: "calendar-check",
        },
        {
          title: "Health Records",
          url: "/bezs/telemedicine/patient/medical-records",
          icon: "clipboard-list",
        },
        {
          title: "Vitals & Stats",
          url: "/bezs/telemedicine/patient/vitals",
          icon: "activity",
        },
        {
          title: "AI Intake Agent",
          url: "/bezs/telemedicine/patient/ai-intake",
          icon: "bot",
        },
        {
          title: "AI Consultation",
          url: "/bezs/telemedicine/patient/ai-consultation",
          icon: "message-square",
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          title: "Admin Overview",
          url: "/bezs/telemedicine/admin/organizations",
          icon: "shield-check",
        },
        {
          title: "Healthcare Services",
          url: "/bezs/telemedicine/admin/healthcare-services",
          icon: "building-2",
        },
        {
          title: "Locations",
          url: "/bezs/telemedicine/admin/locations",
          icon: "map-pin",
        },
        {
          title: "Practitioners",
          url: "/bezs/telemedicine/admin/practitioners",
          icon: "users",
        },
      ],
    },
  ],
};
