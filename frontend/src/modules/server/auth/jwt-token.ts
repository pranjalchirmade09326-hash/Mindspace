import { headers, cookies } from "next/headers";

export async function getAuthToken(): Promise<string> {
  // 1. Check local session dev token cookie first
  try {
    const cookieStore = await cookies();
    const devToken = cookieStore.get("dev_token");
    if (devToken?.value) return devToken.value;
  } catch {
    // Continue
  }

  // 2. Fetch from BetterAuth / IAM server
  const iamBase = process.env.BETTER_AUTH_URL || "http://localhost:5001";
  try {
    let cookie = "";
    try {
      const hdrs = await headers();
      cookie = hdrs.get("cookie") ?? "";
    } catch {
      // Background / Static context
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${iamBase}/api/auth/token`, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const token: string | undefined = data.token ?? data.jwt ?? data.access_token;
      if (token) return token;
    }
  } catch (err) {
    console.warn("[jwt-token] Unable to fetch token from IAM, falling back:", err);
  }

  return "dev-jwt-token";
}
