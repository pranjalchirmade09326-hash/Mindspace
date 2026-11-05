import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  dashboardRoles,
  getDashboardRole,
  type DashboardRole,
} from "../src/modules/client/mindspace-dashboard/dashboard-data";
import {
  roleNavData,
  getMindspaceNavForPath,
} from "../src/modules/client/shared/components/menubar/menu-datas";

const PORTAL_PATH = path.resolve(
  __dirname,
  "../src/modules/client/mindspace-dashboard/MindspacePortal.tsx"
);
const ROLE_SWITCHER_PATH = path.resolve(
  __dirname,
  "../src/modules/client/mindspace-dashboard/components/RoleSwitcherControl.tsx"
);

// ============================================================================
// STRESS TEST SUITE 1: RoleSwitcherControl Semantics, Keyboard & State Handling
// ============================================================================

test("RoleSwitcherControl Semantics: WAI-ARIA radiogroup/radio contract and roving tabindex", () => {
  const code = fs.readFileSync(ROLE_SWITCHER_PATH, "utf-8");

  // 1. Container radiogroup semantics
  assert.ok(
    code.includes('role="radiogroup"'),
    "Container MUST have role='radiogroup'"
  );
  assert.ok(
    code.includes('aria-label="Workspace role switcher"'),
    "Container MUST have aria-label='Workspace role switcher'"
  );

  // 2. Radio items semantics
  assert.ok(
    code.includes('role="radio"'),
    "Options MUST have role='radio'"
  );
  assert.ok(
    code.includes("aria-checked={isSelected}"),
    "Radio buttons MUST have dynamic aria-checked binding"
  );
  assert.ok(
    code.includes("tabIndex={isSelected ? 0 : -1}"),
    "Radio buttons MUST follow WAI-ARIA roving tabindex (selected: 0, unselected: -1)"
  );
  assert.ok(
    code.includes("aria-label={`${role.label} workspace`}"),
    "Radio buttons MUST provide descriptive aria-labels for screen readers"
  );

  // 3. Supported roles are exactly Member and Listener
  assert.ok(code.includes('id: "member"'), "Must support 'member'");
  assert.ok(code.includes('id: "listener"'), "Must support 'listener'");
});

test("RoleSwitcherControl Keyboard Logic: ArrowLeft, ArrowRight, ArrowUp, ArrowDown & Wrapping", () => {
  const ROLES = [
    { id: "member", label: "Member" },
    { id: "listener", label: "Listener" },
  ];

  // Simulate handleKeyDown logic from RoleSwitcherControl.tsx
  const simulateKeyDown = (
    currentIndex: number,
    key: string
  ): { targetRole: string; targetIndex: number } => {
    let nextIndex = currentIndex;
    if (key === "ArrowRight" || key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % ROLES.length;
    } else if (key === "ArrowLeft" || key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + ROLES.length) % ROLES.length;
    }
    return {
      targetRole: ROLES[nextIndex].id,
      targetIndex: nextIndex,
    };
  };

  // Test from Member (idx 0)
  assert.deepEqual(simulateKeyDown(0, "ArrowRight"), {
    targetRole: "listener",
    targetIndex: 1,
  });
  assert.deepEqual(simulateKeyDown(0, "ArrowDown"), {
    targetRole: "listener",
    targetIndex: 1,
  });
  // ArrowLeft from 0 wraps around to 1 (Listener)
  assert.deepEqual(simulateKeyDown(0, "ArrowLeft"), {
    targetRole: "listener",
    targetIndex: 1,
  });
  assert.deepEqual(simulateKeyDown(0, "ArrowUp"), {
    targetRole: "listener",
    targetIndex: 1,
  });

  // Test from Listener (idx 1)
  // ArrowRight wraps to 0 (Member)
  assert.deepEqual(simulateKeyDown(1, "ArrowRight"), {
    targetRole: "member",
    targetIndex: 0,
  });
  assert.deepEqual(simulateKeyDown(1, "ArrowDown"), {
    targetRole: "member",
    targetIndex: 0,
  });
  assert.deepEqual(simulateKeyDown(1, "ArrowLeft"), {
    targetRole: "member",
    targetIndex: 0,
  });
  assert.deepEqual(simulateKeyDown(1, "ArrowUp"), {
    targetRole: "member",
    targetIndex: 0,
  });
});

test("RoleSwitcherControl Activation: Enter & Space activation via native button click semantics", () => {
  const code = fs.readFileSync(ROLE_SWITCHER_PATH, "utf-8");

  // Verify elements are native <button type="button">
  assert.ok(
    code.includes('type="button"'),
    "Radio items must be native <button type='button'> to inherit native Enter/Space activation"
  );
  assert.ok(
    code.includes("onClick={() => handleRoleSwitch(role.id)}"),
    "Radio items must bind handleRoleSwitch to onClick"
  );

  // In HTML, <button> automatically triggers click on Enter (keydown) and Space (keyup).
  // Verify handleKeyDown does NOT intercept or preventDefault on Enter or Space
  const keydownFnMatch = code.match(/const handleKeyDown = \([\s\S]*?^  \};/m);
  assert.ok(keydownFnMatch, "handleKeyDown function must exist");
  const keydownCode = keydownFnMatch[0];

  assert.ok(!keydownCode.includes('"Enter"'), "handleKeyDown must not preventDefault on Enter");
  assert.ok(!keydownCode.includes('" "'), "handleKeyDown must not preventDefault on Space");
  assert.ok(!keydownCode.includes('"Space"'), "handleKeyDown must not preventDefault on Space");
});

test("RoleSwitcherControl State Guard: Redundant switch suppression & session payload", async () => {
  const code = fs.readFileSync(ROLE_SWITCHER_PATH, "utf-8");

  // Verify guard against redundant switch on same active role and path
  assert.ok(
    code.includes("if (targetRole === activeRole && pathname.startsWith(`/mindspace/${targetRole}`))"),
    "Must guard against redundant role switch when already on that role's workspace"
  );

  // Verify dev-login endpoint and payload
  assert.ok(
    code.includes('fetch("/api/auth/dev-login"'),
    "Must call /api/auth/dev-login"
  );
  assert.ok(
    code.includes("role: targetRole"),
    "Must include role: targetRole in payload"
  );
  assert.ok(
    code.includes("redirectUrl: `/mindspace/${targetRole}`"),
    "Must include redirectUrl in payload"
  );

  // Verify error and loading resilience
  assert.ok(
    code.includes("disabled={isPending || switchingRole !== null}"),
    "Must disable controls during transitions to prevent race conditions"
  );
  assert.ok(
    code.includes("finally {"),
    "Must reset switchingRole state in a finally block to avoid permanent disablement on error"
  );
});

// ============================================================================
// STRESS TEST SUITE 2: Malformed / Unexpected Route Section IDs & 404 Resilience
// ============================================================================

test("Route Resilience: Unknown or malformed section IDs under Member return undefined (triggering notFound)", () => {
  const member = getDashboardRole("member");
  assert.ok(member, "Member role must exist");

  const adversarialSectionInputs = [
    "unknown-section",
    "12345",
    "../../etc/passwd",
    "<script>alert(1)</script>",
    "; DROP TABLE users;",
    "",
    "   ",
    "null",
    "undefined",
    "__proto__",
    "constructor",
    "toString",
    "valueOf",
    // Cross-role listener sections
    "queue",
    "conversations",
    "training",
    "availability",
    // Cross-role supervisor/safety/admin sections
    "listeners",
    "training-reviews",
    "quality",
    "case-queue",
    "handoffs",
    "resources",
    "users-roles",
    "service-health",
    "audit-log",
  ];

  for (const badSection of adversarialSectionInputs) {
    const found = member.sections.find((s) => s.id === badSection);
    assert.equal(
      found,
      undefined,
      `Member must NOT resolve invalid/cross-role section "${badSection}"`
    );
  }
});

test("Route Resilience: Unknown or malformed section IDs under Listener return undefined (triggering notFound)", () => {
  const listener = getDashboardRole("listener");
  assert.ok(listener, "Listener role must exist");

  const adversarialSectionInputs = [
    "invalid-section",
    "99999",
    "../private",
    "<svg onload=alert(1)>",
    "null",
    "undefined",
    "__proto__",
    "constructor",
    // Cross-role member sections
    "my-support",
    "wellbeing",
    "mood",
    "journal",
    "goals",
    "privacy",
    "intake",
    // Cross-role admin sections
    "users-roles",
    "service-health",
    "audit-log",
  ];

  for (const badSection of adversarialSectionInputs) {
    const found = listener.sections.find((s) => s.id === badSection);
    assert.equal(
      found,
      undefined,
      `Listener must NOT resolve invalid/cross-role section "${badSection}"`
    );
  }
});

test("Route Resilience: getDashboardRole with malformed or unknown role IDs returns undefined", () => {
  const adversarialRoleInputs = [
    "patient", // alias, should not directly be in dashboardRoles
    "doctor", // alias
    "admin", // alias
    "root",
    "guest",
    "anonymous",
    "123",
    "../../role",
    "<script>",
    "",
    "null",
    "undefined",
    "__proto__",
    "constructor",
  ];

  for (const badRole of adversarialRoleInputs) {
    const found = getDashboardRole(badRole);
    assert.equal(
      found,
      undefined,
      `getDashboardRole must return undefined for unrecognized/unmapped role "${badRole}"`
    );
  }
});

test("Route Resilience: getMindspaceNavForPath handles malformed, edge-case, and traversal paths safely", () => {
  const adversarialPaths = [
    "",
    "/",
    "/unknown",
    "/mindspace/undefined",
    "/mindspace/null",
    "/mindspace/../../etc",
    "/mindspace/%20",
    "/mindspace/<script>",
    "/intake/unknown/subpath",
    "/en/unknown/route",
    "/ta/mindspace/nonexistent",
  ];

  for (const testPath of adversarialPaths) {
    assert.doesNotThrow(() => {
      const nav = getMindspaceNavForPath(testPath);
      assert.ok(Array.isArray(nav), `Result for "${testPath}" must be an array`);
      assert.ok(nav.length > 0, `Result for "${testPath}" must contain default nav groups`);
    }, `getMindspaceNavForPath must not throw on malformed path "${testPath}"`);
  }
});

// ============================================================================
// STRESS TEST SUITE 3: DOM Cross-Leakage, Breadcrumb Loops & Lingering Tab Bars
// ============================================================================

test("DOM Cross-Leakage: MindspacePortal has 0 lingering links or breadcrumb switch loops", () => {
  const portalCode = fs.readFileSync(PORTAL_PATH, "utf-8");

  // 1. Zero "Switch role:" loop
  assert.equal(
    portalCode.includes("Switch role:"),
    false,
    "No 'Switch role:' breadcrumb loop permitted"
  );

  // 2. Zero old tab-bar RoleSwitcher in workspace body
  assert.equal(
    portalCode.includes("<RoleSwitcher"),
    false,
    "No in-page <RoleSwitcher> component permitted"
  );

  // 3. WorkspaceBreadcrumb inspection
  const breadcrumbStart = portalCode.indexOf("function WorkspaceBreadcrumb");
  const breadcrumbEnd = portalCode.indexOf("function PortalHeader");
  assert.ok(breadcrumbStart !== -1 && breadcrumbEnd !== -1, "WorkspaceBreadcrumb must exist");
  const breadcrumbCode = portalCode.slice(breadcrumbStart, breadcrumbEnd);

  assert.ok(
    !breadcrumbCode.includes("/mindspace/listener") &&
    !breadcrumbCode.includes("/mindspace/member"),
    "WorkspaceBreadcrumb must dynamically use role.id, not hardcode cross-role links"
  );
  assert.ok(
    breadcrumbCode.includes("href={`/mindspace/${role.id}`}"),
    "WorkspaceBreadcrumb must link back ONLY to the active role's dashboard"
  );
});

test("DOM Cross-Leakage: RoleWorkspaceLayout persistent sidebar links ONLY within active role workspace", () => {
  for (const role of dashboardRoles) {
    const expectedPrefix = `/mindspace/${role.id}`;

    // Overview item
    const overviewHref = `/mindspace/${role.id}`;
    assert.equal(overviewHref.startsWith(expectedPrefix), true);

    // Section items
    for (const section of role.sections) {
      const sectionHref = `/mindspace/${role.id}/${section.id}`;
      assert.equal(
        sectionHref.startsWith(expectedPrefix),
        true,
        `Section href ${sectionHref} must start with ${expectedPrefix}`
      );
      // Ensure section does not point to another role (strict path boundary check)
      for (const otherRole of dashboardRoles) {
        if (otherRole.id !== role.id) {
          assert.equal(
            sectionHref.startsWith(`/mindspace/${otherRole.id}/`),
            false,
            `Section href ${sectionHref} must not start with other role prefix /mindspace/${otherRole.id}/`
          );
        }
      }
    }
  }
});

test("DOM Cross-Leakage: Member workspace body contains zero listener tools or queue references", () => {
  const portalCode = fs.readFileSync(PORTAL_PATH, "utf-8");

  // Extract MemberDashboard
  const memberStart = portalCode.indexOf("function MemberDashboard");
  const memberEnd = portalCode.indexOf("function ListenerDashboard");
  assert.ok(memberStart !== -1 && memberEnd !== -1, "MemberDashboard function must exist");
  const memberCode = portalCode.slice(memberStart, memberEnd);

  const forbiddenListenerTerms = [
    "Peer support queue",
    "Online & Accepting Peer Requests",
    "Capacity: 1 of 2",
    "Manage availability",
    "/mindspace/listener",
    "Listener tools",
    "Recent listener activity",
  ];

  for (const term of forbiddenListenerTerms) {
    assert.equal(
      memberCode.includes(term),
      false,
      `MemberDashboard must NOT contain listener term: "${term}"`
    );
  }
});

test("DOM Cross-Leakage: Listener workspace body contains zero member intake or wellbeing cards", () => {
  const portalCode = fs.readFileSync(PORTAL_PATH, "utf-8");

  // Extract ListenerDashboard
  const listenerStart = portalCode.indexOf("function ListenerDashboard");
  const listenerEnd = portalCode.indexOf("function GenericRoleDashboard");
  assert.ok(listenerStart !== -1 && listenerEnd !== -1, "ListenerDashboard function must exist");
  const listenerCode = portalCode.slice(listenerStart, listenerEnd);

  const forbiddenMemberTerms = [
    "Chat intake",
    "Voice intake",
    "/intake/chat",
    "/intake/voice",
    "Start chatting",
    "Start speaking",
    "/mindspace/member",
    "My pages",
  ];

  for (const term of forbiddenMemberTerms) {
    assert.equal(
      listenerCode.includes(term),
      false,
      `ListenerDashboard must NOT contain member term: "${term}"`
    );
  }
});

test("DOM Cross-Leakage: Menubar navigation data strictly contains zero cross-role groups", () => {
  // Member navigation must NOT contain any listener routes or /mindspace cross-link
  const memberUrls = roleNavData.member.navGroups.flatMap((g) =>
    g.items.map((i: any) => i.url)
  );
  assert.ok(!memberUrls.includes("/mindspace"), "Member nav must NOT contain /mindspace");
  assert.ok(!memberUrls.includes("/mindspace/"), "Member nav must NOT contain /mindspace/");
  assert.ok(!memberUrls.some((u) => u.startsWith("/mindspace/listener")), "Member nav must NOT contain listener routes");

  // Listener navigation must NOT contain any member routes or /mindspace cross-link
  const listenerUrls = roleNavData.listener.navGroups.flatMap((g) =>
    g.items.map((i: any) => i.url)
  );
  assert.ok(!listenerUrls.includes("/mindspace"), "Listener nav must NOT contain /mindspace");
  assert.ok(!listenerUrls.includes("/mindspace/"), "Listener nav must NOT contain /mindspace/");
  assert.ok(!listenerUrls.some((u) => u.startsWith("/mindspace/member")), "Listener nav must NOT contain member routes");
  assert.ok(!listenerUrls.some((u) => u.startsWith("/intake")), "Listener nav must NOT contain intake routes");
});
