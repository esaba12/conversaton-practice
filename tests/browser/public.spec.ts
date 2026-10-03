import { test, expect } from "@playwright/test";
test("public entry leads to required sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find your words. Then take them with you." })).toBeVisible();
  await page.getByRole("link", { name: "Start with a conversation" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByLabel("Email")).toBeVisible();
});
test("workspace does not expose practice without identity", async ({ page }) => {
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("button", { name: "Start practice" })).toHaveCount(0);
});
