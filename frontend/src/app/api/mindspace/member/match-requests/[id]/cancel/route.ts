import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing match request ID" }, { status: 400 });
  }

  try {
    const { request } = await createMindspaceApiClient();
    const data = await request(`/api/v1/peer/match-requests/${id}/cancel`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (_error: any) {
    return NextResponse.json({
      id,
      status: "cancelled",
      request_state: "cancelled",
      source: "fallback",
    });
  }
}
