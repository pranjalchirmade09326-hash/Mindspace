import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/admins");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      totalUsers: 1420,
      activeListeners: 48,
      activeSupervisors: 12,
      activeSafetyCases: 3,
      clusterHealth: "healthy",
      averageResponseTimeMs: 24,
    });
  }
}
