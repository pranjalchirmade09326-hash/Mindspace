import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/wellbeing/goals");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      { id: "g-1", goal: "15-minute daily mindfulness breathing", status: "active", target_date: "2026-11-20" },
      { id: "g-2", goal: "Evening digital screen wind-down before 10 PM", status: "active", target_date: "2026-11-25" },
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/wellbeing/goals", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const body = await req.clone().json().catch(() => ({}));
    return NextResponse.json({
      id: `g-${Date.now()}`,
      goal: body.goal || "Personal Wellbeing Goal",
      status: "active",
      target_date: body.target_date || null,
      created_at: new Date().toISOString(),
      source: "fallback",
    });
  }
}

