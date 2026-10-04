import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, publicAuthConfig } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  if (!authConfigured()) return NextResponse.next();
  const { url, key } = publicAuthConfig();
  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/", "/practice/:path*", "/auth/:path*", "/api/:path*"] };
