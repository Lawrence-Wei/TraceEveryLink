import { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { canReview, canSurvey } from "@/server/rbac";
import { getClientIp, jsonError } from "@/server/request";
import { cablePatchSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, { roles: canSurvey, csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;

  const parsed = cablePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid cable update", 400);

  const oldCable = await prisma.cable.findUnique({ where: { id } });
  if (!oldCable) return jsonError("Cable not found", 404);

  if (parsed.data.status === "confirmed" && !isReviewer(auth.session.user.role)) {
    return jsonError("Reviewer role is required to confirm a cable", 403);
  }

  const cable = await prisma.cable.update({
    where: { id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      verifiedById:
        parsed.data.status === "confirmed" ? auth.session.user.id : oldCable.verifiedById,
      verifiedAt: parsed.data.status === "confirmed" ? new Date() : oldCable.verifiedAt
    }
  });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "update",
    entityType: "cable",
    entityId: cable.id,
    oldValue: oldCable,
    newValue: cable,
    ip: getClientIp(request)
  });

  return Response.json(cable);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, { roles: [Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;
  const oldCable = await prisma.cable.findUnique({ where: { id } });
  if (!oldCable) return jsonError("Cable not found", 404);

  await prisma.cable.delete({ where: { id } });
  await writeAudit({
    actorId: auth.session.user.id,
    action: "delete",
    entityType: "cable",
    entityId: id,
    oldValue: oldCable,
    ip: getClientIp(request)
  });
  return Response.json({ ok: true });
}

function isReviewer(role: Role) {
  return role === Role.REVIEWER || role === Role.ADMIN;
}
