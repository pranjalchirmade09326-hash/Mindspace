import { headers, cookies } from "next/headers";

export async function getAuthToken(): Promise<string> {
  // 1. Check local session dev token first
  try {
    const cookieStore = await cookies();
    const devToken = cookieStore.get("dev_token");
    if (devToken?.value) return devToken.value;
  } catch {
    // Continue to external fetch
  }

  // 2. Fetch from external BetterAuth if configured
  try {
    const hdrs = await headers();
    const cookie = hdrs.get("cookie") ?? "";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150);

    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/token`, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const token: string | undefined = data.token ?? data.jwt ?? data.access_token;
      if (token) return token;
    }
  } catch {
    // Fall back to dev token
  }

  return "dev-jwt-token";
}
