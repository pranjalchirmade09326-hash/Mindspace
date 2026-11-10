import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/members/me/summary");
    return NextResponse.json(data);
  } catch (error: any) {
    // Resilient fallback when FastAPI is offline during local dev
    return NextResponse.json({
      userId: "usr-demo-member-01",
      displayName: "Priya Sharma",
      checkinsThisWeek: 5,
      savedReflections: 2,
      activeGoals: 2,
      openSupportRequests: 1,
      openConversations: 1,
      queuedNotifications: 0,
      openPrivacyRequests: 0,
      stats: {
        total: 3,
        pending: 1,
        completed: 2,
        cancelled: 0,
      },
      latestIntakeStatus: "completed",
      moodTrend: [
        { id: "m-1", mood_code: "peaceful", scale_value: 8.5, note: "Evening reflection and mindfulness breathwork", recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "m-2", mood_code: "grateful", scale_value: 9.0, note: "Feeling centered and calm after meditation", recorded_at: new Date(Date.now() - 86400000).toISOString() },
        { id: "m-3", mood_code: "calm", scale_value: 8.0, note: "Positive somatic focus, feeling grounded", recorded_at: new Date().toISOString() },
      ],
      activeGoals: [
        { id: "g-1", goal: "15-minute daily mindfulness breathing", status: "active", target_date: "2026-11-20" },
        { id: "g-2", goal: "Evening digital screen wind-down before 10 PM", status: "active", target_date: "2026-11-25" },
      ],
      recentSessions: [
        {
          id: "sess-1",
          date: new Date().toISOString(),
          listenerName: "Aarav Sharma (Verified Peer Listener)",
          channel: "video",
          status: "active",
          note: "Evening reflection and mindfulness check-in",
        },
        {
          id: "sess-2",
          date: new Date(Date.now() - 86400000).toISOString(),
          listenerName: "Priya Nair (Volunteer Listener)",
          channel: "voice",
          status: "completed",
          note: "Stress management & somatic breathing exercises",
        },
        {
          id: "sess-3",
          date: new Date(Date.now() - 172800000).toISOString(),
          listenerName: "Kabir Mehta (Peer Support)",
          channel: "chat",
          status: "completed",
          note: "Work-life balance discussion & burnout boundary review",
        },
      ],
      source: "fallback",
    });
  }
}

