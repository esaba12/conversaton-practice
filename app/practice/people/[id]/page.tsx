import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { authConfigured } from "@/lib/auth/config";
import { requireIdentity } from "@/lib/auth/server";
import { AppError } from "@/lib/schemas/errors";
import { PersonWorkspace } from "./person-workspace";
export const dynamic = "force-dynamic";
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!authConfigured()) redirect("/auth/sign-in");
  try { await requireIdentity(); } catch (error) { if (error instanceof AppError && error.code === "UNAUTHENTICATED") redirect("/auth/sign-in"); throw error; }
  const { id } = await params;
  if (id !== "new" && !z.uuid().safeParse(id).success) notFound();
  return <PersonWorkspace key={id} personId={id === "new" ? null : id} />;
}
