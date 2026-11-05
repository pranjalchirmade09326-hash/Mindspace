import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Clock3,
  Database,
  Headphones,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Mic,
  ShieldAlert,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  dashboardRoles,
  getDashboardRole,
  type DashboardSection,
  type MindspaceRoleId,
} from "./dashboard-data";
import type { LiveDashboardData } from "@/modules/server/mindspace/dashboard-data";
import { DemoRoleButtons } from "./DemoRoleButtons";

function DemoBanner({ live }: { live?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        live
          ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
      }`}
    >
      <Database className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        {live
          ? "Live data from the MindSpace API. Sections without records show empty states rather than sample rows."
          : "Preview with sample data. Sign in with a MindSpace account to load live records."}
      </p>
    </div>
  );
}

function RoleSwitcher({ activeRole }: { activeRole?: MindspaceRoleId }) {
  return (
    <nav aria-label="MindSpace role dashboards" className="flex gap-2 overflow-x-auto pb-2">
      <Link
        href="/mindspace"
        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
          !activeRole
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card hover:bg-muted"
        }`}
      >
        <LayoutDashboard className="size-4" aria-hidden="true" />
        All workspaces
      </Link>
      {dashboardRoles.map((role) => {
        const Icon = role.icon;
        const selected = role.id === activeRole;
        return (
          <Link
            key={role.id}
            href={`/mindspace/${role.id}`}
            aria-current={selected ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {role.shortTitle}
          </Link>
        );
      })}
    </nav>
  );
}

function PortalHeader({
  role,
  section,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  section?: DashboardSection;
}) {
  const Icon = section?.icon ?? role.icon;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        {section && (
          <Link
            href={`/mindspace/${role.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to {role.shortTitle} dashboard
          </Link>
        )}
        <div className="flex items-center gap-3">
          <div className={`flex size-11 items-center justify-center rounded-2xl ${role.accent}`}>
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">MindSpace workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {section?.title ?? role.welcome}
            </h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          {section?.description ?? role.summary}
        </p>
      </div>
      <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1">
        <CircleCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
        {role.shortTitle} view
      </Badge>
    </div>
  );
}

function DashboardHome({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  // Live metrics replace sample values but keep the role's icon set; any
  // metric slot the API did not fill falls back to the sample metric.
  const metrics = live?.metrics?.length
    ? role.metrics.map((metric, index) => ({
        ...metric,
        ...(live.metrics![index] ?? {}),
      }))
    : role.metrics;
  const activities = live?.activities?.length ? live.activities : role.activities;

  return (
    <>
      <PortalHeader role={role} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="gap-3">
              <CardHeader className="flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-2xl">{metric.value}</CardTitle>
                </div>
                <span className={`rounded-xl p-2 ${role.accent}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{metric.note}</CardContent>
            </Card>
          );
        })}
      </div>

      {role.id === "member" && (
        <Card>
          <CardHeader>
            <CardTitle>Start an intake</CardTitle>
            <CardDescription>
              Choose chat or voice for a guided wellbeing intake. Your transcript
              is stored encrypted in your MindSpace account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/intake/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Chat intake
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/intake/voice"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Voice intake
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace pages</CardTitle>
            <CardDescription>Choose an area in your {role.shortTitle.toLowerCase()} workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {role.sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.id}
                  href={`/mindspace/${role.id}/${section.id}`}
                  className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-lg p-2 ${role.accent}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="mt-4 font-medium">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Illustrative activity for this role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activities.map((activity, index) => (
              <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  {index < activities.length - 1 && <span className="mt-1 h-full min-h-7 w-px bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{activity.title}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {activity.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {role.id === "safety-operations" && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Safety workflows shown here are sample-only. They do not provide
            emergency dispatch or imply that human support is staffed.
          </p>
        </div>
      )}
      {role.id === "platform-administrator" && (
        <p className="text-sm text-muted-foreground">
          Administrator access is designed to avoid default access to private conversation content.
        </p>
      )}
      {role.id === "ai-agent" && (
        <p className="text-sm text-muted-foreground">
          AI service identities are non-human principals limited to authorized typed tools, with no direct database access.
        </p>
      )}
    </>
  );
}

function SectionPage({
  role,
  section,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  section: DashboardSection;
  live?: LiveDashboardData | null;
}) {
  // When the API returned rows for this section they replace the sample
  // table; otherwise the sample preview remains visible.
  const override = live?.sections?.[section.id];
  const columns = override?.columns ?? section.columns;
  const rows = override?.rows ?? section.rows;

  return (
    <>
      <PortalHeader role={role} section={section} />
      {role.id === "safety-operations" && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>Sample workflow only. Use approved, staffed human-led procedures; this is not an emergency service.</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>
            {override ? "Live records from the MindSpace API." : "Sample records for interface preview only."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="hidden gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
          >
            {columns.map((column) => <span key={column}>{column}</span>)}
            <span>Status</span>
          </div>
          {rows.map((row, index) => (
            <div
              key={`${section.id}-${index}`}
              className="grid gap-3 rounded-xl border p-4 md:items-center md:gap-4"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) auto` }}
            >
              {row.values.map((value, valueIndex) => (
                <div key={`${section.id}-${index}-${valueIndex}`} className="min-w-0">
                  <p className="text-xs text-muted-foreground md:hidden">{columns[valueIndex]}</p>
                  <p className="break-words text-sm">{value}</p>
                </div>
              ))}
              <Badge variant="secondary" className="w-fit">{row.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowDownRight className="size-4" aria-hidden="true" />
        Actions and records are examples; connecting them to live services is a later step.
      </div>
    </>
  );
}

function AuthRequired({ role }: { role: { title: string; shortTitle: string } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in required</CardTitle>
        <CardDescription>
          The {role.shortTitle} dashboard shows live records from your MindSpace
          account. Sign in to continue — sample data is not shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Member workspace — dedicated layout with a left sidebar of member pages and
 * prominent chat/voice intake actions in the main area.
 *
 * Only the member role uses this layout; other roles keep the generic
 * DashboardHome grid.
 */
function MemberDashboard({
  role,
  live,
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  live?: LiveDashboardData | null;
}) {
  const metrics = live?.metrics?.length
    ? role.metrics.map((metric, index) => ({
        ...metric,
        ...(live.metrics![index] ?? {}),
      }))
    : role.metrics;
  const activities = live?.activities?.length ? live.activities : role.activities;

  // Sidebar entries: intake actions first, then the member's workspace pages.
  const memberNav = [
    { id: "intake-chat", title: "Chat intake", href: "/intake/chat", icon: MessageCircle, primary: true },
    { id: "intake-voice", title: "Voice intake", href: "/intake/voice", icon: Mic, primary: true },
    ...role.sections.map((section) => ({
      id: section.id,
      title: section.title,
      href: `/mindspace/${role.id}/${section.id}`,
      icon: section.icon,
      primary: false,
    })),
  ];

  return (
    <div className="space-y-6 py-2">
      <DemoBanner live={live?.live} />
      <RoleSwitcher activeRole={role.id} />

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Left sidebar — member pages only */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">My space</CardTitle>
              <CardDescription>Member pages and intake</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {memberNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.primary
                        ? "font-medium text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.title}
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Main area — intake first, then workspace pages */}
        <div className="space-y-6 min-w-0">
          <PortalHeader role={role} />

          {/* Prominent intake actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/intake/chat"
              className="group rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary hover:bg-primary/10"
            >
              <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MessageCircle className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">Chat intake</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Talk through what&apos;s on your mind in a guided conversation.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Start chatting <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/intake/voice"
              className="group rounded-2xl border-2 border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-foreground">
                <Mic className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">Voice intake</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Prefer to speak? A voice-guided intake, transcribed privately.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                Start speaking <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="gap-3">
                  <CardHeader className="flex-row items-start justify-between">
                    <div className="space-y-1">
                      <CardDescription>{metric.label}</CardDescription>
                      <CardTitle className="text-2xl">{metric.value}</CardTitle>
                    </div>
                    <span className={`rounded-xl p-2 ${role.accent}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{metric.note}</CardContent>
                </Card>
              );
            })}
          </div>

          {/* Workspace pages */}
          <Card>
            <CardHeader>
              <CardTitle>My pages</CardTitle>
              <CardDescription>Support, wellbeing, and privacy for your account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {role.sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.id}
                    href={`/mindspace/${role.id}/${section.id}`}
                    className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-lg p-2 ${role.accent}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="mt-4 font-medium">{section.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {activities.map((activity, index) => (
                <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    {index < activities.length - 1 && <span className="mt-1 h-full min-h-7 w-px bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{activity.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="size-3" aria-hidden="true" />
                        {activity.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MindspaceRoleDashboard({
  roleId,
  live,
}: {
  roleId: string;
  live?: LiveDashboardData | null;
}) {
  const role = getDashboardRole(roleId);
  if (!role) notFound();

  // Live fetch was attempted and failed (no session / API unreachable) —
  // show a sign-in prompt instead of sample records.
  if (live && !live.live) {
    return (
      <div className="space-y-6 py-2">
        <RoleSwitcher activeRole={role.id} />
        <PortalHeader role={role} />
        <AuthRequired role={role} />
      </div>
    );
  }

  // The member workspace gets a dedicated sidebar + intake-first layout.
  if (role.id === "member") {
    return <MemberDashboard role={role} live={live} />;
  }

  return (
    <div className="space-y-6 py-2">
      <DemoBanner live={live?.live} />
      <RoleSwitcher activeRole={role.id} />
      <DashboardHome role={role} live={live} />
    </div>
  );
}

export function MindspaceRoleSection({
  roleId,
  sectionId,
  live,
}: {
  roleId: string;
  sectionId: string;
  live?: LiveDashboardData | null;
}) {
  const role = getDashboardRole(roleId);
  const section = role?.sections.find((item) => item.id === sectionId);
  if (!role || !section) notFound();

  if (live && !live.live) {
    return (
      <div className="space-y-6 py-2">
        <RoleSwitcher activeRole={role.id} />
        <PortalHeader role={role} section={section} />
        <AuthRequired role={role} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <DemoBanner live={live?.live} />
      <RoleSwitcher activeRole={role.id} />
      <SectionPage role={role} section={section} live={live} />
    </div>
  );
}

export function MindspaceWorkspaceIndex() {
  return (
    <div className="space-y-6 py-2">
      <DemoBanner />
      <RoleSwitcher />
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">MindSpace role workspaces</p>
        <h1 className="text-3xl font-semibold tracking-tight">Choose a workspace</h1>
        <p className="max-w-3xl text-muted-foreground">
          A starting structure for each product role. Choose a dashboard to preview its pages and sample data.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardRoles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <span className={`mb-2 flex size-11 items-center justify-center rounded-2xl ${role.accent}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle>{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {role.sections.length} workspace pages
                </span>
                <Link
                  href={`/mindspace/${role.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Open dashboard
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demo sign-in — picks a MindSpace role and creates a local dev
          session, then lands on that role's dashboard. Live API data still
          requires the MindSpace identity provider to be reachable. */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Demo sign-in</CardTitle>
          <CardDescription>
            Choose a role to preview its workspace. Sign in with a real
            MindSpace account to load live records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemoRoleButtons />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Role pages are interface previews only. Live authentication, access control, and persistence are not part of this demo.
      </p>
    </div>
  );
}
