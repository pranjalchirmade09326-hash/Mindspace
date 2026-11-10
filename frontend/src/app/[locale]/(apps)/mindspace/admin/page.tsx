/**
 * Admin Dashboard Page - Integration Layer
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
import AdminDashboard from "@/modules/client/mindspace/admin/presentation/components/AdminDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - MindSpace",
  description: "Platform administration dashboard with user management, analytics, and system health metrics",
};

async function AdminDashboardPage() {
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

  // Redirect if not an admin role
  const userRole = session.session.activeRole;
  const isAdmin = userRole === "super-admin" || userRole === "admin" || userRole === "moderator";
  
  if (!isAdmin) {
    return redirect({
      href: session.session.activeRoleRedirectUrl || "/",
      locale,
    });
  }

  const userId = session.user.id;
  const adminId = session.user.id; // Assuming admin ID is same as user ID; adjust if needed

  return (
    <div className="w-full">
      <AdminDashboard
        adminId={adminId}
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

export default AdminDashboardPage;
