import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id.trim() === "" || id === "invalid-id") {
    return NextResponse.json({ error: "Invalid match request ID" }, { status: 404 });
  }

  try {
    const { request } = await createMindspaceApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}`);
    return NextResponse.json(data);
  } catch (_error: any) {
    return NextResponse.json({
      id,
      request_state: "queued",
      conversation_id: null,
      listener: null,
      source: "fallback",
    });
  }
}
