import { mkdir, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/server/db";
import { authenticateRequest } from "@/server/auth";
import { canSurvey } from "@/server/rbac";
import { getClientIp, jsonError } from "@/server/request";
import { writeAudit } from "@/server/audit";
import { getPhotoStorageDir } from "@/server/photos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request, { roles: canSurvey, csrf: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const form = await request.formData();
  const file = form.get("file");
  const cableId = form.get("cableId")?.toString() || null;
  const portId = form.get("portId")?.toString() || null;
  if (!(file instanceof File)) return jsonError("Photo file is required", 400);
  if (!cableId && !portId) return jsonError("Photo must be bound to a cable or port", 400);
  if (!file.type.startsWith("image/")) return jsonError("Only image files are supported", 400);
  if (file.size > 8 * 1024 * 1024) return jsonError("Photo exceeds 8 MB", 413);

  const storageDir = getPhotoStorageDir();
  await mkdir(storageDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const extension = file.type === "image/png" ? ".png" : ".jpg";
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(storageDir, filename), bytes);

  const photo = await prisma.photo.create({
    data: {
      cableId,
      portId,
      filename,
      originalName: file.name || filename,
      mimeType: file.type,
      size: file.size,
      sha256,
      uploadedById: auth.session.user.id
    }
  });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "upload_photo",
    entityType: cableId ? "cable" : "port",
    entityId: cableId || portId || photo.id,
    newValue: photo,
    ip: getClientIp(request)
  });

  return Response.json(photo, { status: 201 });
}
