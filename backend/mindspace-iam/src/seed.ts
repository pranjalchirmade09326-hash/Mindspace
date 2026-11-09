import { Client } from "pg";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { demoPassword, demoUsers, type DemoUser } from "./demo-users.js";

const demoIds = {
  listenerProfile: "6f1c0a2e-6a1c-4a6e-9c1e-000000000001",
  training: "6f1c0a2e-6a1c-4a6e-9c1e-000000000002",
  supervisorAssignment: "6f1c0a2e-6a1c-4a6e-9c1e-000000000003",
  conductReport: "6f1c0a2e-6a1c-4a6e-9c1e-000000000004",
  feedback: "6f1c0a2e-6a1c-4a6e-9c1e-000000000005",
  safetyCase: "6f1c0a2e-6a1c-4a6e-9c1e-000000000006",
  workflowDefinition: "6f1c0a2e-6a1c-4a6e-9c1e-000000000007",
  workflowExecution: "6f1c0a2e-6a1c-4a6e-9c1e-000000000008",
  workflowTask: "6f1c0a2e-6a1c-4a6e-9c1e-000000000009",
  aiRun: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000a",
  toolInvocation: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000b",
  auditEvent: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000c",
  notification: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000d",
  followup: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000e",
  crisisResource: "6f1c0a2e-6a1c-4a6e-9c1e-00000000000f",
  conductConversation: "6f1c0a2e-6a1c-4a6e-9c1e-000000000010",
  feedbackConversation: "6f1c0a2e-6a1c-4a6e-9c1e-000000000011",
  correlation: "6f1c0a2e-6a1c-4a6e-9c1e-000000000012",
  matchRequest: "6f1c0a2e-6a1c-4a6e-9c1e-000000000013",
  conductMatch: "6f1c0a2e-6a1c-4a6e-9c1e-000000000014",
  feedbackMatch: "6f1c0a2e-6a1c-4a6e-9c1e-000000000015",
} as const;

function demo(id: string): DemoUser {
  const user = demoUsers.find((candidate) => candidate.id === id);
  if (!user) throw new Error(`Unknown demo user ${id}`);
  return user;
}

async function seedIamUsers() {
  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      const result = await auth.api.signUpEmail({
        body: { email: user.email, password: demoPassword, name: user.name },
      });
      if (result.user.id !== user.id) {
        throw new Error(
          `Deterministic demo id hook was not applied for ${user.email}: expected ${user.id}, received ${result.user.id}`,
        );
      }
      console.log(`created IAM user ${user.email} (${user.role})`);
      continue;
    }

    if (existing.id !== user.id) {
      throw new Error(
        `${user.email} already exists with id ${existing.id}; expected demo id ${user.id}. Remove the existing demo account before reseeding.`,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: user.role, name: user.name, emailVerified: true, banned: false, banReason: null, banExpires: null },
    });
    console.log(`updated IAM user ${user.email} (${user.role})`);
  }
}

async function seedDashboardData(pg: Client) {
  const member = demo("usr-demo-member-01");
  const member2 = demo("usr-demo-member-02");
  const member3 = demo("usr-demo-member-03");
  const listener = demo("usr-demo-listener-01");
  const listener2 = demo("usr-demo-listener-02");
  const listener3 = demo("usr-demo-listener-03");
  const listener4 = demo("usr-demo-listener-04");
  const supervisor = demo("usr-demo-supervisor-01");
  const safety = demo("usr-demo-safety-01");
  const admin = demo("usr-demo-admin-01");

  const id = (suffix: string) => `6f1c0a2e-6a1c-4a6e-9c1e-${suffix}`;

  const profiles = [
    { profileId: id("000000000101"), userId: listener2.id, applicationState: "approved", eligibilityState: "eligible", approved: true, capacity: 2, languages: ["en", "hi"] },
    { profileId: id("000000000102"), userId: listener3.id, applicationState: "pending", eligibilityState: "ineligible", approved: false, capacity: 2, languages: ["hi"] },
    { profileId: id("000000000103"), userId: listener4.id, applicationState: "approved", eligibilityState: "eligible", approved: true, capacity: 3, languages: ["en", "ta"] },
  ];

  for (const profile of profiles) {
    await pg.query(
      `INSERT INTO listener_profiles
         (id, user_id, application_state, eligibility_state, approved_at, eligibility_expires_at, capacity_limit, profile_languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        profile.profileId,
        profile.userId,
        profile.applicationState,
        profile.eligibilityState,
        profile.approved ? new Date() : null,
        profile.approved ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        profile.capacity,
        profile.languages,
      ],
    );
  }

  const profileIdByUser = new Map<string, string>();
  const profileRows = await pg.query<{ id: string; user_id: string }>(
    "SELECT id, user_id FROM listener_profiles WHERE user_id = ANY($1::text[])",
    [[listener.id, listener2.id, listener3.id, listener4.id]],
  );
  for (const row of profileRows.rows) profileIdByUser.set(row.user_id, row.id);
  const listenerProfileId = profileIdByUser.get(listener.id);
  const listener2ProfileId = profileIdByUser.get(listener2.id);
  const listener3ProfileId = profileIdByUser.get(listener3.id);
  const listener4ProfileId = profileIdByUser.get(listener4.id);
  if (!listenerProfileId || !listener2ProfileId || !listener3ProfileId || !listener4ProfileId) {
    throw new Error("Listener profile lookup failed");
  }

  const training = [
    { suffix: "000000000201", listenerId: listenerProfileId, moduleCode: "active_listening", state: "passed", completed: true, expires: true },
    { suffix: "000000000202", listenerId: listenerProfileId, moduleCode: "safety_escalation", state: "in_progress", completed: false, expires: false },
    { suffix: "000000000203", listenerId: listener2ProfileId, moduleCode: "active_listening", state: "passed", completed: true, expires: true },
    { suffix: "000000000204", listenerId: listener2ProfileId, moduleCode: "boundaries_and_escalation", state: "assigned", completed: false, expires: false },
    { suffix: "000000000205", listenerId: listener3ProfileId, moduleCode: "active_listening", state: "assigned", completed: false, expires: false },
    { suffix: "000000000206", listenerId: listener4ProfileId, moduleCode: "boundaries_and_escalation", state: "expired", completed: true, expires: false },
    { suffix: "000000000207", listenerId: listener4ProfileId, moduleCode: "safety_escalation", state: "in_progress", completed: false, expires: false },
  ];

  for (const record of training) {
    await pg.query(
      `INSERT INTO listener_training_records
         (id, listener_id, module_code, module_version, completion_state, completed_at, expires_at, reviewed_by_user_id)
       VALUES ($1, $2, $3, '2026.1', $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        id(record.suffix),
        record.listenerId,
        record.moduleCode,
        record.state,
        record.completed ? new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) : null,
        record.expires ? new Date(Date.now() + 345 * 24 * 60 * 60 * 1000) : null,
        supervisor.id,
      ],
    );
  }

  for (const [suffix, listenerProfileIdValue] of [
    ["000000000301", listener2ProfileId],
    ["000000000302", listener4ProfileId],
  ] as const) {
    await pg.query(
      `INSERT INTO listener_supervisor_assignments
         (id, listener_id, supervisor_user_id, assignment_state, assigned_by_user_id, reason_code)
       VALUES ($1, $2, $3, 'active', $4, 'demo_seed')
       ON CONFLICT DO NOTHING`,
      [id(suffix), listenerProfileIdValue, supervisor.id, admin.id],
    );
  }

  const availability = [
    { suffix: "000000000401", listenerId: listenerProfileId, start: "1 hour", end: "3 hours", state: "available", timezone: "Asia/Kolkata" },
    { suffix: "000000000402", listenerId: listenerProfileId, start: "1 day", end: "1 day 2 hours", state: "available", timezone: "Asia/Kolkata" },
    { suffix: "000000000403", listenerId: listenerProfileId, start: "2 days", end: "2 days 2 hours", state: "paused", timezone: "Asia/Kolkata" },
    { suffix: "000000000404", listenerId: listener2ProfileId, start: "3 days", end: "3 days 2 hours", state: "available", timezone: "Asia/Kolkata" },
    { suffix: "000000000405", listenerId: listener4ProfileId, start: "4 days", end: "4 days 3 hours", state: "available", timezone: "Asia/Kolkata" },
  ];

  for (const interval of availability) {
    await pg.query(
      `INSERT INTO listener_availability
         (id, listener_id, starts_at, ends_at, availability_state, timezone)
       VALUES ($1, $2, now() + $3::interval, now() + $4::interval, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id(interval.suffix), interval.listenerId, interval.start, interval.end, interval.state, interval.timezone],
    );
  }

  const requests = [
    { suffix: "000000000501", memberId: member2.id, state: "queued", languages: ["en", "hi"], offerTo: "000000000511", listenerId: listenerProfileId },
    { suffix: "000000000502", memberId: member3.id, state: "queued", languages: ["en"], offerTo: "000000000512", listenerId: listenerProfileId },
    { suffix: "000000000503", memberId: member2.id, state: "queued", languages: ["hi"], offerTo: "000000000513", listenerId: listener2ProfileId },
    { suffix: "000000000504", memberId: member3.id, state: "matched", languages: ["en"], offerTo: null, listenerId: listener2ProfileId },
    { suffix: "000000000505", memberId: member2.id, state: "matched", languages: ["en", "ta"], offerTo: null, listenerId: listener4ProfileId },
    { suffix: "000000000506", memberId: member.id, state: "queued", languages: ["en"], offerTo: null, listenerId: null },
  ];

  for (const request of requests) {
    await pg.query(
      `INSERT INTO listener_match_requests (id, member_id, request_state, preferred_languages, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '3 days')
       ON CONFLICT (id) DO NOTHING`,
      [id(request.suffix), request.memberId, request.state, request.languages],
    );
    if (request.offerTo && request.listenerId) {
      await pg.query(
        `INSERT INTO listener_matches (id, request_id, listener_id, match_state)
         VALUES ($1, $2, $3, 'offered')
         ON CONFLICT (id) DO NOTHING`,
        [id(request.offerTo), id(request.suffix), request.listenerId],
      );
    }
  }

  const acceptedMatches = [
    { suffix: "000000000514", requestId: "000000000504", listenerId: listener2ProfileId, conversationId: "000000000601", memberId: member3.id, channel: "text" },
    { suffix: "000000000515", requestId: "000000000505", listenerId: listener4ProfileId, conversationId: "000000000602", memberId: member2.id, channel: "voice" },
  ];

  for (const match of acceptedMatches) {
    await pg.query(
      `INSERT INTO listener_matches (id, request_id, listener_id, match_state, accepted_at)
       VALUES ($1, $2, $3, 'accepted', now())
       ON CONFLICT (id) DO NOTHING`,
      [id(match.suffix), id(match.requestId), match.listenerId],
    );
    await pg.query(
      `INSERT INTO peer_conversations (id, match_id, member_id, listener_id, channel, conversation_state)
       VALUES ($1, $2, $3, $4, $5, 'open')
       ON CONFLICT (id) DO NOTHING`,
      [id(match.conversationId), id(match.suffix), match.memberId, match.listenerId, match.channel],
    );
  }

  const conductReports = [
    { suffix: "000000000701", conversationId: id("000000000601"), reporter: member3.id, reported: listener2.id, category: "communication_preference", state: "open", assigned: supervisor.id },
    { suffix: "000000000702", conversationId: id("000000000602"), reporter: member2.id, reported: listener4.id, category: "boundary_concern", state: "resolved", assigned: supervisor.id },
  ];

  for (const report of conductReports) {
    await pg.query(
      `INSERT INTO conduct_reports
         (id, conversation_id, reporter_user_id, reported_user_id, category_code, report_state, assigned_to_user_id, resolved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        id(report.suffix),
        report.conversationId,
        report.reporter,
        report.reported,
        report.category,
        report.state,
        report.assigned,
        report.state === "resolved" ? new Date() : null,
      ],
    );
  }

  const safetyCases = [
    { suffix: "000000000801", memberId: member2.id, trigger: "peer_safety_check", state: "handed_off", priority: "urgent", assigned: safety.id, created: "5 hours", acknowledged: "4 hours", closed: null, resolution: null },
    { suffix: "000000000802", memberId: member3.id, trigger: "intake_risk_signal", state: "in_progress", priority: "routine", assigned: safety.id, created: "3 hours", acknowledged: "2 hours", closed: null, resolution: null },
    { suffix: "000000000803", memberId: member.id, trigger: "followup_overdue", state: "closed", priority: "routine", assigned: safety.id, created: "2 days", acknowledged: "2 days", closed: "1 day", resolution: "resolved_with_member" },
    { suffix: "000000000804", memberId: member2.id, trigger: "mood_low_signal", state: "new", priority: "routine", assigned: null, created: "30 minutes", acknowledged: null, closed: null, resolution: null },
  ];

  for (const safetyCase of safetyCases) {
    await pg.query(
      `INSERT INTO safety_cases
         (id, member_id, source_type, trigger_code, policy_version, case_state, priority_code, jurisdiction, assigned_responder_user_id, created_at, acknowledged_at, closed_at, resolution_code)
       VALUES ($1, $2, 'manual', $3, '2026.1', $4, $5, 'IN', $6, now() - $7::interval, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        id(safetyCase.suffix),
        safetyCase.memberId,
        safetyCase.trigger,
        safetyCase.state,
        safetyCase.priority,
        safetyCase.assigned,
        safetyCase.created,
        safetyCase.acknowledged ? new Date(Date.now() - 4 * 60 * 60 * 1000) : null,
        safetyCase.closed ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
        safetyCase.resolution,
      ],
    );
  }

  const resources = [
    { suffix: "000000000c01", type: "crisis_line", name: "National mental health helpline", state: "verified", contact: { phone: "000-000-0001", hours: "24x7" }, verified: true },
    { suffix: "000000000c02", type: "emergency", name: "Emergency services", state: "verified", contact: { phone: "112", hours: "24x7" }, verified: true },
    { suffix: "000000000c03", type: "community_support", name: "Community listening circle", state: "pending", contact: { phone: "000-000-0002", hours: "weekday evenings" }, verified: false },
  ];

  for (const resource of resources) {
    await pg.query(
      `INSERT INTO crisis_resources
         (id, region_code, locale, resource_type, display_name, contact_details, verification_state, verified_by_user_id, last_verified_at, effective_from)
       VALUES ($1, 'IN', 'en', $2, $3, $4::jsonb, $5, $6, $7, now())
       ON CONFLICT (id) DO NOTHING`,
      [
        id(resource.suffix),
        resource.type,
        resource.name,
        JSON.stringify(resource.contact),
        resource.state,
        resource.verified ? safety.id : null,
        resource.verified ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
      ],
    );
  }

  const safetyActions = [
    { suffix: "000000000901", caseSuffix: "000000000801", actionType: "responder_notified", state: "completed", resourceId: null, occurred: "4 hours" },
    { suffix: "000000000902", caseSuffix: "000000000801", actionType: "approved_resource_shared", state: "completed", resourceId: id("000000000c01"), occurred: "3 hours" },
    { suffix: "000000000903", caseSuffix: "000000000801", actionType: "contact_attempted", state: "attempted", resourceId: null, occurred: "2 hours" },
    { suffix: "000000000904", caseSuffix: "000000000006", actionType: "contact_pathway_confirmed", state: "completed", resourceId: null, occurred: "1 hour" },
    { suffix: "000000000905", caseSuffix: "000000000802", actionType: "case_review_started", state: "completed", resourceId: null, occurred: "90 minutes" },
    { suffix: "000000000906", caseSuffix: "000000000804", actionType: "case_triaged", state: "completed", resourceId: null, occurred: "25 minutes" },
    { suffix: "000000000907", caseSuffix: "000000000804", actionType: "responder_notified", state: "attempted", resourceId: id("000000000c02"), occurred: "10 minutes" },
  ];

  for (const action of safetyActions) {
    await pg.query(
      `INSERT INTO safety_case_actions (id, case_id, actor_user_id, action_type, action_state, resource_id, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() - $7::interval)
       ON CONFLICT (id) DO NOTHING`,
      [id(action.suffix), id(action.caseSuffix), safety.id, action.actionType, action.state, action.resourceId, action.occurred],
    );
  }

  const followups = [
    { suffix: "000000000a01", memberId: member3.id, sourceType: "goal", scheduled: "-2 hours", state: "scheduled", completedAt: null },
    { suffix: "000000000a02", memberId: member2.id, sourceType: "support_session", scheduled: "-2 days", state: "responded", completedAt: true },
    { suffix: "000000000a03", memberId: member.id, sourceType: "member_requested", scheduled: "2 days", state: "scheduled", completedAt: null },
    { suffix: "000000000a04", memberId: member3.id, sourceType: "support_session", scheduled: "-1 day", state: "skipped", completedAt: false },
  ];

  for (const followup of followups) {
    await pg.query(
      `INSERT INTO followups (id, member_id, source_type, scheduled_at, followup_state, completed_at)
       VALUES ($1, $2, $3, now() + $4::interval, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        id(followup.suffix),
        followup.memberId,
        followup.sourceType,
        followup.scheduled,
        followup.state,
        followup.completedAt ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
      ],
    );
  }

  const notifications = [
    { suffix: "000000000b01", memberId: member.id, type: "weekly_reflection", channel: "email", scheduled: "1 day", state: "queued", sent: false, deduplication: "demo-weekly-reflection-1" },
    { suffix: "000000000b02", memberId: member.id, type: "goal_checkin", channel: "in_app", scheduled: "6 hours", state: "queued", sent: false, deduplication: "demo-goal-checkin-1" },
    { suffix: "000000000b03", memberId: member.id, type: "support_followup", channel: "in_app", scheduled: "-2 days", state: "sent", sent: true, deduplication: "demo-support-followup-2" },
    { suffix: "000000000b04", memberId: member3.id, type: "support_followup", channel: "email", scheduled: "-1 day", state: "delivered", sent: true, deduplication: "demo-support-followup-3" },
  ];

  for (const notification of notifications) {
    await pg.query(
      `INSERT INTO notifications
         (id, user_id, notification_type, channel, payload_reference, scheduled_at, sent_at, delivery_state, deduplication_key)
       VALUES ($1, $2, $3, $4, $5, now() + $6::interval, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        id(notification.suffix),
        notification.memberId,
        notification.type,
        notification.channel,
        `demo://notifications/${notification.type}`,
        notification.scheduled,
        notification.sent ? new Date(Date.now() - 60 * 60 * 1000) : null,
        notification.state,
        notification.deduplication,
      ],
    );
  }

}

async function seedMindspaceApi(pg: Client) {
  const member = demo("usr-demo-member-01");
  const listener = demo("usr-demo-listener-01");
  const supervisor = demo("usr-demo-supervisor-01");
  const safety = demo("usr-demo-safety-01");
  const admin = demo("usr-demo-admin-01");

  await pg.query("BEGIN");
  try {
    for (const user of demoUsers) {
      await pg.query(
        `INSERT INTO app_principals (user_id, account_state)
         VALUES ($1, 'active')
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id],
      );
    }

    for (const user of demoUsers) {
      await pg.query(
        `INSERT INTO role_assignments (id, user_id, role_code, assignment_state, granted_by_user_id, decision_reason)
         SELECT gen_random_uuid(), $1, $2, 'active', $3, 'Synthetic demo seed'
         WHERE NOT EXISTS (
           SELECT 1 FROM role_assignments
           WHERE user_id = $1 AND role_code = $2 AND assignment_state = 'active'
         )`,
        [user.id, user.role, admin.id],
      );
      await pg.query(
        `INSERT INTO member_profiles (user_id, display_name)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id, user.name],
      );
    }

    const listenerProfile = await pg.query<{ id: string }>(
      `INSERT INTO listener_profiles
         (id, user_id, application_state, eligibility_state, approved_at, eligibility_expires_at, capacity_limit, profile_languages)
       VALUES ($1, $2, 'approved', 'eligible', now(), now() + interval '1 year', 3, ARRAY['en','hi'])
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id`,
      [demoIds.listenerProfile, listener.id],
    );
    const listenerProfileId = listenerProfile.rows[0]?.id
      ?? (await pg.query<{ id: string }>("SELECT id FROM listener_profiles WHERE user_id = $1", [listener.id])).rows[0]?.id;
    if (!listenerProfileId) throw new Error("Listener profile seed failed");

    await pg.query(
      `INSERT INTO listener_training_records
         (id, listener_id, module_code, module_version, completion_state, completed_at, expires_at, reviewed_by_user_id)
       VALUES ($1, $2, 'boundaries_and_escalation', '2026.1', 'passed', now(), now() + interval '1 year', $3)
       ON CONFLICT DO NOTHING`,
      [demoIds.training, listenerProfileId, supervisor.id],
    );

    await pg.query(
      `INSERT INTO listener_supervisor_assignments
         (id, listener_id, supervisor_user_id, assignment_state, assigned_by_user_id, reason_code)
       VALUES ($1, $2, $3, 'active', $4, 'demo_seed')
       ON CONFLICT DO NOTHING`,
      [demoIds.supervisorAssignment, listenerProfileId, supervisor.id, admin.id],
    );

    await pg.query(
      `INSERT INTO listener_match_requests (id, member_id, request_state)
       VALUES ($1, $2, 'matched')
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.matchRequest, member.id],
    );

    await pg.query(
      `INSERT INTO listener_matches (id, request_id, listener_id, match_state, accepted_at)
       VALUES ($1, $2, $3, 'accepted', now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.conductMatch, demoIds.matchRequest, listenerProfileId],
    );
    await pg.query(
      `INSERT INTO peer_conversations
         (id, match_id, member_id, listener_id, channel, conversation_state)
       VALUES ($1, $2, $3, $4, 'text', 'open')
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.conductConversation, demoIds.conductMatch, member.id, listenerProfileId],
    );

    await pg.query(
      `INSERT INTO listener_matches (id, request_id, listener_id, match_state, accepted_at, ended_at)
       VALUES ($1, $2, $3, 'accepted', now(), now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.feedbackMatch, demoIds.matchRequest, listenerProfileId],
    );
    await pg.query(
      `INSERT INTO peer_conversations
         (id, match_id, member_id, listener_id, channel, conversation_state, ended_at)
       VALUES ($1, $2, $3, $4, 'text', 'closed', now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.feedbackConversation, demoIds.feedbackMatch, member.id, listenerProfileId],
    );

    await pg.query(
      `INSERT INTO conduct_reports
         (id, conversation_id, reporter_user_id, reported_user_id, category_code, report_state)
       VALUES ($1, $2, $3, $4, 'boundary_concern', 'open')
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.conductReport, demoIds.conductConversation, member.id, listener.id],
    );

    await pg.query(
      `INSERT INTO listener_feedback
         (id, conversation_id, member_id, rating, review_state)
       VALUES ($1, $2, $3, 5, 'received')
       ON CONFLICT DO NOTHING`,
      [demoIds.feedback, demoIds.feedbackConversation, member.id],
    );

    await pg.query(
      `INSERT INTO safety_cases
         (id, member_id, source_type, trigger_code, policy_version, case_state, priority_code, assigned_responder_user_id, acknowledged_at)
       VALUES ($1, $2, 'manual', 'demo_followup_review', '2026.1', 'assigned', 'urgent', $3, now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.safetyCase, member.id, safety.id],
    );

    const definition = await pg.query<{ id: string }>(
      `INSERT INTO workflow_definitions (id, process_code, version, status, policy_version)
       VALUES ($1, 'P05_LISTENER_MATCHING', '1.0.0', 'active', '2026.1')
       ON CONFLICT (process_code) DO UPDATE SET status = 'active'
       RETURNING id`,
      [demoIds.workflowDefinition],
    );
    const definitionId = definition.rows[0]?.id;
    if (!definitionId) throw new Error("Workflow definition seed failed");

    await pg.query(
      `INSERT INTO workflow_executions
         (id, definition_id, temporal_workflow_id, subject_type, subject_id, status, correlation_id)
       VALUES ($1, $2, 'demo-p05-listener-matching-0001', 'listener_match_request', 'demo-request-0001', 'running', $3)
       ON CONFLICT DO NOTHING`,
      [demoIds.workflowExecution, definitionId, demoIds.correlation],
    );
    await pg.query(
      `INSERT INTO workflow_tasks
         (id, execution_id, task_code, assignee_user_id, required_role, status, due_at)
       VALUES ($1, $2, 'supervisor_readiness_review', $3, 'listener_supervisor', 'assigned', now() + interval '2 days')
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.workflowTask, demoIds.workflowExecution, supervisor.id],
    );

    await pg.query(
      `INSERT INTO ai_processing_runs
         (id, member_id, purpose_code, source_type, model_version, policy_version, run_state, started_at, completed_at)
       VALUES ($1, $2, 'wellbeing_reflection', 'wellbeing_session', 'demo-2026.1', '2026.1', 'succeeded', now() - interval '5 minutes', now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.aiRun, member.id],
    );
    await pg.query(
      `INSERT INTO agent_tool_invocations
         (id, agent_run_id, tool_code, tool_version, scope, input_digest, status, started_at, completed_at, correlation_id)
       VALUES ($1, $2, 'create_reflection_summary', '1.0.0', ARRAY['wellbeing:summary'], decode(repeat('ab', 32), 'hex'), 'succeeded', now() - interval '5 minutes', now(), $3)
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.toolInvocation, demoIds.aiRun, demoIds.correlation],
    );

    await pg.query(
      `INSERT INTO crisis_resources
         (id, region_code, locale, resource_type, display_name, contact_details, verification_state, verified_by_user_id, last_verified_at, effective_from)
       VALUES ($1, 'IN', 'en', 'crisis_line', 'Demo support line', $2::jsonb, 'verified', $3, now(), now())
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.crisisResource, JSON.stringify({ phone: "000-000-0000", note: "Synthetic demo resource" }), safety.id],
    );

    await pg.query(
      `INSERT INTO followups (id, member_id, source_type, scheduled_at, followup_state)
       VALUES ($1, $2, 'support_session', now() + interval '1 day', 'scheduled')
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.followup, member.id],
    );

    await pg.query(
      `INSERT INTO notifications
         (id, user_id, notification_type, channel, payload_reference, scheduled_at, delivery_state, deduplication_key)
       VALUES ($1, $2, 'support_followup', 'in_app', 'demo://notifications/support-followup', now(), 'queued', 'demo-support-followup-1')
       ON CONFLICT DO NOTHING`,
      [demoIds.notification, member.id],
    );

    await pg.query(
      `INSERT INTO audit_events
         (id, actor_user_id, actor_type, action_code, resource_type, purpose_code, outcome, correlation_id)
       VALUES ($1, $2, 'user', 'admin.role.grant', 'role_assignment', 'member_access', 'success', $3)
       ON CONFLICT (id) DO NOTHING`,
      [demoIds.auditEvent, admin.id, demoIds.correlation],
    );

    await seedDashboardData(pg);

    await pg.query("COMMIT");
    console.log("seeded MindSpace API principals, roles, and synthetic dashboard records");
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  await seedIamUsers();

  if (!config.seedMindspaceApi || !config.mindspaceApiDatabaseUrl) {
    console.log("Skipping MindSpace API seed (SEED_MINDSPACE_API=false)");
    return;
  }

  const pg = new Client({
    connectionString: config.mindspaceApiDatabaseUrl,
    statement_timeout: 30_000,
    lock_timeout: 10_000,
  });
  await pg.connect();
  try {
    await seedMindspaceApi(pg);
  } catch (error) {
    console.warn(
      "MindSpace API seed skipped. Run the mindspace-api database migration first (pnpm db:push), then reseed.",
    );
    console.warn(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pg.end();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
