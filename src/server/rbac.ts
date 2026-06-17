import { Role } from "@prisma/client";

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  SURVEYOR: 2,
  REVIEWER: 3,
  ADMIN: 4
};

export function hasRole(userRole: Role, allowed: Role[]) {
  return allowed.some((role) => roleRank[userRole] >= roleRank[role]);
}

export const canSurvey = [Role.SURVEYOR, Role.REVIEWER, Role.ADMIN];
export const canReview = [Role.REVIEWER, Role.ADMIN];
export const canAdmin = [Role.ADMIN];
