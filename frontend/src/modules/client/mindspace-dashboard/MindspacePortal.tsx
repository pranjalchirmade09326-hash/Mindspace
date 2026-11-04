import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Clock3,
  Database,
  LayoutDashboard,
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

function DemoBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
      <Database className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        Preview with sample data. This screen is not connected to the database or
        live role permissions yet.
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

function DashboardHome({ role }: { role: NonNullable<ReturnType<typeof getDashboardRole>> }) {
  return (
    <>
      <PortalHeader role={role} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {role.metrics.map((metric) => {
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
            {role.activities.map((activity, index) => (
              <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  {index < role.activities.length - 1 && <span className="mt-1 h-full min-h-7 w-px bg-border" />}
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
}: {
  role: NonNullable<ReturnType<typeof getDashboardRole>>;
  section: DashboardSection;
}) {
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
          <CardDescription>Sample records for interface preview only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="hidden gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"
            style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr)) auto` }}
          >
            {section.columns.map((column) => <span key={column}>{column}</span>)}
            <span>Status</span>
          </div>
          {section.rows.map((row, index) => (
            <div
              key={`${section.id}-${index}`}
              className="grid gap-3 rounded-xl border p-4 md:items-center md:gap-4"
              style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr)) auto` }}
            >
              {row.values.map((value, valueIndex) => (
                <div key={`${section.id}-${index}-${valueIndex}`} className="min-w-0">
                  <p className="text-xs text-muted-foreground md:hidden">{section.columns[valueIndex]}</p>
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

export function MindspaceRoleDashboard({ roleId }: { roleId: string }) {
  const role = getDashboardRole(roleId);
  if (!role) notFound();

  return (
    <div className="space-y-6 py-2">
      <DemoBanner />
      <RoleSwitcher activeRole={role.id} />
      <DashboardHome role={role} />
    </div>
  );
}

export function MindspaceRoleSection({
  roleId,
  sectionId,
}: {
  roleId: string;
  sectionId: string;
}) {
  const role = getDashboardRole(roleId);
  const section = role?.sections.find((item) => item.id === sectionId);
  if (!role || !section) notFound();

  return (
    <div className="space-y-6 py-2">
      <DemoBanner />
      <RoleSwitcher activeRole={role.id} />
      <SectionPage role={role} section={section} />
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
      <p className="text-xs text-muted-foreground">
        Role pages are interface previews only. Live authentication, access control, and persistence are not part of this demo.
      </p>
    </div>
  );
}
