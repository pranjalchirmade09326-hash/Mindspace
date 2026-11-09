"use server";

import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export interface MindspaceAccountProfile {
  userId: string;
  roles: string[];
}

// Creates the MindSpace member principal on first sign-in and returns the
// application roles held in the API's own authorization store. The IAM role
// claim is never used to grant privileges here.
export async function provisionMindspaceAccountAction(): Promise<MindspaceAccountProfile> {
  const { request } = await createMindspaceApiClient();
  return request<MindspaceAccountProfile>("/api/v1/me");
}
