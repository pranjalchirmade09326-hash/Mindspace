"use client";

import { useState, useTransition, useRef } from "react";
import { Headphones, Heart, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoleSwitcherControlProps {
  userRole?: string | null;
  className?: string;
}

type SupportedRole = "member" | "listener";

const ROLES: { id: SupportedRole; label: string; icon: typeof Heart; href: string }[] = [
  {
    id: "member",
    label: "Member",
    icon: Heart,
    href: "/mindspace/member",
  },
  {
    id: "listener",
    label: "Listener",
    icon: Headphones,
    href: "/mindspace/listener",
  },
];

export function RoleSwitcherControl({ userRole, className }: RoleSwitcherControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [switchingRole, setSwitchingRole] = useState<SupportedRole | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine active role from URL path first, then user prop, default to "member"
  const getActiveRole = (): SupportedRole => {
    if (pathname.includes("/mindspace/listener")) return "listener";
    if (pathname.includes("/mindspace/member")) return "member";
    if (userRole === "listener" || userRole === "doctor") return "listener";
    return "member";
  };

  const activeRole = getActiveRole();

  const handleRoleSwitch = async (targetRole: SupportedRole) => {
    if (targetRole === activeRole && pathname.startsWith(`/mindspace/${targetRole}`)) {
      return;
    }

    setSwitchingRole(targetRole);

    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          redirectUrl: `/mindspace/${targetRole}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to switch workspace session");
      }

      startTransition(() => {
        router.push(`/mindspace/${targetRole}`);
        router.refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to switch role");
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % ROLES.length;
      const targetRole = ROLES[nextIndex].id;
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
      handleRoleSwitch(targetRole);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + ROLES.length) % ROLES.length;
      const targetRole = ROLES[prevIndex].id;
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[prevIndex]?.focus();
      handleRoleSwitch(targetRole);
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Workspace role switcher"
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted/50 p-1 text-xs shadow-xs",
        className
      )}
    >
      {ROLES.map((role, idx) => {
        const Icon = role.icon;
        const isSelected = activeRole === role.id;
        const isLoadingThis = switchingRole === role.id || (isPending && isSelected);

        return (
          <button
            key={role.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${role.label} workspace`}
            tabIndex={isSelected ? 0 : -1}
            disabled={isPending || switchingRole !== null}
            onClick={() => handleRoleSwitch(role.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-60",
              isSelected
                ? "bg-background text-foreground shadow-xs font-semibold ring-1 ring-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {isLoadingThis ? (
              <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />
            ) : (
              <Icon
                className={cn(
                  "size-3.5 shrink-0 transition-colors",
                  isSelected
                    ? role.id === "member"
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-sky-500 dark:text-sky-400"
                    : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
            )}
            <span>{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default RoleSwitcherControl;
