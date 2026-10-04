import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/auth/server";

function redirectTo(url: URL, path: string) {
  return NextResponse.redirect(new URL(path, url.origin), { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error")) return redirectTo(url, "/auth/sign-in?error=google");
  if (code) {
    const client = await createAuthClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return redirectTo(url, "/practice");
    return redirectTo(url, "/auth/sign-in?error=callback");
  }
  return redirectTo(url, "/auth/sign-in");
}
