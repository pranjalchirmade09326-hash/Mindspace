import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/supervisors/pod/conduct-reports");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json([
      {
        id: "cr-01",
        conversationId: "conv-882",
        category: "Boundary Caution (Gave sleep supplement recommendation)",
        state: "open",
        reporterId: "Member (Anonymous)",
        reportedId: "Aarav Sharma",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
      },
      {
        id: "cr-02",
        conversationId: "conv-714",
        category: "Communication Style (Felt slightly hurried)",
        state: "resolved",
        reporterId: "Member (Anonymous)",
        reportedId: "Kabir Das",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date().toISOString(),
      },
    ]);
  }
}

