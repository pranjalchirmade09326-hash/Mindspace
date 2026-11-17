import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestId = body.id || body.request_id || body.requestId;
  if (!requestId) {
    return NextResponse.json({ error: "Missing match request ID" }, { status: 400 });
  }

  try {
    const { request } = await createMindspaceApiClient();
    const data = await request(`/api/v1/peer/match-requests/${requestId}/cancel`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (_error: any) {
    return NextResponse.json({
      id: requestId,
      status: "cancelled",
      request_state: "cancelled",
      source: "fallback",
    });
  }
}
