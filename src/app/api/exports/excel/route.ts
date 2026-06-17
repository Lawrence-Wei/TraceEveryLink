import { Role } from "@prisma/client";
import { authenticateRequest } from "@/server/auth";
import { buildCableWorkbook } from "@/server/exports";
import { jsonError } from "@/server/request";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.REVIEWER, Role.ADMIN] });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const buffer = await buildCableWorkbook();
  return new Response(buffer, {
    headers: {
      "content-type": "application/vnd.ms-excel; charset=utf-8",
      "content-disposition": "attachment; filename=traceeverylink-cables.xls"
    }
  });
}
