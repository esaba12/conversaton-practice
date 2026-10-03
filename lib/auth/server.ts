import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicAuthConfig } from "./config";
import { AppError } from "@/lib/schemas/errors";

export async function createAuthClient() {
  const { url, key } = publicAuthConfig();
  const jar = await cookies();
  return createServerClient(url, key, { cookies: {
    getAll: () => jar.getAll(),
    setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server Component: proxy handles refresh. */ } },
  } });
}
export async function requireIdentity() {
  const client = await createAuthClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || user.is_anonymous) throw new AppError("UNAUTHENTICATED", "Sign in to continue.", 401);
  return { client, identity: { id: user.id, isAnonymous: false as const } };
}
