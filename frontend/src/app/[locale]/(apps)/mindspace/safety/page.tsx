/**
 * Safety Dashboard Page - Integration Layer
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
import SafetyDashboard from "@/modules/client/mindspace/safety/presentation/components/SafetyDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Dashboard - MindSpace",
  description: "Safety monitoring dashboard with risk assessment, alerts, incidents, and escalation tracking",
};

async function SafetyDashboardPage() {
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

  // Redirect if not a safety role
  const userRole = session.session.activeRole;
  const isSafetyOfficer = userRole === "safety-officer" || userRole === "safety-manager" || userRole === "compliance";
  
  if (!isSafetyOfficer) {
    return redirect({
      href: session.session.activeRoleRedirectUrl || "/",
      locale,
    });
  }

  const userId = session.user.id;
  const safetyId = session.user.id; // Assuming safety ID is same as user ID; adjust if needed

  return (
    <div className="w-full">
      <SafetyDashboard
        safetyId={safetyId}
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

export default SafetyDashboardPage;
