/**
 * Supervisor Dashboard Page - Integration Layer
 *
 * Server component that handles:
 * - Authentication check
 * - Session validation
 * - Role-based access control
 * - Page metadata
 * - Error boundaries
 *
 * Layer: Integration / App Router
 */

import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/server/auth/get-session";
import { getLocale } from "next-intl/server";
import SupervisorDashboard from "@/modules/client/mindspace/supervisor/presentation/components/SupervisorDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supervisor Dashboard - MindSpace",
  description: "Team supervision dashboard with performance metrics, team member management, and quality monitoring",
};

async function SupervisorDashboardPage() {
  // Get user session
  const session = await getServerSession();
  const locale = await getLocale();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    return redirect({
      href: "/signin",
      locale,
    });
  }

  // Redirect if not a supervisor role
  const userRole = session.session.activeRole;
  const isSupervisor = userRole === "supervisor" || userRole === "team-lead" || userRole === "manager";
  
  if (!isSupervisor) {
    return redirect({
      href: session.session.activeRoleRedirectUrl || "/",
      locale,
    });
  }

  const userId = session.user.id;
  const supervisorId = session.user.id; // Assuming supervisor ID is same as user ID; adjust if needed

  return (
    <div className="w-full">
      <SupervisorDashboard
        supervisorId={supervisorId}
        userRole={userRole}
        onNavigate={(path) => {
          // Navigation handled by client-side router
          if (typeof window !== "undefined") {
            window.location.href = path;
          }
        }}
      />
    </div>
  );
}

export default SupervisorDashboardPage;
