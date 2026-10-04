import { test, expect } from "@playwright/test";
test("public entry leads to required sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find your words. Then take them with you." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What stays in your hands" })).toBeVisible();
  await expect(page.getByText("Illustration only. A real practice uses a live video call after you sign in.")).toBeVisible();
  await page.getByRole("link", { name: "Start with a conversation" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});
test("a failed Google return explains what to do next", async ({ page }) => {
  await page.goto("/auth/sign-in?error=google");
  await expect(page.getByRole("alert").filter({ hasText: "Google sign-in didn’t finish" })).toHaveText("Google sign-in didn’t finish. You can try again or use email.");
});
test("workspace does not expose practice without identity", async ({ page }) => {
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("button", { name: "Start practice" })).toHaveCount(0);
});
