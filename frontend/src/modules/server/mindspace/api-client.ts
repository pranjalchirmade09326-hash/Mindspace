import "server-only";

import { headers } from "next/headers";
import { decodeJwt } from "jose";

export interface BetterAuthIdentity {
  id: string;
  name: string | null;
  email: string | null;
}

interface BetterAuthSessionResponse {
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
  } | null;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

async function requestBetterAuth(path: string): Promise<Response> {
  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (!authUrl) {
    throw new Error("BETTER_AUTH_URL is not configured.");
  }
  const cookie = (await headers()).get("cookie") ?? "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800); // Fast 800ms timeout
  try {
    return await fetch(new URL(path, authUrl), {
      headers: { cookie },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getMindspaceAuthSession(): Promise<BetterAuthIdentity | null> {
  const response = await requestBetterAuth("/api/auth/get-session");
  if (!response.ok) {
    throw new Error(`Better Auth session lookup failed (${response.status}).`);
  }

  const session = (await response.json()) as BetterAuthSessionResponse;
  if (typeof session.user?.id !== "string" || session.user.id.length === 0) {
    return null;
  }

  return {
    id: session.user.id,
    name: typeof session.user.name === "string" ? session.user.name : null,
    email: typeof session.user.email === "string" ? session.user.email : null,
  };
}

async function getMindspaceBearerToken(expectedUserId: string): Promise<string> {
  const response = await requestBetterAuth("/api/auth/token");
  if (!response.ok) {
    throw new Error(`Better Auth token request failed (${response.status}).`);
  }

  const result = (await response.json()) as {
    token?: unknown;
    jwt?: unknown;
    access_token?: unknown;
  };
  const token = [result.token, result.jwt, result.access_token].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (!token) {
    throw new Error("Better Auth did not return a MindSpace API token.");
  }

  const claims = decodeJwt(token);
  if (claims.sub !== expectedUserId) {
    throw new Error("Better Auth token subject does not match the active session.");
  }
  return token;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  const result = responseText ? (JSON.parse(responseText) as T & ApiErrorResponse) : undefined;
  if (!response.ok) {
    const message = result?.error?.message ?? `MindSpace API request failed (${response.status}).`;
    const code = result?.error?.code;
    throw new Error(code ? `${code}: ${message}` : message);
  }
  return result as T;
}

export async function createMindspaceApiClient() {
  const identity = await getMindspaceAuthSession();
  if (!identity) {
    throw new Error("Sign in with your MindSpace account before continuing.");
  }

  const apiUrl = process.env.MINDSPACE_API_URL;
  if (!apiUrl) {
    throw new Error("MINDSPACE_API_URL is not configured.");
  }
  const baseUrl = new URL(apiUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new Error("MINDSPACE_API_URL must use HTTPS in production.");
  }

  const token = await getMindspaceBearerToken(identity.id);
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    try {
      const response = await fetch(new URL(path, baseUrl), {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
        },
        cache: "no-store",
        signal: controller.signal,
      });
      return readApiResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  await request("/api/v1/members/me/provision", { method: "POST" });
  return { identity, request };
}
