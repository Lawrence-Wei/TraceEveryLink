import { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { getClientIp, jsonError } from "@/server/request";
import { printerSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const printers = await prisma.labelPrinter.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      protocol: true,
      endpoint: true,
      enabled: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return Response.json(printers);
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const parsed = printerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid printer payload", 400);

  const printer = await prisma.labelPrinter.create({ data: parsed.data });
  await writeAudit({
    actorId: auth.session.user.id,
    action: "create_printer",
    entityType: "label_printer",
    entityId: printer.id,
    newValue: safePrinterAudit(printer),
    ip: getClientIp(request)
  });
  return Response.json(safePrinterAudit(printer), { status: 201 });
}

function safePrinterAudit<T extends { apiKey?: string | null }>(printer: T) {
  return { ...printer, apiKey: printer.apiKey ? "***" : null };
}
