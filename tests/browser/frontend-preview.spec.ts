import { expect, test } from "@playwright/test";

const production = process.env.FRONTEND_PREVIEW_PRODUCTION === "1";

test("preview is unavailable in production", async ({ page }) => {
  test.skip(!production, "Run against the production server to verify the guard.");
  const response = await page.goto("/design-preview");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("UI preview — no live call")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start practice" })).toHaveCount(0);
});

test.describe("development presentation preview", () => {
  test.skip(production, "Synthetic fixture is development-only.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/design-preview");
  });

  test("setup, disabled state, and keyboard start are accessible", async ({ page }) => {
    await expect(page.getByText("UI preview — no live call", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What the character knows" })).toBeVisible();
    const start = page.getByRole("button", { name: "Start practice" });
    await page.getByLabel("Disable start").check();
    await expect(start).toBeDisabled();
    await expect(page.getByRole("status").filter({ hasText: "Practice is unavailable" })).toHaveText("Practice is unavailable in this example state.");
    await page.getByLabel("Disable start").uncheck();
    await page.getByLabel("Long example text").focus();
    await page.keyboard.press("Tab");
    await expect(start).toBeFocused();
    expect(await start.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status", { name: "" }).first()).toHaveText("Connecting");
    await expect(page.getByRole("button", { name: "End practice", exact: true })).toBeEnabled();
  });

  test("missing media, mute, camera and interrupted states stay truthful", async ({ page }) => {
    await page.getByRole("button", { name: "Call view" }).click();
    await page.getByLabel("Call state").selectOption("live");
    await expect(page.locator("[data-phase]")).toHaveText("Video unavailable");
    await expect(page.getByRole("heading", { name: "Counterpart video is unavailable." })).toBeVisible();
    await page.getByRole("button", { name: "Mute microphone", exact: true }).click();
    await expect(page.getByRole("button", { name: "Unmute microphone", exact: true })).toHaveAttribute("data-active", "true");
    await expect(page.getByText("Your microphone is muted. The conversation is not paused.")).toBeVisible();
    await page.getByRole("button", { name: "Turn camera on" }).click();
    await expect(page.getByText("Preview unavailable", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Turn camera off" })).toHaveAttribute("data-active", "true");
    await page.getByLabel("Call state").selectOption("interrupted");
    await expect(page.getByRole("heading", { name: "The connection was interrupted." })).toBeVisible();
    await expect(page.getByRole("button", { name: "End practice", exact: true })).toBeEnabled();
  });

  test("supplied nodes render and End removes media from the presentation", async ({ page }) => {
    await page.getByRole("button", { name: "Call view" }).click();
    await page.getByLabel("Call state").selectOption("live");
    await page.getByLabel("Show synthetic media slot").check();
    await expect(page.getByText("Supplied counterpart media", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Turn camera on" }).click();
    await expect(page.getByText("Synthetic self-view", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await expect(page.getByRole("heading", { name: "A moment to take a breath." })).toBeVisible();
    await expect(page.getByText("Supplied counterpart media", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Synthetic self-view", { exact: true })).toHaveCount(0);
    for (const button of await page.getByRole("group", { name: "Call controls" }).getByRole("button").all()) {
      await expect(button).toBeDisabled();
    }
  });

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    test(`responsive layout and call targets at ${viewport.width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.screenshot({ path: testInfo.outputPath(`setup-${viewport.width}.png`), fullPage: true });
      await page.getByLabel("Long example text").check();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.getByRole("button", { name: "Call view" }).click();
      await expect(page.getByRole("heading", { name: "Getting your conversation ready…" })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`connecting-long-${viewport.width}.png`), fullPage: true });
      await page.getByLabel("Call state").selectOption("interrupted");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const button of await page.getByRole("group", { name: "Call controls" }).getByRole("button").all()) {
        const bounds = await button.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        if (viewport.width < 760) expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
      }
      await page.screenshot({ path: testInfo.outputPath(`call-long-${viewport.width}.png`), fullPage: true });
      await page.getByLabel("Long example text").uncheck();
      await page.getByLabel("Call state").selectOption("live");
      await page.getByLabel("Show synthetic media slot").check();
      await page.screenshot({ path: testInfo.outputPath(`call-${viewport.width}.png`), fullPage: true });
    });
  }
});
