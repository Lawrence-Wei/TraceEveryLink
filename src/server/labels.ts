import QRCode from "qrcode";
import { prisma } from "@/server/db";

export function appUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function cableUrl(cableId: string) {
  return `${appUrl()}/?cable=${encodeURIComponent(cableId)}`;
}

export async function cableQrBuffer(cableId: string, width = 220) {
  return QRCode.toBuffer(cableUrl(cableId), {
    type: "png",
    margin: 1,
    width
  });
}

export async function getCableLabelData(cableDbId: string) {
  const cable = await prisma.cable.findUnique({
    where: { id: cableDbId },
    include: {
      endpointAPort: { include: { device: { include: { rack: true } } } },
      endpointBPort: { include: { device: { include: { rack: true } } } }
    }
  });
  if (!cable) return null;

  return {
    id: cable.id,
    cableId: cable.cableId,
    label: cable.label,
    status: cable.status,
    endpointA: formatEndpoint(cable.endpointAPort),
    endpointB: formatEndpoint(cable.endpointBPort),
    qrUrl: cableUrl(cable.id)
  };
}

export function formatEndpoint(port: {
  name: string;
  device: { name: string; rack?: { code: string; room: string } | null };
}) {
  const rack = port.device.rack ? `${port.device.rack.room}/${port.device.rack.code}` : "FIELD";
  return `${rack} ${port.device.name} ${port.name}`;
}
