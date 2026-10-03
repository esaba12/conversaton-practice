import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const client = await createAuthClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/practice", url.origin), { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.redirect(new URL("/auth/sign-in", url.origin), { headers: { "Cache-Control": "private, no-store" } });
}
