import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { jsonError } from "@/server/request";
import { getPhotoStorageDir } from "@/server/photos";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const { id } = await context.params;
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) return jsonError("Photo not found", 404);

  const storageDir = getPhotoStorageDir();
  const bytes = await readFile(path.join(storageDir, photo.filename));
  return new Response(bytes, {
    headers: {
      "content-type": photo.mimeType,
      "cache-control": "private, max-age=300"
    }
  });
}
