import { authenticateRequest } from "@/server/auth";
import { cableQrBuffer } from "@/server/labels";
import { jsonError } from "@/server/request";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;
  const buffer = await cableQrBuffer(id, 260);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=300"
    }
  });
}
