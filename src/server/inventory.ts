import { prisma } from "@/server/db";

export async function getInventorySnapshot() {
  const [racks, devicesWithoutRack, cables, printers, auditLogs] = await Promise.all([
    prisma.rack.findMany({
      orderBy: [{ room: "asc" }, { code: "asc" }],
      include: {
        devices: {
          orderBy: [{ uPosition: "desc" }, { name: "asc" }],
          include: {
            ports: {
              orderBy: [{ module: "asc" }, { portNumber: "asc" }, { name: "asc" }]
            }
          }
        }
      }
    }),
    prisma.device.findMany({
      where: { rackId: null },
      orderBy: { name: "asc" },
      include: {
        ports: {
          orderBy: [{ module: "asc" }, { portNumber: "asc" }, { name: "asc" }]
        }
      }
    }),
    prisma.cable.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        endpointAPort: { include: { device: { include: { rack: true } } } },
        endpointBPort: { include: { device: { include: { rack: true } } } },
        photos: { orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.labelPrinter.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, protocol: true, endpoint: true, enabled: true, notes: true }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { actor: { select: { name: true, email: true } } }
    })
  ]);

  return {
    racks,
    devicesWithoutRack,
    cables,
    printers,
    auditLogs
  };
}
