

import { getServerSession } from "@/modules/server/auth/get-session";
import RootNavbar from "@/modules/client/(marketing)/components/RootNavbar";
import Footer from "@/modules/client/(marketing)/components/Footer";
import { HowItWorksPage } from "@/modules/client/(marketing)/pages/HowItWorksPage";

export const dynamic = "force-dynamic";

/** Full clinical workflow explanation page. */
export default async function HowItWorksRoute() {
  const session = await getServerSession();
  return (
    <>
      <RootNavbar session={session} />
      <main>
        <HowItWorksPage session={session} />
      </main>
      <Footer />
    </>
  );
}
