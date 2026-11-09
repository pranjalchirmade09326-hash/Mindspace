import type { RoleCode } from "./roles.js";

export const demoPassword = "MindspaceDemo123!";

export type DemoUser = {
  id: string;
  email: string;
  name: string;
  role: RoleCode;
};

// Deterministic IDs keep the development seed in sync with MindSpace API
// principals. They are only used when these exact email addresses sign up.
export const demoUsers: DemoUser[] = [
  { id: "usr-demo-member-01", email: "member@mindspace.test", name: "Mira Sol", role: "member" },
  { id: "usr-demo-member-02", email: "member2@mindspace.test", name: "Rohan Mehta", role: "member" },
  { id: "usr-demo-member-03", email: "member3@mindspace.test", name: "Ananya Rao", role: "member" },
  { id: "usr-demo-listener-01", email: "listener@mindspace.test", name: "Jordan Lee", role: "listener" },
  { id: "usr-demo-listener-02", email: "listener2@mindspace.test", name: "Sam Rivera", role: "listener" },
  { id: "usr-demo-listener-03", email: "listener3@mindspace.test", name: "Priya Nair", role: "listener" },
  { id: "usr-demo-listener-04", email: "listener4@mindspace.test", name: "Alex Chen", role: "listener" },
  { id: "usr-demo-supervisor-01", email: "supervisor@mindspace.test", name: "Rae Kim", role: "listener_supervisor" },
  { id: "usr-demo-safety-01", email: "safety@mindspace.test", name: "Noor Haddad", role: "safety_operations_specialist" },
  { id: "usr-demo-admin-01", email: "admin@mindspace.test", name: "Ada Okafor", role: "platform_administrator" },
  { id: "usr-demo-agent-01", email: "agent@mindspace.test", name: "Wellbeing Guide Agent", role: "ai_agent_service" },
];

export const demoUserIds: Readonly<Record<string, string>> = Object.fromEntries(
  demoUsers.map((user) => [user.email, user.id]),
);
