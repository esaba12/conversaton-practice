import { authConfigured } from "@/lib/auth/config";
import { createAuthClient } from "@/lib/auth/server";
import { PublicLanding } from "@/components/site/public-landing";
import { SignedInHome } from "@/components/site/signed-in-home";

export const dynamic = "force-dynamic";

async function hasSession() {
  if (!authConfigured()) return false;
  try {
    const client = await createAuthClient();
    const { data: { user }, error } = await client.auth.getUser();
    return !error && !!user && !user.is_anonymous;
  } catch {
    return false;
  }
}

export default async function Home() {
  return (await hasSession()) ? <SignedInHome /> : <PublicLanding />;
}
