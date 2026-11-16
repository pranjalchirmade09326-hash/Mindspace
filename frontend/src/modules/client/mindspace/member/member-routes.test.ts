import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as journalPOST, GET as journalGET } from "@/app/api/mindspace/member/journal/route";
import { POST as moodsPOST, GET as moodsGET } from "@/app/api/mindspace/member/moods/route";
import { POST as goalsPOST, GET as goalsGET } from "@/app/api/mindspace/member/goals/route";
import { POST as peerSessionPOST } from "@/app/api/mindspace/member/peer-session/route";
import * as apiClientModule from "@/modules/server/mindspace/api-client";

vi.mock("@/modules/server/mindspace/api-client", () => ({
  createMindspaceApiClient: vi.fn(),
}));

describe("Member Next.js Route Handlers - Resiliency & Stream Consumption Fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/mindspace/member/journal", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "j-backend", title: "Saved" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Reflection", body: "Peaceful day" }),
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("j-backend");
      expect(mockRequest).toHaveBeenCalledWith(
        "/api/v1/wellbeing/journal",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("gracefully falls back when backend is offline without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("FastAPI offline: ECONNREFUSED")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Offline Entry", body: "Still saved locally" }),
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.title).toBe("Offline Entry");
      expect(json.body).toBe("Still saved locally");
    });

    it("handles malformed JSON request body without crashing", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed-json",
      });

      const res = await journalPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.title).toBe("Personal Reflection");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await journalGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/mindspace/member/moods", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "m-backend", mood_code: "calm" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_code: "calm", scale_value: 8.5 }),
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("m-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood_code: "grateful", scale_value: 9.0, note: "Feeling good" }),
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.mood_code).toBe("grateful");
      expect(json.scale_value).toBe(9.0);
      expect(json.note).toBe("Feeling good");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await moodsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.mood_code).toBe("calm");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await moodsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/mindspace/member/goals", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "g-backend", goal: "Mindfulness" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "Mindfulness practice", target_date: "2026-12-01" }),
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("g-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "Drink water daily", target_date: "2026-11-30" }),
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.goal).toBe("Drink water daily");
      expect(json.target_date).toBe("2026-11-30");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await goalsPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.goal).toBe("Personal Wellbeing Goal");
    });

    it("GET returns fallback data when backend is unreachable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend offline")
      );
      const res = await goalsGET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/mindspace/member/peer-session", () => {
    it("returns backend data on happy path", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ id: "sess-backend", status: "confirmed" });
      vi.mocked(apiClientModule.createMindspaceApiClient).mockResolvedValue({
        identity: { id: "u-1", name: "User", email: "u@m.com" },
        request: mockRequest,
      } as any);

      const req = new Request("http://localhost:4000/api/mindspace/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listener_name: "John", channel: "video", note: "Need support" }),
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe("sess-backend");
    });

    it("gracefully falls back when backend fails without throwing TypeError: unusable", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("FastAPI offline")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listener_name: "Maya Patel", channel: "chat", note: "Anxiety support" }),
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.listenerName).toBe("Maya Patel");
      expect(json.channel).toBe("chat");
      expect(json.note).toBe("Anxiety support");
    });

    it("handles malformed JSON request body gracefully", async () => {
      vi.mocked(apiClientModule.createMindspaceApiClient).mockRejectedValue(
        new Error("Backend error")
      );

      const req = new Request("http://localhost:4000/api/mindspace/member/peer-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await peerSessionPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("fallback");
      expect(json.listenerName).toBe("Aarav Sharma (Verified Peer Listener)");
    });
  });
});
