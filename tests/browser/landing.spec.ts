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

test("reduced motion shows a still Meet card, hero call, and stats", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const card = page.getByRole("complementary", { name: "Illustration of a practice call" });
  await expect(card).toHaveAttribute("data-still", "true");
  await expect(card.locator("[data-speaking='true']")).toHaveCount(0);
  await card.getByRole("tab", { name: "After" }).click();
  await expect(card.getByText("A short reflection, if you want one")).toBeVisible();

  const hero = page.getByRole("img", { name: /live practice video call/ });
  await expect(hero.locator("[data-speaking='true'], [data-active='true']")).toHaveCount(0);
  const stats = page.getByRole("region", { name: /Hard conversations get put off/ });
  await stats.scrollIntoViewIfNeeded();
  await expect(stats.getByText("55.7%", { exact: true }).first()).toBeAttached();
  const marquee = page.getByRole("region", { name: "Everyday conversations you could rehearse" });
  const animation = await marquee.locator("ul").evaluate((node) => getComputedStyle(node).animationName);
  expect(animation).toBe("none");
});

test("landing cites every research number and has no horizontal overflow", async ({ page }) => {
  for (const width of [390, 900, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
  const stats = page.getByRole("region", { name: /Hard conversations get put off/ });
  await expect(stats.getByRole("link", { name: "Cost of the Conversation Gap" })).toHaveAttribute("href", "https://learn.workbravely.com/cost-of-the-conversation-gap");
  await expect(stats.getByRole("link", { name: "BMC Medical Education" })).toHaveAttribute("href", "https://link.springer.com/article/10.1186/s12909-025-07996-w");
  await expect(page.getByText("A practice tool with fictional AI characters. It doesn’t predict how anyone will respond.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to practice" })).toHaveAttribute("href", "/auth/sign-in");
});
