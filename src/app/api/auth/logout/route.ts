import { cookies } from "next/headers";
import { revokeRequestSession } from "@/server/auth";
import { SESSION_COOKIE } from "@/server/session";

export async function POST(request: Request) {
  await revokeRequestSession(request);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
