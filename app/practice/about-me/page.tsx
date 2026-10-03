import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth/config";
import { requireIdentity } from "@/lib/auth/server";
import { AppError } from "@/lib/schemas/errors";
import { AboutMeWorkspace } from "./about-me-workspace";
export const dynamic = "force-dynamic";
export default async function AboutMePage() {
  if (!authConfigured()) redirect("/auth/sign-in");
  try { await requireIdentity(); } catch (error) { if (error instanceof AppError && error.code === "UNAUTHENTICATED") redirect("/auth/sign-in"); throw error; }
  return <AboutMeWorkspace />;
}
