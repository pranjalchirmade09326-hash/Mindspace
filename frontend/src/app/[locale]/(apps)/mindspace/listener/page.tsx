/**
 * Next.js Page: Listener Dashboard
 * Server-side rendering with authentication
 * Presentation layer - page route
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ListenerDashboard } from '@/modules/client/mindspace/listener/presentation/components/ListenerDashboard';

export const metadata: Metadata = {
  title: 'Listener Dashboard | MindSpace',
  description: 'View your listener profile and performance metrics',
};

interface ListenerPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    id?: string;
  };
}

export default async function ListenerPage({
  params,
  searchParams,
}: ListenerPageProps) {
  // Get listener ID from query params or session
  const listenerId = searchParams.id;

  // In production, get from session/auth context
  // const session = await getServerSession();
  // const listenerId = session?.user?.id;

  if (!listenerId) {
    // Redirect to login if no listener ID
    redirect(`/${params.locale}/auth/login?callbackUrl=/${params.locale}/mindspace/listener`);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ListenerDashboard
          listenerId={listenerId}
          onRefresh={() => {
            console.log('Dashboard refreshed');
          }}
        />
      </div>
    </main>
  );
}
