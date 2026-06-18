import { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { getClientIp, jsonError } from "@/server/request";
import { writeAudit } from "@/server/audit";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, { roles: [Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;

  const oldDevice = await prisma.device.findUnique({
    where: { id },
    include: {
      rack: true,
      ports: {
        orderBy: [{ module: "asc" }, { portNumber: "asc" }, { name: "asc" }]
      }
    }
  });
  if (!oldDevice) return jsonError("Device not found", 404);

  const portIds = oldDevice.ports.map((port) => port.id);
  const connectedCable = portIds.length
    ? await prisma.cable.findFirst({
        where: {
          OR: [
            { endpointAPortId: { in: portIds } },
            { endpointBPortId: { in: portIds } }
          ]
        },
        select: { id: true, cableId: true }
      })
    : null;

  if (connectedCable) {
    return jsonError("Device has connected cables", 409);
  }

  await prisma.$transaction([
    prisma.port.updateMany({
      where: { mappedPortId: { in: portIds } },
      data: { mappedPortId: null }
    }),
    prisma.device.delete({ where: { id } })
  ]);

  await writeAudit({
    actorId: auth.session.user.id,
    action: "delete_device",
    entityType: "device",
    entityId: id,
    oldValue: oldDevice,
    ip: getClientIp(request)
  });

  return Response.json({ ok: true });
}
