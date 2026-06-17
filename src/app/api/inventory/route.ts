import { getInventorySnapshot } from "@/server/inventory";
import { authenticateRequest } from "@/server/auth";
import { jsonError } from "@/server/request";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  return Response.json(await getInventorySnapshot());
}
