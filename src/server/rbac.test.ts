import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { canAdmin, canReview, canSurvey, hasRole } from "./rbac";

describe("rbac", () => {
  it("allows higher roles to perform lower-role actions", () => {
    expect(hasRole(Role.ADMIN, canSurvey)).toBe(true);
    expect(hasRole(Role.REVIEWER, canSurvey)).toBe(true);
    expect(hasRole(Role.SURVEYOR, canReview)).toBe(false);
    expect(hasRole(Role.VIEWER, canAdmin)).toBe(false);
  });
});
