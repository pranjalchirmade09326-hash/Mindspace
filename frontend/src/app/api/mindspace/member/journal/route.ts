import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/wellbeing/reflections");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json([
      {
        id: "j-1",
        title: "Finding Grounding in Uncertainty",
        body: "Today was busy, but taking 10 minutes to sit by the window helped calm the internal rush. Focus on one task at a time tomorrow.",
        tags: ["Mindfulness", "Grounding", "Evening"],
        date: new Date().toISOString(),
      },
      {
        id: "j-2",
        title: "Gratitude for Small Moments",
        body: "Grateful for the morning tea in silence, a warm conversation with a colleague, and finishing my planned workout.",
        tags: ["Gratitude", "Morning"],
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/wellbeing/reflections", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const body = await req.clone().json().catch(() => ({}));
    return NextResponse.json({
      id: `j-${Date.now()}`,
      title: body.title || "Personal Reflection",
      body: body.body || "",
      tags: ["Private", "Journal"],
      date: new Date().toISOString(),
      source: "fallback",
    });
  }
}

