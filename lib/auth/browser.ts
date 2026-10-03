"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicAuthConfig } from "./config";
export function createBrowserAuthClient() {
  const { url, key } = publicAuthConfig();
  return createBrowserClient(url, key);
}
