from dataclasses import dataclass

DEMO_PASSWORD = "MindspaceDemo123!"


@dataclass(frozen=True)
class DemoUser:
    id: str
    email: str
    name: str
    role: str


# Deterministic ids keep the development seed in sync with MindSpace API principals.
DEMO_USERS: list[DemoUser] = [
    DemoUser("usr-demo-member-01", "member@mindspace.test", "Mira Sol", "member"),
    DemoUser("usr-demo-member-02", "member2@mindspace.test", "Rohan Mehta", "member"),
    DemoUser("usr-demo-member-03", "member3@mindspace.test", "Ananya Rao", "member"),
    DemoUser("usr-demo-listener-01", "listener@mindspace.test", "Jordan Lee", "listener"),
    DemoUser("usr-demo-listener-02", "listener2@mindspace.test", "Sam Rivera", "listener"),
    DemoUser("usr-demo-listener-03", "listener3@mindspace.test", "Priya Nair", "listener"),
    DemoUser("usr-demo-listener-04", "listener4@mindspace.test", "Alex Chen", "listener"),
    DemoUser("usr-demo-supervisor-01", "supervisor@mindspace.test", "Rae Kim", "listener_supervisor"),
    DemoUser("usr-demo-safety-01", "safety@mindspace.test", "Noor Haddad", "safety_operations_specialist"),
    DemoUser("usr-demo-admin-01", "admin@mindspace.test", "Ada Okafor", "platform_administrator"),
    DemoUser("usr-demo-agent-01", "agent@mindspace.test", "Wellbeing Guide Agent", "ai_agent_service"),
]

DEMO_USER_IDS: dict[str, str] = {u.email: u.id for u in DEMO_USERS}
