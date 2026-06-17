import { Role } from "@prisma/client";
import { authenticateRequest } from "@/server/auth";
import { buildLabelsPdf } from "@/server/exports";
import { jsonError } from "@/server/request";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request, { roles: [Role.REVIEWER, Role.ADMIN] });
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean);
  const buffer = await buildLabelsPdf(ids);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=traceeverylink-labels.pdf"
    }
  });
}
