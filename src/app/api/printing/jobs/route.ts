import { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { createAndSendPrintJob } from "@/server/printing";
import { getClientIp, jsonError } from "@/server/request";
import { printJobSchema } from "@/server/validation";
import { writeAudit } from "@/server/audit";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.REVIEWER, Role.ADMIN] });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const jobs = await prisma.printJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { printer: true, items: { include: { cable: true } } }
  });
  return Response.json(jobs);
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.REVIEWER, Role.ADMIN], csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const parsed = printJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid print job payload", 400);

  const job = await createAndSendPrintJob({
    ...parsed.data,
    requestedBy: auth.session.user.id
  });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "print_labels",
    entityType: "print_job",
    entityId: job.id,
    newValue: {
      printerId: parsed.data.printerId,
      cableIds: parsed.data.cableIds,
      copies: parsed.data.copies,
      status: job.status
    },
    ip: getClientIp(request)
  });

  return Response.json(job, { status: 201 });
}
