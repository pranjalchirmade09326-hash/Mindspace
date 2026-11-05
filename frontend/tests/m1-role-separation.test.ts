import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dashboardRoles, getDashboardRole } from "../src/modules/client/mindspace-dashboard/dashboard-data";
import { roleNavData, getMindspaceNavForPath } from "../src/modules/client/shared/components/menubar/menu-datas";

const PORTAL_PATH = path.resolve(__dirname, "../src/modules/client/mindspace-dashboard/MindspacePortal.tsx");
const ROLE_SWITCHER_PATH = path.resolve(__dirname, "../src/modules/client/mindspace-dashboard/components/RoleSwitcherControl.tsx");
const APP_NAVBAR_PATH = path.resolve(__dirname, "../src/modules/client/shared/components/navbar/AppNavbar.tsx");

// ---------------------------------------------------------------------------
// 1. Role Section Registration in dashboard-data.ts
// ---------------------------------------------------------------------------
test("Section Registration: Member workspace has all 6 required sections", () => {
  const member = getDashboardRole("member");
  assert.ok(member, "Member role should exist in dashboardRoles");
  assert.equal(member.id, "member");

  const requiredSections = [
    { id: "my-support", title: "My support" },
    { id: "wellbeing", title: "Wellbeing" },
    { id: "mood", title: "Mood tracking" },
    { id: "journal", title: "Journal" },
    { id: "goals", title: "Goals" },
    { id: "privacy", title: "Privacy & consent" },
  ];

  assert.equal(member.sections.length, 6, "Member must have exactly 6 sections registered");

  requiredSections.forEach((req, idx) => {
    const sec = member.sections[idx];
    assert.equal(sec.id, req.id, `Section at index ${idx} should have id ${req.id}`);
    assert.equal(sec.title, req.title, `Section ${req.id} should have title "${req.title}"`);
    assert.ok(sec.description && sec.description.length > 0, `Section ${req.id} should have a description`);
    assert.ok(sec.icon, `Section ${req.id} should have an icon assigned`);
    assert.ok(sec.columns.length > 0, `Section ${req.id} should have columns defined`);
    assert.ok(sec.rows.length > 0, `Section ${req.id} should have sample rows defined`);
  });
});

test("Section Registration: Listener workspace has all 4 required sections", () => {
  const listener = getDashboardRole("listener");
  assert.ok(listener, "Listener role should exist in dashboardRoles");
  assert.equal(listener.id, "listener");

  const requiredSections = [
    { id: "queue", title: "Peer support queue" },
    { id: "conversations", title: "Active conversations" },
    { id: "training", title: "Training modules" },
    { id: "availability", title: "Availability & hours" },
  ];

  assert.equal(listener.sections.length, 4, "Listener must have exactly 4 sections registered");

  requiredSections.forEach((req, idx) => {
    const sec = listener.sections[idx];
    assert.equal(sec.id, req.id, `Section at index ${idx} should have id ${req.id}`);
    assert.equal(sec.title, req.title, `Section ${req.id} should have title "${req.title}"`);
    assert.ok(sec.description && sec.description.length > 0, `Section ${req.id} should have a description`);
    assert.ok(sec.icon, `Section ${req.id} should have an icon assigned`);
    assert.ok(sec.columns.length > 0, `Section ${req.id} should have columns defined`);
    assert.ok(sec.rows.length > 0, `Section ${req.id} should have sample rows defined`);
  });
});

// ---------------------------------------------------------------------------
// 2. Separate Navigation in menu-datas.ts (Zero Cross-Leakage)
// ---------------------------------------------------------------------------
test("Navigation Separation: Member nav contains strictly member items with zero listener items", () => {
  const memberConfig = roleNavData.member;
  assert.ok(memberConfig, "roleNavData.member must be defined");

  const allMemberUrls = memberConfig.navGroups.flatMap((g) => g.items.map((i: any) => i.url));

  const expectedMemberUrls = [
    "/mindspace/member",
    "/mindspace/member/my-support",
    "/mindspace/member/wellbeing",
    "/mindspace/member/mood",
    "/mindspace/member/journal",
    "/mindspace/member/goals",
    "/mindspace/member/privacy",
  ];

  expectedMemberUrls.forEach((url) => {
    assert.ok(allMemberUrls.includes(url), `Member nav must include ${url}`);
  });

  // Zero listener items in member nav
  const listenerKeywords = ["queue", "conversations", "training", "availability"];
  allMemberUrls.forEach((url) => {
    listenerKeywords.forEach((kw) => {
      assert.ok(
        !url.includes(`/listener/${kw}`),
        `Member nav must NOT contain listener route: ${url}`
      );
    });
    assert.notEqual(url, "/mindspace/listener", "Member nav must NOT contain /mindspace/listener");
  });
});

test("Navigation Separation: Listener nav contains strictly listener items with zero member items", () => {
  const listenerConfig = roleNavData.listener;
  assert.ok(listenerConfig, "roleNavData.listener must be defined");

  const allListenerUrls = listenerConfig.navGroups.flatMap((g) => g.items.map((i: any) => i.url));

  const expectedListenerUrls = [
    "/mindspace/listener",
    "/mindspace/listener/queue",
    "/mindspace/listener/conversations",
    "/mindspace/listener/training",
    "/mindspace/listener/availability",
  ];

  expectedListenerUrls.forEach((url) => {
    assert.ok(allListenerUrls.includes(url), `Listener nav must include ${url}`);
  });

  // Zero member items in listener nav
  const memberKeywords = ["my-support", "wellbeing", "mood", "journal", "goals", "privacy", "intake"];
  allListenerUrls.forEach((url) => {
    memberKeywords.forEach((kw) => {
      assert.ok(
        !url.includes(kw),
        `Listener nav must NOT contain member keyword ${kw}: ${url}`
      );
    });
    assert.notEqual(url, "/mindspace/member", "Listener nav must NOT contain /mindspace/member");
  });
});

test("Navigation Routing: getMindspaceNavForPath returns role-isolated nav groups", () => {
  const memberNav = getMindspaceNavForPath("/mindspace/member");
  const memberSectionNav = getMindspaceNavForPath("/en/mindspace/member/mood");
  assert.deepEqual(memberNav, roleNavData.member.navGroups);
  assert.deepEqual(memberSectionNav, roleNavData.member.navGroups);

  const listenerNav = getMindspaceNavForPath("/mindspace/listener");
  const listenerSectionNav = getMindspaceNavForPath("/hi/mindspace/listener/queue");
  assert.deepEqual(listenerNav, roleNavData.listener.navGroups);
  assert.deepEqual(listenerSectionNav, roleNavData.listener.navGroups);
});

// ---------------------------------------------------------------------------
// 3. Zero-Cross-Leakage & Isolated Layout in MindspacePortal.tsx
// ---------------------------------------------------------------------------
test("Structural Integrity: MindspacePortal.tsx eliminates cross-role switch leakage", () => {
  const portalCode = fs.readFileSync(PORTAL_PATH, "utf-8");

  // No "Switch role:" loop
  assert.ok(!portalCode.includes("Switch role:"), "MindspacePortal must NOT contain 'Switch role:' breadcrumb loop");

  // RoleSwitcher pill bar should NOT be used in role dashboards
  assert.ok(!portalCode.includes("<RoleSwitcher activeRole={role.id} />"), "RoleSwitcher must not be used in role dashboards");

  // RoleWorkspaceLayout is used
  assert.ok(portalCode.includes("RoleWorkspaceLayout"), "RoleWorkspaceLayout must be defined and used for workspace layout");

  // ListenerDashboard exists
  assert.ok(portalCode.includes("function ListenerDashboard"), "ListenerDashboard must be defined as a dedicated role component");

  // MemberDashboard exists
  assert.ok(portalCode.includes("function MemberDashboard"), "MemberDashboard must be defined as a dedicated role component");

  // Persistent sidebar on section pages
  assert.ok(
    portalCode.includes("activeSectionId={sectionId}"),
    "MindspaceRoleSection must pass activeSectionId to maintain persistent sidebar"
  );
});

// ---------------------------------------------------------------------------
// 4. Accessible Role Switcher Control
// ---------------------------------------------------------------------------
test("Accessibility & Semantics: RoleSwitcherControl provides accessible radiogroup semantics", () => {
  assert.ok(fs.existsSync(ROLE_SWITCHER_PATH), "RoleSwitcherControl.tsx must exist");
  const controlCode = fs.readFileSync(ROLE_SWITCHER_PATH, "utf-8");

  assert.ok(controlCode.includes('role="radiogroup"'), "Control container must have role='radiogroup'");
  assert.ok(controlCode.includes('role="radio"'), "Control buttons must have role='radio'");
  assert.ok(controlCode.includes("aria-checked="), "Control buttons must have aria-checked state");
  assert.ok(controlCode.includes("aria-label="), "Control must have aria-label for screen readers");
  assert.ok(controlCode.includes("/api/auth/dev-login"), "Control must trigger dev-login session update");
});

test("Header Integration: AppNavbar mounts RoleSwitcherControl", () => {
  const navbarCode = fs.readFileSync(APP_NAVBAR_PATH, "utf-8");

  assert.ok(
    navbarCode.includes("RoleSwitcherControl"),
    "AppNavbar must import and render RoleSwitcherControl"
  );
  assert.ok(
    navbarCode.includes("<RoleSwitcherControl"),
    "AppNavbar must render <RoleSwitcherControl"
  );
});
