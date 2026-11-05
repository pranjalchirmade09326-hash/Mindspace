import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import {
  dashboardRoles,
  getDashboardRole,
  type DashboardRole,
} from "../src/modules/client/mindspace-dashboard/dashboard-data";
import {
  MindspaceRoleDashboard,
  MindspaceRoleSection,
} from "../src/modules/client/mindspace-dashboard/MindspacePortal";
import { roleNavData, getMindspaceNavForPath } from "../src/modules/client/shared/components/menubar/menu-datas";

// Helper to render components wrapped in NextIntlClientProvider
function renderComponent(ui: React.ReactElement): string {
  return renderToStaticMarkup(
    React.createElement(
      NextIntlClientProvider,
      { locale: "en", messages: {} },
      ui
    )
  );
}

// ---------------------------------------------------------------------------
// 1. Empirically verify that every section in dashboard-data.ts can be resolved
//    and rendered without throwing errors or notFound.
// ---------------------------------------------------------------------------
test("Section Resolution & Rendering: Member workspace renders all 6 sections cleanly", () => {
  const member = getDashboardRole("member");
  assert.ok(member, "Member role must exist");

  const expectedMemberSections = [
    "my-support",
    "wellbeing",
    "mood",
    "journal",
    "goals",
    "privacy",
  ];

  assert.equal(
    member.sections.length,
    6,
    "Member workspace must have exactly 6 registered sections"
  );

  for (const sectionId of expectedMemberSections) {
    const sec = member.sections.find((s) => s.id === sectionId);
    assert.ok(sec, `Member section '${sectionId}' must be defined in dashboardRoles`);

    // Verify resolving and rendering with sample data
    let htmlSample = "";
    assert.doesNotThrow(() => {
      htmlSample = renderComponent(
        React.createElement(MindspaceRoleSection, {
          roleId: "member",
          sectionId,
          live: null,
        })
      );
    }, `Rendering member section '${sectionId}' with sample data must not throw`);

    assert.ok(
      htmlSample.length > 500,
      `Rendered HTML for member section '${sectionId}' must be non-empty`
    );
    assert.ok(
      htmlSample.includes(sec.title),
      `Rendered HTML must contain section title '${sec.title}'`
    );

    // Verify resolving and rendering with live data
    let htmlLive = "";
    assert.doesNotThrow(() => {
      htmlLive = renderComponent(
        React.createElement(MindspaceRoleSection, {
          roleId: "member",
          sectionId,
          live: {
            live: true,
            sections: {
              [sectionId]: {
                columns: ["Col A", "Col B"],
                rows: [{ values: ["Val 1", "Val 2"], status: "Active" }],
              },
            },
          },
        })
      );
    }, `Rendering member section '${sectionId}' with live data must not throw`);

    assert.ok(
      htmlLive.includes("Col A") && htmlLive.includes("Val 1"),
      `Rendered HTML must reflect live data override for '${sectionId}'`
    );
  }
});

test("Section Resolution & Rendering: Listener workspace renders all 4 sections cleanly", () => {
  const listener = getDashboardRole("listener");
  assert.ok(listener, "Listener role must exist");

  const expectedListenerSections = [
    "queue",
    "conversations",
    "training",
    "availability",
  ];

  assert.equal(
    listener.sections.length,
    4,
    "Listener workspace must have exactly 4 registered sections"
  );

  for (const sectionId of expectedListenerSections) {
    const sec = listener.sections.find((s) => s.id === sectionId);
    assert.ok(sec, `Listener section '${sectionId}' must be defined in dashboardRoles`);

    // Verify resolving and rendering with sample data
    let htmlSample = "";
    assert.doesNotThrow(() => {
      htmlSample = renderComponent(
        React.createElement(MindspaceRoleSection, {
          roleId: "listener",
          sectionId,
          live: null,
        })
      );
    }, `Rendering listener section '${sectionId}' with sample data must not throw`);

    assert.ok(
      htmlSample.length > 500,
      `Rendered HTML for listener section '${sectionId}' must be non-empty`
    );
    assert.ok(
      htmlSample.includes(sec.title),
      `Rendered HTML must contain section title '${sec.title}'`
    );

    // Verify resolving and rendering with live data
    let htmlLive = "";
    assert.doesNotThrow(() => {
      htmlLive = renderComponent(
        React.createElement(MindspaceRoleSection, {
          roleId: "listener",
          sectionId,
          live: {
            live: true,
            sections: {
              [sectionId]: {
                columns: ["Queue Item", "Status"],
                rows: [{ values: ["Peer Chat #1", "In Progress"], status: "Active" }],
              },
            },
          },
        })
      );
    }, `Rendering listener section '${sectionId}' with live data must not throw`);

    assert.ok(
      htmlLive.includes("Queue Item") && htmlLive.includes("Peer Chat #1"),
      `Rendered HTML must reflect live data override for '${sectionId}'`
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Strict Role Separation: Zero cross-leakage in rendered DOM
// ---------------------------------------------------------------------------
test("Strict Role Separation: Member overview and all 6 section routes return 0 listener elements", () => {
  const memberSections = [
    undefined, // overview
    "my-support",
    "wellbeing",
    "mood",
    "journal",
    "goals",
    "privacy",
  ];

  const forbiddenListenerPaths = [
    "/mindspace/listener",
    "/mindspace/listener/queue",
    "/mindspace/listener/conversations",
    "/mindspace/listener/training",
    "/mindspace/listener/availability",
  ];

  const forbiddenListenerSidebarTitles = [
    "Peer support queue",
    "Active conversations",
    "Training modules",
    "Availability &amp; hours",
    "Availability & hours",
  ];

  for (const sectionId of memberSections) {
    const html = renderComponent(
      sectionId === undefined
        ? React.createElement(MindspaceRoleDashboard, { roleId: "member", live: null })
        : React.createElement(MindspaceRoleSection, {
            roleId: "member",
            sectionId,
            live: null,
          })
    );

    // 1. Zero forbidden listener paths
    for (const forbiddenPath of forbiddenListenerPaths) {
      assert.ok(
        !html.includes(forbiddenPath),
        `Member route (section: ${sectionId ?? "overview"}) must NOT contain link to '${forbiddenPath}'`
      );
    }

    // 2. Zero forbidden listener sidebar titles
    for (const forbiddenTitle of forbiddenListenerSidebarTitles) {
      assert.ok(
        !html.includes(forbiddenTitle),
        `Member route (section: ${sectionId ?? "overview"}) must NOT contain listener title '${forbiddenTitle}'`
      );
    }

    // 3. No cross-role Switch Role loop
    assert.ok(
      !html.includes("Switch role:"),
      `Member route (section: ${sectionId ?? "overview"}) must NOT render 'Switch role:' breadcrumb`
    );
  }
});

test("Strict Role Separation: Listener overview and all 4 section routes return 0 member elements", () => {
  const listenerSections = [
    undefined, // overview
    "queue",
    "conversations",
    "training",
    "availability",
  ];

  const forbiddenMemberPaths = [
    "/mindspace/member",
    "/mindspace/member/my-support",
    "/mindspace/member/wellbeing",
    "/mindspace/member/mood",
    "/mindspace/member/journal",
    "/mindspace/member/goals",
    "/mindspace/member/privacy",
    "/intake/chat",
    "/intake/voice",
  ];

  const forbiddenMemberSidebarTitles = [
    "My support",
    "Mood tracking",
    "Journal",
    "Goals",
    "Privacy &amp; consent",
    "Privacy & consent",
    "Chat intake",
    "Voice intake",
  ];

  for (const sectionId of listenerSections) {
    const html = renderComponent(
      sectionId === undefined
        ? React.createElement(MindspaceRoleDashboard, { roleId: "listener", live: null })
        : React.createElement(MindspaceRoleSection, {
            roleId: "listener",
            sectionId,
            live: null,
          })
    );

    // 1. Zero forbidden member paths
    for (const forbiddenPath of forbiddenMemberPaths) {
      assert.ok(
        !html.includes(forbiddenPath),
        `Listener route (section: ${sectionId ?? "overview"}) must NOT contain link to '${forbiddenPath}'`
      );
    }

    // 2. Zero forbidden member titles / intake CTAs
    for (const forbiddenTitle of forbiddenMemberSidebarTitles) {
      assert.ok(
        !html.includes(forbiddenTitle),
        `Listener route (section: ${sectionId ?? "overview"}) must NOT contain member title '${forbiddenTitle}'`
      );
    }

    // 3. No cross-role Switch Role loop
    assert.ok(
      !html.includes("Switch role:"),
      `Listener route (section: ${sectionId ?? "overview"}) must NOT render 'Switch role:' breadcrumb`
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Adversarial / Boundary / notFound testing
// ---------------------------------------------------------------------------
test("Adversarial Bounds: Requesting listener section as member throws notFound", () => {
  const listenerSections = ["queue", "conversations", "training", "availability"];
  for (const sec of listenerSections) {
    assert.throws(
      () => {
        renderComponent(
          React.createElement(MindspaceRoleSection, {
            roleId: "member",
            sectionId: sec,
            live: null,
          })
        );
      },
      (err: any) => err?.message?.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
      `Requesting listener section '${sec}' with role 'member' must trigger 404 notFound`
    );
  }
});

test("Adversarial Bounds: Requesting member section as listener throws notFound", () => {
  const memberSections = ["my-support", "wellbeing", "mood", "journal", "goals", "privacy"];
  for (const sec of memberSections) {
    assert.throws(
      () => {
        renderComponent(
          React.createElement(MindspaceRoleSection, {
            roleId: "listener",
            sectionId: sec,
            live: null,
          })
        );
      },
      (err: any) => err?.message?.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
      `Requesting member section '${sec}' with role 'listener' must trigger 404 notFound`
    );
  }
});

test("Adversarial Bounds: Non-existent roles and malicious section IDs throw notFound", () => {
  const maliciousInputs = [
    { roleId: "admin-fake", sectionId: "overview" },
    { roleId: "member", sectionId: "../etc/passwd" },
    { roleId: "member", sectionId: "<script>alert(1)</script>" },
    { roleId: "listener", sectionId: "__proto__" },
    { roleId: "", sectionId: "" },
  ];

  for (const input of maliciousInputs) {
    assert.throws(
      () => {
        renderComponent(
          React.createElement(MindspaceRoleSection, {
            roleId: input.roleId,
            sectionId: input.sectionId,
            live: null,
          })
        );
      },
      (err: any) => err?.message?.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
      `Malicious/invalid role '${input.roleId}' or section '${input.sectionId}' must trigger 404 notFound`
    );
  }
});

// ---------------------------------------------------------------------------
// 4. Persistent Sidebar & Breadcrumb Integrity on all 10 sub-routes
// ---------------------------------------------------------------------------
test("Persistent Sidebar & Breadcrumb: All 10 section pages retain persistent sidebar with aria-current", () => {
  const testCases: { roleId: "member" | "listener"; sectionId: string; expectedSidebarCount: number }[] = [
    // 6 Member sections
    { roleId: "member", sectionId: "my-support", expectedSidebarCount: 7 }, // overview + 6 sections
    { roleId: "member", sectionId: "wellbeing", expectedSidebarCount: 7 },
    { roleId: "member", sectionId: "mood", expectedSidebarCount: 7 },
    { roleId: "member", sectionId: "journal", expectedSidebarCount: 7 },
    { roleId: "member", sectionId: "goals", expectedSidebarCount: 7 },
    { roleId: "member", sectionId: "privacy", expectedSidebarCount: 7 },
    // 4 Listener sections
    { roleId: "listener", sectionId: "queue", expectedSidebarCount: 5 }, // overview + 4 sections
    { roleId: "listener", sectionId: "conversations", expectedSidebarCount: 5 },
    { roleId: "listener", sectionId: "training", expectedSidebarCount: 5 },
    { roleId: "listener", sectionId: "availability", expectedSidebarCount: 5 },
  ];

  for (const { roleId, sectionId, expectedSidebarCount } of testCases) {
    const html = renderComponent(
      React.createElement(MindspaceRoleSection, {
        roleId,
        sectionId,
        live: null,
      })
    );

    // 1. Sidebar <aside> exists
    assert.ok(
      html.includes("<aside"),
      `Role '${roleId}' section '${sectionId}' must render persistent <aside> sidebar`
    );

    // 2. aria-current="page" is applied to the active section link
    const expectedHref = `/mindspace/${roleId}/${sectionId}`;
    assert.ok(
      html.includes(`href="${expectedHref}" aria-current="page"`),
      `Active section link '${expectedHref}' must have aria-current="page"`
    );

    // 3. Breadcrumb navigation is rendered
    assert.ok(
      html.includes('aria-label="Breadcrumb"'),
      `Role '${roleId}' section '${sectionId}' must render breadcrumb navigation`
    );
    assert.ok(
      html.includes(`href="/mindspace/${roleId}"`),
      `Breadcrumb must link back to role overview '/mindspace/${roleId}'`
    );
  }
});
