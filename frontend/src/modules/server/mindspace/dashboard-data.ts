import "server-only";

/**
 * MindSpace dashboard live-data fetcher.
 *
 * Layer: server / mindspace / dashboard
 *
 * Calls the MindSpace API (backend/mindspace-api) through the shared
 * authenticated client and normalizes each role's endpoints into the
 * display shape used by MindspacePortal (metrics / activities / section
 * rows). Every fetch is defensive: if the API, auth session, or a
 * particular endpoint is unavailable, that role simply falls back to
 * the sample data defined in dashboard-data.ts — the UI never breaks.
 */

import { createMindspaceApiClient } from "./api-client";

/** Normalized live payload for one dashboard role. */
export interface LiveDashboardData {
  /** True when at least one API call succeeded for this role. */
  live: boolean;
  metrics?: { label: string; value: string; note: string }[];
  activities?: { title: string; detail: string; time: string }[];
  /** Section-id → table override. Sections not present keep sample rows. */
  sections?: Record<
    string,
    { columns: string[]; rows: { values: string[]; status: string }[] }
  >;
}

type ApiRequester = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Unwraps the API's `{ items, page, limit, total }` list envelope (or a bare array). */
function asArray<T = Record<string, unknown>>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "data", "results", "records"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

/** Reads the first present string-ish field from a record. */
function field(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "—";
}

function shortDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Member dashboard: intakes, match requests, conversations, wellbeing, consents. */
async function fetchMemberData(request: ApiRequester): Promise<LiveDashboardData> {
  const [intakes, matchRequests, conversations, moods, journal, goals, consents] =
    await Promise.all([
      safe(() => request<unknown>("/api/v1/intakes"), null),
      safe(() => request<unknown>("/api/v1/peer/match-requests"), null),
      safe(() => request<unknown>("/api/v1/peer/conversations"), null),
      safe(() => request<unknown>("/api/v1/wellbeing/moods"), null),
      safe(() => request<unknown>("/api/v1/wellbeing/journal"), null),
      safe(() => request<unknown>("/api/v1/wellbeing/goals"), null),
      safe(() => request<unknown>("/api/v1/consents"), null),
    ]);

  const intakeItems = asArray(intakes);
  const requestItems = asArray(matchRequests);
  const conversationItems = asArray(conversations);
  const moodItems = asArray(moods);
  const journalItems = asArray(journal);
  const goalItems = asArray(goals);
  const consentItems = asArray(consents);

  const live = [intakes, matchRequests, conversations, moods, journal, goals, consents].some(
    (result) => result !== null,
  );
  if (!live) return { live: false };

  const supportRows = [...requestItems, ...intakeItems].slice(0, 10).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      values: [
        field(record, ["topicCode", "title", "status", "id"]),
        field(record, ["listenerName", "assignedTo", "channel"]),
        shortDate(record.updatedAt ?? record.createdAt),
      ],
      status: field(record, ["requestState", "status", "state"]) || "Unknown",
    };
  });

  const wellbeingRows = [
    ...moodItems.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        values: [
          `Mood: ${field(record, ["mood", "score", "label"])}`,
          "Mood check-in",
          shortDate(record.createdAt ?? record.date),
        ],
        status: "Private",
      };
    }),
    ...journalItems.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        values: [
          field(record, ["title", "id"],
          ),
          "Journal",
          shortDate(record.updatedAt ?? record.createdAt),
        ],
        status: "Private",
      };
    }),
    ...goalItems.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        values: [
          field(record, ["title", "description", "id"]),
          "Goal",
          shortDate(record.updatedAt ?? record.createdAt),
        ],
        status: field(record, ["status", "state"]) || "Active",
      };
    }),
  ].slice(0, 10);

  const privacyRows = consentItems.slice(0, 10).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      values: [
        field(record, ["purposeCode", "purpose", "id"]),
        field(record, ["consentState", "state", "decision"]),
        shortDate(record.createdAt ?? record.updatedAt),
      ],
      status: "Recorded",
    };
  });

  return {
    live: true,
    metrics: [
      { label: "Intakes", value: String(intakeItems.length), note: "Total recorded" },
      { label: "Support requests", value: String(requestItems.length), note: "Peer support" },
      { label: "Conversations", value: String(conversationItems.length), note: "Peer chats" },
    ],
    activities: [
      ...requestItems.slice(0, 3).map((item) => {
        const record = item as Record<string, unknown>;
        return {
          title: "Support request",
          detail: field(record, ["requestState", "status", "id"]),
          time: shortDate(record.createdAt ?? record.updatedAt),
        };
      }),
      ...intakeItems.slice(0, 3).map((item) => {
        const record = item as Record<string, unknown>;
        return {
          title: "Intake",
          detail: field(record, ["channel", "status", "id"]),
          time: shortDate(record.createdAt ?? record.updatedAt),
        };
      }),
    ].slice(0, 5),
    sections: {
      "my-support": {
        columns: ["Support request", "Channel/state", "Updated"],
        rows: supportRows.length
          ? supportRows
          : [{ values: ["No support requests yet", "—", "—"], status: "Empty" }],
      },
      wellbeing: {
        columns: ["Activity", "Type", "Last updated"],
        rows: wellbeingRows.length
          ? wellbeingRows
          : [{ values: ["No wellbeing activity yet", "—", "—"], status: "Empty" }],
      },
      privacy: {
        columns: ["Preference", "Choice", "Updated"],
        rows: privacyRows.length
          ? privacyRows
          : [{ values: ["No consent records yet", "—", "—"], status: "Empty" }],
      },
    },
  };
}

/** Listener dashboard: offers, profile, availability, conversations. */
async function fetchListenerData(request: ApiRequester): Promise<LiveDashboardData> {
  const [offers, profile, availability, conversations] = await Promise.all([
    safe(() => request<unknown>("/api/v1/listeners/me/offers"), null),
    safe(() => request<unknown>("/api/v1/listeners/me/profile"), null),
    safe(() => request<unknown>("/api/v1/listeners/me/availability"), null),
    safe(() => request<unknown>("/api/v1/peer/conversations"), null),
  ]);

  const offerItems = asArray(offers);
  const availabilityItems = asArray(availability);
  const conversationItems = asArray(conversations);
  const live = [offers, profile, availability, conversations].some((r) => r !== null);
  if (!live) return { live: false };

  const conversationRows = [...offerItems, ...conversationItems].slice(0, 10).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      values: [
        field(record, ["topicCode", "title", "id"]),
        field(record, ["matchState", "conversationState", "status", "state"]),
        field(record, ["nextStep", "memberName", "updatedAt"]),
      ],
      status: field(record, ["assignmentState", "matchState", "status"]) || "Assigned",
    };
  });

  const availabilityRows = availabilityItems.slice(0, 10).map((item) => {
    const record = item as Record<string, unknown>;
    return {
      values: [
        field(record, ["day", "dayOfWeek", "label", "id"]),
        field(record, ["window", "startTime", "timeRange", "start"]),
        field(record, ["status", "state", "available"]),
      ],
      status: "Scheduled",
    };
  });

  return {
    live: true,
    metrics: [
      { label: "Offers", value: String(offerItems.length), note: "Assigned to you" },
      { label: "Conversations", value: String(conversationItems.length), note: "Peer chats" },
      { label: "Availability windows", value: String(availabilityItems.length), note: "Configured" },
    ],
    activities: offerItems.slice(0, 5).map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: "Support offer",
        detail: field(record, ["matchState", "status", "id"]),
        time: shortDate(record.createdAt ?? record.updatedAt),
      };
    }),
    sections: {
      conversations: {
        columns: ["Conversation", "State", "Next step"],
        rows: conversationRows.length
          ? conversationRows
          : [{ values: ["No conversations assigned", "—", "—"], status: "Empty" }],
      },
      availability: {
        columns: ["Day", "Window", "Status"],
        rows: availabilityRows.length
          ? availabilityRows
          : [{ values: ["No availability set", "—", "—"], status: "Empty" }],
      },
      training: {
        columns: ["Module", "Progress", "Due"],
        rows: profile
          ? [
              {
                values: [
                  field((profile as Record<string, unknown>), ["trainingStatus", "status", "readiness"]),
                  "Listener profile",
                  "—",
                ],
                status: "Recorded",
              },
            ]
          : [{ values: ["No training records", "—", "—"], status: "Empty" }],
      },
    },
  };
}

/** Supervisor dashboard: role assignments, workflow tasks, safety cases. */
async function fetchSupervisorData(request: ApiRequester): Promise<LiveDashboardData> {
  const [roles, tasks, safetyCases] = await Promise.all([
    safe(() => request<unknown>("/api/v1/admin/roles"), null),
    safe(() => request<unknown>("/api/v1/operations/workflow-tasks"), null),
    safe(() => request<unknown>("/api/v1/operations/safety/cases"), null),
  ]);

  const roleItems = asArray(roles).filter((item) => {
    const record = item as Record<string, unknown>;
    return /listener/i.test(field(record, ["roleCode", "role", "code"]));
  });
  const taskItems = asArray(tasks);
  const caseItems = asArray(safetyCases);
  const live = [roles, tasks, safetyCases].some((r) => r !== null);
  if (!live) return { live: false };

  return {
    live: true,
    metrics: [
      { label: "Listeners", value: String(roleItems.length), note: "Role assignments" },
      { label: "Open tasks", value: String(taskItems.length), note: "Workflow queue" },
      { label: "Safety cases", value: String(caseItems.length), note: "All statuses" },
    ],
    activities: taskItems.slice(0, 5).map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: "Workflow task",
        detail: field(record, ["taskType", "title", "status", "id"]),
        time: shortDate(record.createdAt ?? record.updatedAt),
      };
    }),
    sections: {
      listeners: {
        columns: ["Listener", "Role", "Status"],
        rows: roleItems.slice(0, 15).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["userId", "principalId", "id"]),
              field(record, ["roleCode", "role"]),
              field(record, ["status", "state", "assignmentState"]),
            ],
            status: field(record, ["assignmentState", "status"]) || "Assigned",
          };
        }),
      },
      "training-reviews": {
        columns: ["Task", "Type", "Updated"],
        rows: taskItems.slice(0, 15).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["title", "taskType", "id"]),
              field(record, ["taskType", "kind"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["status", "state"]) || "Open",
          };
        }),
      },
      quality: {
        columns: ["Case", "Status", "Updated"],
        rows: caseItems.slice(0, 15).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["id", "caseId", "reference"]),
              field(record, ["priority", "severity"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["status", "state", "caseState"]) || "Open",
          };
        }),
      },
    },
  };
}

/** Safety operations: assigned cases, handoffs (workflow tasks), resources. */
async function fetchSafetyData(request: ApiRequester): Promise<LiveDashboardData> {
  const [cases, resources, tasks] = await Promise.all([
    safe(() => request<unknown>("/api/v1/operations/safety/cases"), null),
    safe(() => request<unknown>("/api/v1/safety/resources"), null),
    safe(() => request<unknown>("/api/v1/operations/workflow-tasks"), null),
  ]);

  const caseItems = asArray(cases);
  const resourceItems = asArray(resources);
  const taskItems = asArray(tasks);
  const live = [cases, resources, tasks].some((r) => r !== null);
  if (!live) return { live: false };

  return {
    live: true,
    metrics: [
      { label: "Cases", value: String(caseItems.length), note: "All statuses" },
      { label: "Handoffs", value: String(taskItems.length), note: "Workflow tasks" },
      { label: "Resources", value: String(resourceItems.length), note: "Verified directory" },
    ],
    activities: caseItems.slice(0, 5).map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: "Safety case",
        detail: field(record, ["status", "priority", "id"]),
        time: shortDate(record.updatedAt ?? record.createdAt),
      };
    }),
    sections: {
      "case-queue": {
        columns: ["Case", "Priority", "Updated"],
        rows: caseItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["id", "caseId", "reference"]),
              field(record, ["priority", "severity", "status"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["status", "state", "caseState"]) || "Open",
          };
        }),
      },
      handoffs: {
        columns: ["Task", "Type", "Updated"],
        rows: taskItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["title", "taskType", "id"]),
              field(record, ["taskType", "kind"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["status", "state"]) || "Pending",
          };
        }),
      },
      resources: {
        columns: ["Resource", "Region", "Verified"],
        rows: resourceItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["name", "title", "id"]),
              field(record, ["region", "locale", "coverage"]),
              shortDate(record.verifiedAt ?? record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["verificationState", "status", "state"]) || "Listed",
          };
        }),
      },
    },
  };
}

/** Platform administrator: role assignments, notifications, content, tasks. */
async function fetchAdminData(request: ApiRequester): Promise<LiveDashboardData> {
  const [roles, notifications, content, tasks] = await Promise.all([
    safe(() => request<unknown>("/api/v1/admin/roles"), null),
    safe(() => request<unknown>("/api/v1/notifications"), null),
    safe(() => request<unknown>("/api/v1/admin/self-help/content"), null),
    safe(() => request<unknown>("/api/v1/operations/workflow-tasks"), null),
  ]);

  const roleItems = asArray(roles);
  const notificationItems = asArray(notifications);
  const contentItems = asArray(content);
  const taskItems = asArray(tasks);
  const live = [roles, notifications, content, tasks].some((r) => r !== null);
  if (!live) return { live: false };

  return {
    live: true,
    metrics: [
      { label: "Role assignments", value: String(roleItems.length), note: "Active grants" },
      { label: "Notifications", value: String(notificationItems.length), note: "Delivery status" },
      { label: "Content items", value: String(contentItems.length), note: "Self-help library" },
    ],
    activities: roleItems.slice(0, 5).map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: "Role assignment",
        detail: field(record, ["roleCode", "role", "userId"]),
        time: shortDate(record.createdAt ?? record.updatedAt),
      };
    }),
    sections: {
      "users-roles": {
        columns: ["Account", "Role", "Status"],
        rows: roleItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["userId", "principalId", "id"]),
              field(record, ["roleCode", "role"]),
              field(record, ["assignmentState", "status", "state"]),
            ],
            status: field(record, ["assignmentState", "status"]) || "Active",
          };
        }),
      },
      "service-health": {
        columns: ["Item", "Status", "Updated"],
        rows: contentItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["title", "id"]),
              field(record, ["approvalState", "status", "state"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["approvalState", "status"]) || "Listed",
          };
        }),
      },
      "audit-log": {
        columns: ["Task", "Type", "Updated"],
        rows: taskItems.slice(0, 20).map((item) => {
          const record = item as Record<string, unknown>;
          return {
            values: [
              field(record, ["title", "taskType", "id"]),
              field(record, ["taskType", "kind"]),
              shortDate(record.updatedAt ?? record.createdAt),
            ],
            status: field(record, ["status", "state"]) || "Recorded",
          };
        }),
      },
    },
  };
}

const FETCHERS: Record<string, (request: ApiRequester) => Promise<LiveDashboardData>> = {
  member: fetchMemberData,
  listener: fetchListenerData,
  "listener-supervisor": fetchSupervisorData,
  "safety-operations": fetchSafetyData,
  "platform-administrator": fetchAdminData,
};

/**
 * Loads live dashboard data for a MindSpace role.
 *
 * @param roleId - Dashboard role id (member, listener, ...).
 * @returns Normalized live data, or `{ live: false }` when the API/session
 *          is unavailable so callers can fall back to sample data.
 */
export async function getMindspaceDashboardData(
  roleId: string,
): Promise<LiveDashboardData> {
  const fetcher = FETCHERS[roleId];
  if (!fetcher) return { live: false };
  try {
    const { request } = await createMindspaceApiClient();
    return await fetcher(request);
  } catch {
    // No session, API down, or provisioning failed — caller shows sample data.
    return { live: false };
  }
}
