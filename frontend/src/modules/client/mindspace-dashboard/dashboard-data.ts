import {
  Activity,
  Bot,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Headphones,
  Heart,
  LifeBuoy,
  LockKeyhole,
  MessagesSquare,
  Radio,
  ShieldCheck,
  Shield,
  Smile,
  Target,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type MindspaceRoleId =
  | "member"
  | "listener"
  | "listener-supervisor"
  | "safety-operations"
  | "platform-administrator"
  | "ai-agent";

export type DashboardSection = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  columns: string[];
  rows: { values: string[]; status: string }[];
};

export type DashboardRole = {
  id: MindspaceRoleId;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  welcome: string;
  summary: string;
  metrics: { label: string; value: string; note: string; icon: LucideIcon }[];
  activities: { title: string; detail: string; time: string }[];
  sections: DashboardSection[];
};

export const dashboardRoles: DashboardRole[] = [
  {
    id: "member",
    title: "Member",
    shortTitle: "Member",
    description: "A private space for wellbeing, reflection, and peer support.",
    icon: Heart,
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    welcome: "Your wellbeing space",
    summary: "Take things at your own pace. Choose a support option that feels right for you.",
    metrics: [
      { label: "Wellbeing check-ins", value: "3", note: "This week", icon: Activity },
      { label: "Saved reflections", value: "8", note: "Private to you", icon: BookOpen },
      { label: "Support conversations", value: "1", note: "In progress", icon: MessagesSquare },
    ],
    activities: [
      { title: "Weekly reflection", detail: "A private note is ready to continue.", time: "Today" },
      { title: "Listener match", detail: "Your support request is being reviewed.", time: "Yesterday" },
      { title: "Wellbeing check-in", detail: "You completed a short mood check-in.", time: "Mon" },
    ],
    sections: [
      {
        id: "my-support",
        title: "My support",
        description: "Review peer-support requests and conversations you chose to share.",
        icon: MessagesSquare,
        columns: ["Support request", "Listener", "Updated"],
        rows: [
          { values: ["A space to talk", "Alex R.", "Today, 10:30 AM"], status: "Active" },
          { values: ["Building daily routines", "Matching in queue", "Yesterday"], status: "Matching" },
        ],
      },
      {
        id: "wellbeing",
        title: "Wellbeing",
        description: "Your check-ins and self-guided activities. This is not a diagnosis or clinical record.",
        icon: Activity,
        columns: ["Activity", "Type", "Last updated"],
        rows: [
          { values: ["Weekly reflection", "Reflection", "Today"], status: "Completed" },
          { values: ["Box breathing exercise", "Exercise", "Monday"], status: "Completed" },
          { values: ["Sleep schedule reset", "Self-care", "3 days ago"], status: "In progress" },
        ],
      },
      {
        id: "mood",
        title: "Mood tracking",
        description: "Track your daily mood, emotions, and wellbeing trends over time.",
        icon: Smile,
        columns: ["Date", "Mood score", "Energy", "Tags", "Triggers"],
        rows: [
          { values: ["Today, 9:00 AM", "7/10 (Calm)", "Moderate", "Peaceful, Focused", "Morning walk"], status: "Logged" },
          { values: ["Yesterday, 8:30 PM", "5/10 (Neutral)", "Low", "Tired, Pensive", "Work deadline"], status: "Logged" },
          { values: ["Nov 3, 10:15 AM", "8/10 (Optimistic)", "High", "Grateful, Energetic", "Good sleep, Coffee"], status: "Logged" },
        ],
      },
      {
        id: "journal",
        title: "Journal",
        description: "A private space for daily reflections, guided prompts, and gratitude notes.",
        icon: BookOpen,
        columns: ["Title", "Prompt", "Word count", "Date"],
        rows: [
          { values: ["Finding grounding in uncertainty", "What helped you feel steady today?", "248 words", "Today, 11:20 AM"], status: "Private" },
          { values: ["Gratitude for small moments", "Three things you appreciated", "182 words", "Nov 2"], status: "Private" },
          { values: ["Reflecting on boundaries", "Freeform entry", "315 words", "Oct 30"], status: "Private" },
        ],
      },
      {
        id: "goals",
        title: "Goals",
        description: "Set, track, and celebrate small achievable wellbeing goals.",
        icon: Target,
        columns: ["Goal", "Category", "Streak", "Progress"],
        rows: [
          { values: ["10-minute mindful breathing", "Mindfulness", "5-day streak", "5/7 days this week"], status: "On track" },
          { values: ["Evening digital wind-down by 10 PM", "Sleep", "3-day streak", "4/7 days this week"], status: "On track" },
          { values: ["Daily 20-minute gentle walk", "Movement", "7-day streak", "7/7 days this week"], status: "Completed" },
        ],
      },
      {
        id: "privacy",
        title: "Privacy & consent",
        description: "Review what you have chosen to share and manage your preferences.",
        icon: LockKeyhole,
        columns: ["Preference", "Choice", "Updated"],
        rows: [
          { values: ["Share intake summary with matched listener", "Allowed for active requests", "Today"], status: "Active" },
          { values: ["Pseudonymous peer display name", "Enabled (Displaying Member-408)", "Last week"], status: "Protected" },
          { values: ["AI reflection assistant insights", "Enabled for private reflections", "Oct 15"], status: "Optional" },
        ],
      },
    ],
  },
  {
    id: "listener",
    title: "Listener",
    shortTitle: "Listener",
    description: "A workspace for trained, non-clinical peer support.",
    icon: Headphones,
    accent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    welcome: "Listener workspace",
    summary: "Offer a warm, respectful conversation while keeping clear peer-support boundaries.",
    metrics: [
      { label: "Open conversations", value: "2", note: "One needs a reply", icon: MessagesSquare },
      { label: "Hours available", value: "4", note: "This week", icon: CalendarDays },
      { label: "Training progress", value: "80%", note: "One module remaining", icon: BookOpen },
    ],
    activities: [
      { title: "New support request", detail: "A member is looking for a conversation.", time: "12 min ago" },
      { title: "Conversation follow-up", detail: "A check-in reminder is scheduled.", time: "Yesterday" },
      { title: "Boundaries refresher", detail: "Continue your learning module.", time: "This week" },
    ],
    sections: [
      {
        id: "queue",
        title: "Peer support queue",
        description: "Review incoming member help requests with triage urgency, topics, and language preferences to accept or defer.",
        icon: Users,
        columns: ["Member alias", "Topic", "Language", "Urgency", "Wait time"],
        rows: [
          { values: ["Member-712", "Work burnout & boundary stress", "English", "Elevated", "6 min ago"], status: "Awaiting match" },
          { values: ["Member-489", "Social anxiety & loneliness", "English, Hindi", "Standard", "14 min ago"], status: "Offered to you" },
          { values: ["Member-305", "Academic pressure & motivation", "English", "Standard", "22 min ago"], status: "Awaiting match" },
        ],
      },
      {
        id: "conversations",
        title: "Active conversations",
        description: "Manage ongoing supportive peer chats, message threads, and private listener reflections within non-clinical boundaries.",
        icon: MessagesSquare,
        columns: ["Conversation", "Member alias", "Last message", "Status"],
        rows: [
          { values: ["Support space · C-104", "Member-602", "Thank you for listening, that helps clarify things.", "Reply pending"], status: "Active" },
          { values: ["Daily routines · C-087", "Member-319", "Scheduled follow-up for tomorrow afternoon.", "Scheduled"], status: "Follow-up" },
        ],
      },
      {
        id: "training",
        title: "Training modules",
        description: "Complete peer-support learning modules, safety boundary certifications, and escalation protocol reviews.",
        icon: BookOpen,
        columns: ["Module", "Category", "Estimated time", "Progress"],
        rows: [
          { values: ["Active & Empathetic Listening Fundamentals", "Core Skills", "30 mins", "100% Completed"], status: "Certified" },
          { values: ["Maintaining Non-Clinical Peer Boundaries", "Ethics & Safety", "45 mins", "85% in progress"], status: "Due Nov 15" },
          { values: ["Crisis Identification & Safety Escalation Protocols", "Crisis & Escalation", "40 mins", "100% Completed"], status: "Certified" },
        ],
      },
      {
        id: "availability",
        title: "Availability & hours",
        description: "Manage your live listening status (Online, Paused, Offline), weekly shifts, and concurrent conversation capacity.",
        icon: CalendarDays,
        columns: ["Day / Schedule", "Time window", "Max capacity", "Status"],
        rows: [
          { values: ["Wednesday (Today)", "4:00 PM – 7:00 PM EST", "2 concurrent chats", "Online & Accepting"], status: "Active shift" },
          { values: ["Friday", "2:00 PM – 5:00 PM EST", "2 concurrent chats", "Scheduled"], status: "Upcoming" },
          { values: ["Saturday", "10:00 AM – 1:00 PM EST", "1 concurrent chat", "Scheduled"], status: "Upcoming" },
        ],
      },
    ],
  },
  {
    id: "listener-supervisor",
    title: "Listener supervisor",
    shortTitle: "Supervisor",
    description: "Support listener readiness, workload, and quality practices.",
    icon: UsersRound,
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    welcome: "Listener supervision",
    summary: "Help listeners deliver safe, consistent peer support with clear boundaries.",
    metrics: [
      { label: "Active listeners", value: "18", note: "Across the program", icon: UsersRound },
      { label: "Reviews due", value: "4", note: "This week", icon: ClipboardCheck },
      { label: "Training follow-ups", value: "3", note: "Need attention", icon: BookOpen },
    ],
    activities: [
      { title: "Readiness review", detail: "Two listener check-ins are due this week.", time: "Today" },
      { title: "Training follow-up", detail: "A boundaries module needs review.", time: "Yesterday" },
      { title: "Workload overview", detail: "One listener is nearing their weekly limit.", time: "Monday" },
    ],
    sections: [
      {
        id: "listeners",
        title: "Listener roster",
        description: "Review listener readiness and workload summaries.",
        icon: UsersRound,
        columns: ["Listener", "Readiness", "Open conversations"],
        rows: [
          { values: ["Jordan Lee", "Ready", "2"], status: "Active" },
          { values: ["Taylor Morgan", "Review due", "1"], status: "Check-in" },
          { values: ["Casey Patel", "Training needed", "0"], status: "On hold" },
        ],
      },
      {
        id: "training-reviews",
        title: "Training reviews",
        description: "Track required learning and follow up on training needs.",
        icon: BookOpen,
        columns: ["Listener", "Module", "Due"],
        rows: [
          { values: ["Taylor Morgan", "Boundaries refresher", "Nov 8"], status: "Due soon" },
          { values: ["Casey Patel", "Safety escalation basics", "Nov 10"], status: "Overdue" },
        ],
      },
      {
        id: "quality",
        title: "Quality check-ins",
        description: "Document supportive supervision and non-clinical quality follow-ups.",
        icon: ClipboardCheck,
        columns: ["Check-in", "Owner", "Status"],
        rows: [
          { values: ["Monthly listener check-in", "Jordan Lee", "Scheduled Nov 7"], status: "Scheduled" },
          { values: ["Workload review", "Taylor Morgan", "Needs follow-up"], status: "Open" },
        ],
      },
    ],
  },
  {
    id: "safety-operations",
    title: "Safety operations specialist",
    shortTitle: "Safety operations",
    description: "Review assigned safety cases and coordinate human handoffs.",
    icon: LifeBuoy,
    accent: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    welcome: "Safety operations",
    summary: "Work only on assigned cases using approved human-led safety procedures.",
    metrics: [
      { label: "Assigned cases", value: "3", note: "Review promptly", icon: ShieldCheck },
      { label: "Handoffs pending", value: "1", note: "Needs coordination", icon: Radio },
      { label: "Follow-ups due", value: "2", note: "Today", icon: CalendarDays },
    ],
    activities: [
      { title: "Assigned case", detail: "A human review is waiting in your queue.", time: "8 min ago" },
      { title: "Handoff follow-up", detail: "Confirm the approved contact pathway.", time: "Today" },
      { title: "Procedure reminder", detail: "Use the current reviewed safety guidance.", time: "This week" },
    ],
    sections: [
      {
        id: "case-queue",
        title: "Assigned case queue",
        description: "Only handle cases assigned to you and follow approved operational procedures.",
        icon: ShieldCheck,
        columns: ["Case", "Priority", "Assigned at"],
        rows: [
          { values: ["Case S-204", "Needs review", "Today, 9:42 AM"], status: "Assigned" },
          { values: ["Case S-198", "Follow-up", "Yesterday"], status: "Assigned" },
        ],
      },
      {
        id: "handoffs",
        title: "Human handoffs",
        description: "Coordinate human handoffs using approved, staffed pathways only.",
        icon: Radio,
        columns: ["Handoff", "Pathway", "Next step"],
        rows: [
          { values: ["Handoff H-051", "Approved local support resource", "Confirm connection"], status: "Pending" },
        ],
      },
      {
        id: "resources",
        title: "Safety resources",
        description: "Reference reviewed local resources and escalation procedures.",
        icon: LifeBuoy,
        columns: ["Resource", "Coverage", "Review date"],
        rows: [
          { values: ["Local support directory", "Configured region", "Nov 1"], status: "Reviewed" },
          { values: ["Internal escalation guide", "Staffed hours only", "Oct 28"], status: "Reviewed" },
        ],
      },
    ],
  },
  {
    id: "platform-administrator",
    title: "Platform administrator",
    shortTitle: "Administrator",
    description: "Manage platform operations while protecting private conversation content.",
    icon: Shield,
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    welcome: "Platform administration",
    summary: "Oversee service health, access, and audit activity with least-privilege access.",
    metrics: [
      { label: "Platform status", value: "Healthy", note: "All demo services", icon: Activity },
      { label: "Access reviews", value: "5", note: "Due this month", icon: ShieldCheck },
      { label: "Audit events", value: "24", note: "Last 24 hours", icon: ClipboardCheck },
    ],
    activities: [
      { title: "Access review due", detail: "Review a pending role assignment.", time: "Today" },
      { title: "Service status", detail: "All configured demo services are operational.", time: "Today" },
      { title: "Audit log", detail: "A role change was recorded.", time: "Yesterday" },
    ],
    sections: [
      {
        id: "users-roles",
        title: "Users & roles",
        description: "Manage account access and role assignments. Use least privilege.",
        icon: UsersRound,
        columns: ["Account", "Role", "Access review"],
        rows: [
          { values: ["listener@example.test", "Listener", "Due Nov 30"], status: "Active" },
          { values: ["safety@example.test", "Safety operations", "Reviewed Nov 1"], status: "Active" },
        ],
      },
      {
        id: "service-health",
        title: "Service health",
        description: "Review high-level platform availability without exposing private conversations.",
        icon: Activity,
        columns: ["Service", "Status", "Last checked"],
        rows: [
          { values: ["Authentication", "Operational", "Just now"], status: "Healthy" },
          { values: ["Peer support", "Operational", "Just now"], status: "Healthy" },
        ],
      },
      {
        id: "audit-log",
        title: "Audit log",
        description: "Review access and configuration events. Sensitive conversation content is excluded.",
        icon: ClipboardCheck,
        columns: ["Event", "Actor", "Time"],
        rows: [
          { values: ["Role assignment reviewed", "admin@example.test", "Today, 9:14 AM"], status: "Recorded" },
          { values: ["Service configuration updated", "admin@example.test", "Yesterday"], status: "Recorded" },
        ],
      },
    ],
  },
  {
    id: "ai-agent",
    title: "AI agent service identity",
    shortTitle: "AI agent",
    description: "A non-human identity limited to approved, typed application tools.",
    icon: Bot,
    accent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    welcome: "AI service operations",
    summary: "Monitor agent identity, authorized tools, and execution history. Agents have no direct database access.",
    metrics: [
      { label: "Registered identities", value: "2", note: "Non-human principals", icon: Bot },
      { label: "Authorized tools", value: "6", note: "Scoped permissions", icon: LockKeyhole },
      { label: "Tool runs", value: "42", note: "Last 24 hours", icon: Activity },
    ],
    activities: [
      { title: "Tool invocation", detail: "A typed wellbeing-summary tool completed.", time: "6 min ago" },
      { title: "Permission review", detail: "One agent grant is due for review.", time: "Today" },
      { title: "Safety boundary", detail: "No direct database access is granted.", time: "Always" },
    ],
    sections: [
      {
        id: "registered-agents",
        title: "Registered agents",
        description: "Review non-human identities and their approved application purpose.",
        icon: Bot,
        columns: ["Identity", "Purpose", "Status"],
        rows: [
          { values: ["wellbeing-guide", "Guided reflection", "Enabled"], status: "Scoped" },
          { values: ["intake-helper", "Optional intake support", "Enabled"], status: "Scoped" },
        ],
      },
      {
        id: "authorized-tools",
        title: "Authorized tools",
        description: "Agents can use only explicitly granted typed tools; direct database access is not allowed.",
        icon: LockKeyhole,
        columns: ["Tool", "Permission scope", "Review"],
        rows: [
          { values: ["create_reflection_summary", "Member-authorized reflection", "Reviewed"], status: "Allowed" },
          { values: ["suggest_support_options", "Approved support directory", "Reviewed"], status: "Allowed" },
        ],
      },
      {
        id: "run-history",
        title: "Execution history",
        description: "Review tool-level operational metadata without displaying private conversation content.",
        icon: Activity,
        columns: ["Invocation", "Tool", "Time"],
        rows: [
          { values: ["RUN-1042", "create_reflection_summary", "Today, 10:21 AM"], status: "Succeeded" },
          { values: ["RUN-1041", "suggest_support_options", "Today, 9:58 AM"], status: "Succeeded" },
        ],
      },
    ],
  },
];

export function getDashboardRole(roleId: string): DashboardRole | undefined {
  return dashboardRoles.find((role) => role.id === roleId);
}
