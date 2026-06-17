import { Role } from "@prisma/client";
import { authenticateRequest } from "@/server/auth";
import { buildCablePdf } from "@/server/exports";
import { jsonError } from "@/server/request";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.REVIEWER, Role.ADMIN] });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const buffer = await buildCablePdf();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=traceeverylink-cables.pdf"
    }
  });
}
