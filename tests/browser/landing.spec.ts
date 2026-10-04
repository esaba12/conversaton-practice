import { test, expect, type Request } from "@playwright/test";

test("signed-out Meet card illustration works without any network request", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const card = page.getByRole("complementary", { name: "Illustration of a practice call" });
  await expect(card.getByText("Fictional AI", { exact: true })).toBeVisible();
  const requests: string[] = [];
  const record = (request: Request) => requests.push(`${request.method()} ${new URL(request.url()).pathname}`);
  page.on("request", record);

  await card.getByRole("button", { name: "Can we split the dishes by day?" }).click();
  await expect(card.getByText("Which days were you thinking?", { exact: false })).toBeVisible();
  await card.getByRole("button", { name: "It bugs me when they sit overnight." }).click();
  await expect(card.getByText("Can mornings count?", { exact: false })).toBeVisible();
  await card.getByRole("tab", { name: "Before" }).click();
  await expect(card.getByText("What’s going on with Alex?")).toBeVisible();
  await card.getByRole("tab", { name: "After" }).click();
  await expect(card.getByText("Save Alex only if you choose.", { exact: false })).toBeVisible();
  await card.getByRole("tab", { name: "Call" }).click();
  await page.waitForTimeout(500);

  page.off("request", record);
  expect(requests).toEqual([]);
  const text = (await page.locator("body").innerText()).toLowerCase();
  expect(text).not.toContain("therap");
  await expect(page.getByText("Your notes never reach the character. Calls aren’t saved unless you choose.")).toBeVisible();
});

test("reduced motion shows a still Meet card", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const card = page.getByRole("complementary", { name: "Illustration of a practice call" });
  await expect(card).toHaveAttribute("data-still", "true");
  await expect(card.locator("[data-speaking='true']")).toHaveCount(0);
  await card.getByRole("tab", { name: "After" }).click();
  await expect(card.getByText("A short reflection, if you want one")).toBeVisible();
});
