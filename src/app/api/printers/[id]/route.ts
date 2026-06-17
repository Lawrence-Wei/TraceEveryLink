import { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { getClientIp, jsonError } from "@/server/request";
import { printerPatchSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, { roles: [Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;
  const parsed = printerPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid printer update", 400);

  const oldPrinter = await prisma.labelPrinter.findUnique({ where: { id } });
  if (!oldPrinter) return jsonError("Printer not found", 404);
  const printer = await prisma.labelPrinter.update({
    where: { id },
    data: parsed.data
  });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "update_printer",
    entityType: "label_printer",
    entityId: printer.id,
    oldValue: safePrinterAudit(oldPrinter),
    newValue: safePrinterAudit(printer),
    ip: getClientIp(request)
  });
  return Response.json(safePrinterAudit(printer));
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, { roles: [Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;
  const oldPrinter = await prisma.labelPrinter.findUnique({ where: { id } });
  if (!oldPrinter) return jsonError("Printer not found", 404);

  await prisma.labelPrinter.delete({ where: { id } });
  await writeAudit({
    actorId: auth.session.user.id,
    action: "delete_printer",
    entityType: "label_printer",
    entityId: id,
    oldValue: safePrinterAudit(oldPrinter),
    ip: getClientIp(request)
  });
  return Response.json({ ok: true });
}

function safePrinterAudit<T extends { apiKey?: string | null }>(printer: T) {
  return { ...printer, apiKey: printer.apiKey ? "***" : null };
}
