/**
 * Auth for the seed script.
 *
 * Mirrors src/modules/server/auth/jwt-token.ts's flow, but starting from a fresh
 * email/password sign-in instead of forwarding an existing browser cookie — this
 * script has no Next.js request to read cookies from, so it performs the same
 * login → session cookie → JWT chain a browser session would.
 */

import axios from "axios";

export interface AuthConfig {
  betterAuthUrl: string;
  email: string;
  password: string;
}

/** Signs in with email/password, then exchanges the session cookie for a JWT. Falls back to dev token in local dev. */
export async function getJwt({ betterAuthUrl, email, password }: AuthConfig): Promise<string> {
  try {
    const signInRes = await axios.post(
      `${betterAuthUrl}/api/auth/sign-in/email`,
      { email, password },
      { timeout: 2000, validateStatus: () => true },
    );
    if (signInRes.status < 400) {
      const setCookie = signInRes.headers["set-cookie"];
      if (setCookie?.length) {
        const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
        const tokenRes = await axios.get(`${betterAuthUrl}/api/auth/token`, {
          headers: { cookie },
          timeout: 2000,
          validateStatus: () => true,
        });
        if (tokenRes.status < 400) {
          const token: string | undefined =
            tokenRes.data?.token ?? tokenRes.data?.jwt ?? tokenRes.data?.access_token;
          if (token) return token;
        }
      }
    }
  } catch {
    // Better Auth service is offline or unreachable in local dev mode
  }

  console.log("ℹ️ BetterAuth not running on :5001, using local development token (dev-jwt-token).");
  return "dev-jwt-token";
}
