import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth/config";
import { requireIdentity } from "@/lib/auth/server";
import { AppError } from "@/lib/schemas/errors";
import { roommate } from "@/fixtures/roommate";
export const dynamic = "force-dynamic";
export default async function PracticePage() {
  if (!authConfigured()) redirect("/auth/sign-in");
  try { await requireIdentity(); } catch (error) { if (error instanceof AppError && error.code === "UNAUTHENTICATED") redirect("/auth/sign-in"); throw error; }
  return <><header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link></header><main id="main" className="workspace"><span className="eyebrow">A fresh start</span><h1>A little practice,<br />on your terms.</h1><p>First conversation: making a clear request about shared chores.</p><section className="setup-card"><span className="badge">Foundation preview · calls not enabled</span><h2>Meet {roommate.name}, your fictional roommate</h2><p>{roommate.publicContext}</p><p>{roommate.style}</p><p>Live video is being verified. This preview does not start a call.</p></section></main></>;
}
