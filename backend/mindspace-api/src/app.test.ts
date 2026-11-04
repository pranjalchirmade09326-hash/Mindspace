import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "./app.js";

test("Swagger documents MindSpace member APIs and protected routes reject anonymous requests", async () => {
  const app = await buildApp();
  try {
    await app.ready();

    const specification = app.swagger();
    assert.ok(specification.paths);
    const paths = specification.paths;
    assert.equal(specification.info.title, "MindSpace API");
    assert.ok(paths["/api/v1/me"]);
    assert.ok(paths["/api/v1/members/me/provision"]);
    assert.ok(paths["/api/v1/members/me/profile"]);
    assert.ok(paths["/api/v1/members/me/preferences"]);
    assert.ok(paths["/api/v1/consents"]);
    assert.ok(paths["/api/v1/privacy-requests"]);
    assert.ok(paths["/api/v1/wellbeing/moods"]);
    assert.ok(paths["/api/v1/wellbeing/journal"]);
    assert.ok(paths["/api/v1/wellbeing/goals"]);
    assert.ok(paths["/api/v1/wellbeing/reflections"]);
    assert.ok(paths["/api/v1/wellbeing/sessions"]);
    assert.ok(paths["/api/v1/followups"]);
    assert.ok(paths["/api/v1/intakes/{intakeId}/summaries"]);
    assert.ok(paths["/api/v1/peer/match-requests"]);
    assert.ok(paths["/api/v1/peer/conversations/{id}/messages"]);
    assert.ok(paths["/api/v1/operations/matches"]);
    assert.ok(paths["/api/v1/operations/safety/cases"]);
    assert.ok(paths["/api/v1/safety/resources"]);
    assert.ok(paths["/api/v1/admin/roles"]);
    assert.ok(paths["/api/v1/admin/workflow-definitions"]);
    assert.ok(paths["/api/v1/agent/tool-invocations"]);
    assert.ok(paths["/api/v1/admin/outbox-events"]);
    assert.ok(paths["/api/v1/admin/event-consumer-receipts/{id}"]);
    assert.ok(paths["/api/v1/notifications"]);
    assert.deepEqual(
      paths["/api/v1/members/me/profile"]?.get?.security,
      [{ bearerAuth: [] }],
    );

    const swaggerUiResponse = await app.inject({ method: "GET", url: "/api-docs" });
    assert.equal(swaggerUiResponse.statusCode, 200);
    const openApiResponse = await app.inject({ method: "GET", url: "/api-docs/json" });
    assert.equal(openApiResponse.statusCode, 200);
    assert.equal(openApiResponse.json().info.title, "MindSpace API");

    const anonymousResponse = await app.inject({
      method: "GET",
      url: "/api/v1/members/me/profile",
    });
    assert.equal(anonymousResponse.statusCode, 401);
    assert.equal(anonymousResponse.json().error.code, "UNAUTHENTICATED");

    const anonymousProvisionResponse = await app.inject({
      method: "POST",
      url: "/api/v1/members/me/provision",
    });
    assert.equal(anonymousProvisionResponse.statusCode, 401);

    for (const route of [
      { method: "GET", url: "/api/v1/wellbeing/journal" },
      { method: "GET", url: "/api/v1/peer/match-requests" },
      { method: "GET", url: "/api/v1/operations/safety/cases" },
      { method: "GET", url: "/api/v1/admin/roles" },
    ]) {
      const response = await app.inject(route);
      assert.equal(response.statusCode, 401, `${route.url} should reject anonymous access`);
    }

    const liveResponse = await app.inject({ method: "GET", url: "/health/live" });
    assert.equal(liveResponse.statusCode, 200);
  } finally {
    await app.close();
  }
});
