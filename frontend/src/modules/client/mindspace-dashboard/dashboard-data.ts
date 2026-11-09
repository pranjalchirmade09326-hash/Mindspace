import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  Headphones,
  Heart,
  Inbox,
  Layers,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MessagesSquare,
  Radio,
  Send,
  ShieldCheck,
  Shield,
  Smile,
  Target,
  TriangleAlert,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type MindspaceRoleId =
  | "member"
  | "listener"
  | "listener-supervisor"
  | "safety-operations"
  | "platform-administrator";

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
          { values: ["Building daily routines", "Unassigned", "Yesterday"], status: "Matching" },
        ],
      },
      {
        id: "wellbeing",
        title: "Wellbeing",
        description: "Your check-ins and self-guided activities. This is not a diagnosis or clinical record.",
        icon: Activity,
        columns: ["Activity", "Type", "Last updated"],
        rows: [
          { values: ["Weekly reflection", "Journal", "Today"], status: "Private" },
          { values: ["Small steps", "Goal", "Monday"], status: "In progress" },
        ],
      },
      {
        id: "mood",
        title: "Mood tracking",
        description: "Track your daily mood, emotional energy, triggers, and patterns over time.",
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
          { values: ["Share intake summary with a listener", "Allowed for this request", "Today"], status: "Optional" },
          { values: ["AI reflection assistance", "Enabled", "Last week"], status: "Optional" },
        ],
      },
      {
        id: "support-options",
        title: "Intake & support options",
        description: "Review your private intake history and the support options you selected. This is not a diagnosis.",
        icon: ClipboardCheck,
        columns: ["Intake", "Support option", "Updated"],
        rows: [
          { values: ["Private intake · Aug 12", "Talk with a trained listener", "Aug 12"], status: "Reviewed" },
          { values: ["Private intake · Jul 28", "Self-guided wellbeing plan", "Jul 28"], status: "Closed" },
        ],
      },
      {
        id: "privacy-requests",
        title: "Privacy requests",
        description: "Track export, correction, access, and deletion requests. Requests are verified before processing.",
        icon: ShieldCheck,
        columns: ["Request", "Type", "Submitted"],
        rows: [
          { values: ["PR-1042", "Export my data", "Oct 30"], status: "In review" },
          { values: ["PR-0987", "Correct display name", "Sep 18"], status: "Completed" },
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        description: "Optional reminders about your own wellbeing activities. You control every channel.",
        icon: Bell,
        columns: ["Reminder", "Channel", "Scheduled"],
        rows: [
          { values: ["Weekly reflection reminder", "In-app", "Tomorrow, 9:00 AM"], status: "Queued" },
          { values: ["Goal check-in", "Email", "Friday, 6:00 PM"], status: "Optional" },
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
        id: "conversations",
        title: "Conversations",
        description: "Manage assigned peer-support conversations. These are not therapy sessions.",
        icon: MessagesSquare,
        columns: ["Conversation", "Status", "Next step"],
        rows: [
          { values: ["Support space · M-104", "Active", "Reply when ready"], status: "Assigned" },
          { values: ["Daily routines · M-087", "Waiting", "Member follow-up"], status: "Follow-up" },
        ],
      },
      {
        id: "training",
        title: "Training",
        description: "Review peer-support guidance, safety boundaries, and required learning.",
        icon: BookOpen,
        columns: ["Module", "Progress", "Due"],
        rows: [
          { values: ["Active listening", "Complete", "—"], status: "Done" },
          { values: ["Boundaries & escalation", "80%", "Nov 15"], status: "In progress" },
        ],
      },
      {
        id: "availability",
        title: "Availability",
        description: "Set the times you may be available for peer-support requests.",
        icon: CalendarDays,
        columns: ["Day", "Window", "Status"],
        rows: [
          { values: ["Wednesday", "4:00–6:00 PM", "Available"], status: "Scheduled" },
          { values: ["Saturday", "10:00 AM–12:00 PM", "Available"], status: "Scheduled" },
        ],
      },
      {
        id: "offers",
        title: "Support offers",
        description: "Respond to matching offers. Accepting is voluntary and requires current eligibility.",
        icon: Inbox,
        columns: ["Offer", "Language", "Expires"],
        rows: [
          { values: ["Offer M-231 · routines", "English", "In 45 minutes"], status: "Awaiting reply" },
          { values: ["Offer M-228 · loneliness", "Hindi", "In 2 hours"], status: "Awaiting reply" },
        ],
      },
      {
        id: "application",
        title: "Application & eligibility",
        description: "Your application, eligibility window, capacity, and required training status.",
        icon: ClipboardCheck,
        columns: ["Requirement", "State", "Review"],
        rows: [
          { values: ["Listener application", "Approved", "Aug 2"], status: "Eligible" },
          { values: ["Safeguarding module", "Passed · expires 2027", "Aug 1"], status: "Current" },
          { values: ["Weekly capacity", "3 conversations", "Self-set"], status: "Active" },
        ],
      },
      {
        id: "feedback",
        title: "Feedback summary",
        description: "Aggregated member feedback without exposing private conversation content.",
        icon: Activity,
        columns: ["Period", "Rating", "Review"],
        rows: [
          { values: ["Last 30 days", "4.8 / 5 · 12 responses", "Reviewed by supervisor"], status: "Healthy" },
          { values: ["Previous 30 days", "4.6 / 5 · 9 responses", "Reviewed by supervisor"], status: "Healthy" },
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
      {
        id: "conduct-reports",
        title: "Conduct reports",
        description: "Review member-raised conduct concerns. Details stay encrypted and access is audited.",
        icon: TriangleAlert,
        columns: ["Report", "Category", "Opened"],
        rows: [
          { values: ["CR-054 · M-104", "Boundary concern", "Today, 8:40 AM"], status: "In review" },
          { values: ["CR-049 · M-087", "Communication preference", "Yesterday"], status: "Resolved" },
        ],
      },
      {
        id: "assignments",
        title: "Supervisor assignments",
        description: "Active listener-to-supervisor pairings used for readiness and quality support.",
        icon: UserCheck,
        columns: ["Listener", "Supervisor", "Since"],
        rows: [
          { values: ["Jordan Lee", "Rae Kim", "Jul 1"], status: "Active" },
          { values: ["Taylor Morgan", "Rae Kim", "Aug 12"], status: "Active" },
        ],
      },
      {
        id: "workload",
        title: "Workload overview",
        description: "Compare open conversation load against each listener's chosen capacity.",
        icon: Activity,
        columns: ["Listener", "Open conversations", "Capacity"],
        rows: [
          { values: ["Jordan Lee", "2", "3 per week"], status: "Within limit" },
          { values: ["Taylor Morgan", "3", "3 per week"], status: "At limit" },
          { values: ["Casey Patel", "0", "Training held"], status: "On hold" },
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
      {
        id: "case-actions",
        title: "Case actions",
        description: "Timestamped human actions recorded against a case. Free-text notes stay encrypted.",
        icon: ListChecks,
        columns: ["Case", "Action", "Recorded"],
        rows: [
          { values: ["Case S-204", "Contact pathway confirmed", "Today, 10:05 AM"], status: "Completed" },
          { values: ["Case S-204", "Approved resource shared", "Today, 9:58 AM"], status: "Completed" },
          { values: ["Case S-198", "Follow-up scheduled", "Yesterday"], status: "Attempted" },
        ],
      },
      {
        id: "followups",
        title: "Safety follow-ups",
        description: "Scheduled wellbeing check-ins. Completion is not implied until a human records it.",
        icon: FileClock,
        columns: ["Follow-up", "Member", "Due"],
        rows: [
          { values: ["FU-311", "M-104", "Tomorrow, 11:00 AM"], status: "Scheduled" },
          { values: ["FU-307", "M-087", "Today, 4:00 PM"], status: "Due" },
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
      {
        id: "workflow-registry",
        title: "Workflow registry",
        description: "Versioned P01–P09 process definitions, executions, and human tasks.",
        icon: Layers,
        columns: ["Process", "Version", "State"],
        rows: [
          { values: ["P05 · Listener matching", "1.0.0", "Active"], status: "Running" },
          { values: ["P03 · Safety escalation", "1.1.0", "Active"], status: "Running" },
          { values: ["P08 · Privacy requests", "0.9.0", "Draft"], status: "Draft" },
        ],
      },
      {
        id: "notification-queue",
        title: "Notification queue",
        description: "Queued references only; delivery is not claimed until a provider confirms it.",
        icon: Bell,
        columns: ["Type", "Channel", "Scheduled"],
        rows: [
          { values: ["support_followup", "In-app", "Today, 4:00 PM"], status: "Queued" },
          { values: ["weekly_reflection", "Email", "Friday, 9:00 AM"], status: "Queued" },
        ],
      },
      {
        id: "self-help-content",
        title: "Self-help content",
        description: "Draft, review, and approve non-clinical self-help content versions.",
        icon: BookOpen,
        columns: ["Content", "Locale", "Review"],
        rows: [
          { values: ["Grounding basics v3", "en", "Approved · Nov 1"], status: "Published" },
          { values: ["Sleep routines v1", "hi", "Awaiting second reviewer"], status: "Draft" },
        ],
      },
      {
        id: "eventing",
        title: "Eventing & outbox",
        description: "Transactional outbox backlog and idempotent consumer receipts. Payloads stay minimized.",
        icon: Send,
        columns: ["Event", "Aggregate", "Occurred"],
        rows: [
          { values: ["peer.match.accepted v1", "listener_match", "2 min ago"], status: "Unpublished" },
          { values: ["safety.case.closed v1", "safety_case", "18 min ago"], status: "Published" },
        ],
      },
    ],
  },
];

export function getDashboardRole(roleId: string): DashboardRole | undefined {
  return dashboardRoles.find((role) => role.id === roleId);
}
