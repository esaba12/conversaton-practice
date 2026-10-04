import Link from "next/link";
import { createAuthClient } from "@/lib/auth/server";
import { loadDashboard } from "@/lib/data/dashboard";
import { Dashboard } from "./dashboard/dashboard";
import { SignOutButton } from "./sign-out-button";
import { Wordmark } from "./wordmark";

export async function SignedInHome() {
  const data = await loadDashboard(await createAuthClient());
  return (
    <>
      <header className="site-header app-header">
        <Wordmark />
        <nav className="app-nav" aria-label="Main">
          <Link href="/" aria-current="page">Home</Link>
          <Link href="/practice">Practice</Link>
          <Link href="/practice/about-me">About me</Link>
          <Link href="/practice/data">Your data</Link>
        </nav>
        <SignOutButton />
      </header>
      <Dashboard data={data} />
    </>
  );
}
