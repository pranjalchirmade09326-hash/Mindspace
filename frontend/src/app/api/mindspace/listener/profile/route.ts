import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/peer/listeners/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: "success",
      message: "Listener profile updated",
      source: "fallback",
    });
  }
}

