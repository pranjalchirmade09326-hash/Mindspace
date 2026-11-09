import "server-only";

import { createMindspaceApiClient } from "./api-client";

export interface MemberSummary {
  checkinsThisWeek: number;
  savedReflections: number;
  activeGoals: number;
  openSupportRequests: number;
  openConversations: number;
  queuedNotifications: number;
  openPrivacyRequests: number;
}

export interface MemberSupportRequest {
  id: string;
  requestState: string;
  preferredLanguage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberConversation {
  id: string;
  conversationState: string;
  channel: string;
  startedAt: string;
  endedAt: string | null;
}

export interface MemberIntake {
  id: string;
  channel: string;
  status: string;
  locale: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface MemberMood {
  id: string;
  moodCode: string;
  scaleCode: string | null;
  scaleValue: number | null;
  note: string | null;
  sourceType: string;
  recordedAt: string;
}

export interface MemberReflection {
  id: string;
  reflectionType: string;
  locale: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export interface MemberGoal {
  id: string;
  goal: string;
  status: string;
  targetDate: string | null;
  createdAt: string;
  checkins: { id: string; state: string; note: string | null; reportedAt: string }[];
}

export interface MemberConsent {
  id: string;
  purposeCode: string;
  recipientScope: string | null;
  policyVersion: string;
  consentState: string;
  capturedAt: string;
  expiresAt: string | null;
}

export interface MemberPrivacyRequest {
  id: string;
  requestType: string;
  requestState: string;
  verificationState: string;
  requestedAt: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface MemberNotification {
  id: string;
  notificationType: string;
  channel: string;
  deliveryState: string;
  scheduledAt: string;
  sentAt: string | null;
}

export interface MemberFollowup {
  id: string;
  sourceType: string;
  scheduledAt: string;
  followupState: string;
  completedAt: string | null;
}

export interface MemberOverviewData {
  summary: MemberSummary;
  supportRequests: MemberSupportRequest[];
  conversations: MemberConversation[];
  intakes: MemberIntake[];
  moods: MemberMood[];
  reflections: MemberReflection[];
  goals: MemberGoal[];
  notifications: MemberNotification[];
  followups: MemberFollowup[];
}

export type MemberSectionData =
  | {
      kind: "support";
      requests: MemberSupportRequest[];
      conversations: MemberConversation[];
    }
  | {
      kind: "wellbeing";
      moods: MemberMood[];
      reflections: MemberReflection[];
      goals: MemberGoal[];
      followups: MemberFollowup[];
    }
  | { kind: "privacy"; consents: MemberConsent[] }
  | { kind: "intakes"; intakes: MemberIntake[] }
  | { kind: "privacy-requests"; requests: MemberPrivacyRequest[] }
  | { kind: "notifications"; notifications: MemberNotification[] };

interface IntakePage {
  items: MemberIntake[];
  page: number;
  limit: number;
  total: number;
}

async function load<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    return await request();
  } catch {
    return null;
  }
}

export async function loadMemberOverviewData(): Promise<MemberOverviewData | null> {
  let request: Awaited<ReturnType<typeof createMindspaceApiClient>>["request"];
  try {
    ({ request } = await createMindspaceApiClient());
  } catch {
    return null;
  }

  const [summary, supportRequests, conversations, intakes, moods, reflections, goals, notifications, followups] =
    await Promise.all([
      load(() => request<MemberSummary>("/api/v1/members/me/summary")),
      load(() => request<MemberSupportRequest[]>("/api/v1/peer/match-requests")),
      load(() => request<MemberConversation[]>("/api/v1/peer/conversations")),
      load(() => request<IntakePage>("/api/v1/intakes?limit=10")),
      load(() => request<MemberMood[]>("/api/v1/wellbeing/moods")),
      load(() => request<MemberReflection[]>("/api/v1/wellbeing/reflections")),
      load(() => request<MemberGoal[]>("/api/v1/wellbeing/goals")),
      load(() => request<MemberNotification[]>("/api/v1/notifications")),
      load(() => request<MemberFollowup[]>("/api/v1/followups")),
    ]);

  if (!summary) return null;

  return {
    summary,
    supportRequests: supportRequests ?? [],
    conversations: conversations ?? [],
    intakes: intakes?.items ?? [],
    moods: moods ?? [],
    reflections: reflections ?? [],
    goals: goals ?? [],
    notifications: notifications ?? [],
    followups: followups ?? [],
  };
}

export async function loadMemberSectionData(sectionId: string): Promise<MemberSectionData | null> {
  let request: Awaited<ReturnType<typeof createMindspaceApiClient>>["request"];
  try {
    ({ request } = await createMindspaceApiClient());
  } catch {
    return null;
  }

  switch (sectionId) {
    case "my-support": {
      const [requests, conversations] = await Promise.all([
        load(() => request<MemberSupportRequest[]>("/api/v1/peer/match-requests")),
        load(() => request<MemberConversation[]>("/api/v1/peer/conversations")),
      ]);
      if (!requests && !conversations) return null;
      return {
        kind: "support",
        requests: requests ?? [],
        conversations: conversations ?? [],
      };
    }
    case "wellbeing": {
      const [moods, reflections, goals, followups] = await Promise.all([
        load(() => request<MemberMood[]>("/api/v1/wellbeing/moods")),
        load(() => request<MemberReflection[]>("/api/v1/wellbeing/reflections")),
        load(() => request<MemberGoal[]>("/api/v1/wellbeing/goals")),
        load(() => request<MemberFollowup[]>("/api/v1/followups")),
      ]);
      if (!moods && !reflections && !goals && !followups) return null;
      return {
        kind: "wellbeing",
        moods: moods ?? [],
        reflections: reflections ?? [],
        goals: goals ?? [],
        followups: followups ?? [],
      };
    }
    case "privacy": {
      const consents = await load(() => request<MemberConsent[]>("/api/v1/consents"));
      return consents ? { kind: "privacy", consents } : null;
    }
    case "support-options": {
      const intakes = await load(() => request<IntakePage>("/api/v1/intakes?limit=50"));
      return intakes ? { kind: "intakes", intakes: intakes.items } : null;
    }
    case "privacy-requests": {
      const requests = await load(() => request<MemberPrivacyRequest[]>("/api/v1/privacy-requests"));
      return requests ? { kind: "privacy-requests", requests } : null;
    }
    case "notifications": {
      const notifications = await load(() => request<MemberNotification[]>("/api/v1/notifications"));
      return notifications ? { kind: "notifications", notifications } : null;
    }
    default:
      return null;
  }
}
