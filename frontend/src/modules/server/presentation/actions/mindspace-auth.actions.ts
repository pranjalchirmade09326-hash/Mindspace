"use server";

import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export interface MindspaceLogoutResult {
  status: string;
  message: string;
  loggedOutAt: string;
}

export async function mindspaceLogoutAction(): Promise<MindspaceLogoutResult> {
  try {
    const { request } = await createMindspaceApiClient();
    return await request<MindspaceLogoutResult>("/api/v1/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    // If user is already unauthenticated or token expired, return a fallback status
    return {
      status: "logged_out",
      message: error instanceof Error ? error.message : "Session ended.",
      loggedOutAt: new Date().toISOString(),
    };
  }
}
