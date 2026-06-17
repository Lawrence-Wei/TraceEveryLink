import { CableStatus, Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { canSurvey } from "@/server/rbac";
import { getClientIp, jsonError } from "@/server/request";
import { cableCreateSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const cables = await prisma.cable.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } },
      photos: true
    }
  });
  return Response.json(cables);
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request, { roles: canSurvey, csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const parsed = cableCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid cable payload", 400);

  if (parsed.data.endpointAPortId === parsed.data.endpointBPortId) {
    return jsonError("Cable endpoints must be different", 400);
  }

  const [endpointA, endpointB] = await Promise.all([
    prisma.port.findUnique({ where: { id: parsed.data.endpointAPortId } }),
    prisma.port.findUnique({ where: { id: parsed.data.endpointBPortId } })
  ]);
  if (!endpointA || !endpointB) return jsonError("Endpoint port not found", 404);

  const existingActive = await prisma.cable.findFirst({
    where: {
      status: { not: CableStatus.retired },
      OR: [
        { endpointAPortId: { in: [endpointA.id, endpointB.id] } },
        { endpointBPortId: { in: [endpointA.id, endpointB.id] } }
      ]
    }
  });
  if (existingActive) {
    return jsonError("One endpoint already has an active cable", 409);
  }

  const cable = await prisma.cable.create({
    data: {
      ...parsed.data,
      createdById: auth.session.user.id,
      verifiedById: parsed.data.status === "confirmed" && isReviewer(auth.session.user.role) ? auth.session.user.id : null,
      verifiedAt: parsed.data.status === "confirmed" && isReviewer(auth.session.user.role) ? new Date() : null
    }
  });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "create",
    entityType: "cable",
    entityId: cable.id,
    newValue: cable,
    ip: getClientIp(request)
  });

  return Response.json(cable, { status: 201 });
}

function isReviewer(role: Role) {
  return role === Role.REVIEWER || role === Role.ADMIN;
}
