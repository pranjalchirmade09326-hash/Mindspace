import { describe, it, expect } from "vitest";
import {
  workspaceForRoles,
  normalizeRoleCode,
  parseRoles,
  mindspaceRoleWorkspaces,
} from "@/modules/client/mindspace-dashboard/role-map";

describe("Milestone 5: Role Workspace Navigation & Normalization", () => {
  describe("Role Normalization (normalizeRoleCode)", () => {
    it("normalizes member and patient to member", () => {
      expect(normalizeRoleCode("member")).toBe("member");
      expect(normalizeRoleCode("patient")).toBe("member");
    });

    it("normalizes listener and doctor to listener", () => {
      expect(normalizeRoleCode("listener")).toBe("listener");
      expect(normalizeRoleCode("doctor")).toBe("listener");
    });

    it("normalizes supervisor hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("listener-supervisor")).toBe("listener_supervisor");
      expect(normalizeRoleCode("listener_supervisor")).toBe("listener_supervisor");
      expect(normalizeRoleCode("supervisor")).toBe("listener_supervisor");
    });

    it("normalizes safety operations hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("safety-operations")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety_operations")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety_operations_specialist")).toBe("safety_operations_specialist");
      expect(normalizeRoleCode("safety")).toBe("safety_operations_specialist");
    });

    it("normalizes platform admin hyphenated, underscored and short forms", () => {
      expect(normalizeRoleCode("platform-administrator")).toBe("platform_administrator");
      expect(normalizeRoleCode("platform_administrator")).toBe("platform_administrator");
      expect(normalizeRoleCode("admin")).toBe("platform_administrator");
    });

    it("returns null for invalid or null role inputs", () => {
      expect(normalizeRoleCode(null)).toBeNull();
      expect(normalizeRoleCode(undefined)).toBeNull();
      expect(normalizeRoleCode("")).toBeNull();
      expect(normalizeRoleCode("unknown_role_xyz")).toBeNull();
    });
  });

  describe("Role Parsing (parseRoles)", () => {
    it("parses comma-separated role strings into normalized role codes", () => {
      const parsed = parseRoles("member, listener-supervisor, admin");
      expect(parsed).toEqual([
        "member",
        "listener_supervisor",
        "platform_administrator",
      ]);
    });

    it("handles empty or null values gracefully", () => {
      expect(parseRoles(null)).toEqual([]);
      expect(parseRoles("")).toEqual([]);
    });
  });

  describe("Workspace Routing (workspaceForRoles)", () => {
    it("routes member to member workspace", () => {
      expect(workspaceForRoles("member")).toBe("/mindspace/member");
      expect(workspaceForRoles("member", "en")).toBe("/en/mindspace/member");
      expect(workspaceForRoles("member", "hi")).toBe("/hi/mindspace/member");
      expect(workspaceForRoles("member", "ta")).toBe("/ta/mindspace/member");
    });

    it("routes listener to listener workspace", () => {
      expect(workspaceForRoles("listener")).toBe("/mindspace/listener");
      expect(workspaceForRoles("listener", "en")).toBe("/en/mindspace/listener");
      expect(workspaceForRoles("listener", "hi")).toBe("/hi/mindspace/listener");
    });

    it("routes listener_supervisor and listener-supervisor to supervisor workspace", () => {
      expect(workspaceForRoles("listener_supervisor")).toBe("/mindspace/supervisor");
      expect(workspaceForRoles("listener-supervisor")).toBe("/mindspace/supervisor");
      expect(workspaceForRoles("supervisor")).toBe("/mindspace/supervisor");
      expect(workspaceForRoles("listener_supervisor", "en")).toBe("/en/mindspace/supervisor");
      expect(workspaceForRoles("listener-supervisor", "en")).toBe("/en/mindspace/supervisor");
    });

    it("routes safety_operations_specialist and safety-operations to safety workspace", () => {
      expect(workspaceForRoles("safety_operations_specialist")).toBe("/mindspace/safety");
      expect(workspaceForRoles("safety-operations")).toBe("/mindspace/safety");
      expect(workspaceForRoles("safety")).toBe("/mindspace/safety");
      expect(workspaceForRoles("safety_operations_specialist", "en")).toBe("/en/mindspace/safety");
      expect(workspaceForRoles("safety-operations", "en")).toBe("/en/mindspace/safety");
    });

    it("routes platform_administrator and platform-administrator to admin workspace", () => {
      expect(workspaceForRoles("platform_administrator")).toBe("/mindspace/admin");
      expect(workspaceForRoles("platform-administrator")).toBe("/mindspace/admin");
      expect(workspaceForRoles("admin")).toBe("/mindspace/admin");
      expect(workspaceForRoles("platform_administrator", "en")).toBe("/en/mindspace/admin");
      expect(workspaceForRoles("platform-administrator", "en")).toBe("/en/mindspace/admin");
    });

    it("prioritizes highest privilege role when multiple roles are passed", () => {
      expect(workspaceForRoles("member, platform-administrator")).toBe("/mindspace/admin");
      expect(workspaceForRoles("member, listener-supervisor")).toBe("/mindspace/supervisor");
      expect(workspaceForRoles("listener, safety-operations")).toBe("/mindspace/safety");
    });

    it("defaults to member workspace when role is undefined or empty", () => {
      expect(workspaceForRoles(null)).toBe("/mindspace/member");
      expect(workspaceForRoles(undefined)).toBe("/mindspace/member");
      expect(workspaceForRoles("")).toBe("/mindspace/member");
      expect(workspaceForRoles(null, "en")).toBe("/en/mindspace/member");
    });
  });
});
