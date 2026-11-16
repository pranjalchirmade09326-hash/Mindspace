import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || "";
    if (!text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const agentBase = (process.env.INTAKE_VOICE_AGENT_URL || "http://127.0.0.1:8018").replace("localhost", "127.0.0.1");
    const synthesizeUrl = `${agentBase.replace(/\/$/, "")}/api/v1/voice/synthesize`;

    const upstream = await fetch(synthesizeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 500),
        target_language_code: body.target_language_code || "hi-IN",
        speaker: body.speaker || "priya",
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => "");
      return NextResponse.json({ error: "Voice synthesis failed", details: err }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[voice-synthesize proxy error]:", error);
    return NextResponse.json(
      { error: "Failed to connect to voice service", details: error?.message },
      { status: 500 }
    );
  }
}
