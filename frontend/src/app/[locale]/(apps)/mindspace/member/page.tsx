/**
 * Member Dashboard Page - Integration Layer
 *
 * Server component that handles:
 * - Authentication check
 * - Session validation
 * - Server-side data fetching (optional)
 * - Page metadata
 *
 * Layer: Integration / App Router
 */

import { redirect } from "@/i18n/navigation";
import { getServerSession } from "@/modules/server/auth/get-session";
import { getLocale } from "next-intl/server";
import MemberDashboard from "@/modules/client/mindspace/member/presentation/components/MemberDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Dashboard - MindSpace",
  description: "Your personal wellness dashboard with activity overview and quick actions",
};

async function MemberDashboardPage() {
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

  // Redirect if not a member role
  if (session.session.activeRole !== "member") {
    return redirect({
      href: session.session.activeRoleRedirectUrl || "/",
      locale,
    });
  }

  const userId = session.user.id;

  return (
    <div className="w-full">
      <MemberDashboard
        userId={userId}
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

export default MemberDashboardPage;
