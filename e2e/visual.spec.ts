import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.documentElement.dataset.visualTest = "1";
  });
});

test("launcher, teaser, and empty widget", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByTestId("chat-launcher")).toBeVisible();
  await expect(page.getByTestId("launcher-nudge").nth(0)).toHaveText("Search listings");
  await expect(page.getByTestId("launcher-nudge").nth(1)).toHaveText("Book a showing");
  await expect(page.getByTestId("launcher-teaser")).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: "docs/screenshots/visual/launcher-closed.png" });
  await page.getByTestId("chat-launcher").click();
  const widget = page.getByTestId("chat-widget");
  await expect(widget.getByTestId("chat-header")).toBeVisible();
  await expect(widget.getByRole("button", { name: "Highlands, 3 beds, under $650k" })).toBeVisible();
  await expect(widget.getByTestId("composer-input")).toBeVisible();
  await expect(widget.getByTestId("mode-pill")).toHaveText("Demo mode");
  await page.screenshot({ path: "docs/screenshots/visual/widget-open-empty.png" });
});

test("rich card, stream, and dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/chat");
  const send = page.getByTestId("composer-send");
  await page.getByTestId("composer-input").fill("I'm looking for a 3 bed under 650k in Highlands");
  await send.click();
  await expect(page.getByTestId("phase-indicator")).toBeVisible();
  await expect(page.getByTestId("card-carousel")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/visual/rich-card.png" });
  await page.locator("html").evaluate((node) => node.classList.add("dark"));
  await page.screenshot({ path: "docs/screenshots/visual/widget-dark.png" });
});

test("mobile widget is fullscreen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByTestId("chat-launcher").click();
  const widget = page.getByTestId("chat-widget");
  await expect(widget).toBeVisible();
  const box = await widget.boundingBox();
  expect(box?.width).toBeGreaterThan(360);
  await expect(widget.getByRole("button", { name: "Close chat" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/visual/widget-mobile.png" });
});

test("lead card and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/chat");
  await expect(page.getByTestId("launcher-nudge").first()).toBeVisible();
  await page.getByRole("button", { name: "Leave contact details for the team" }).click();
  await expect(page.getByTestId("card-lead")).toBeVisible();
});

test("axe smoke on landing and embed", async ({ page }) => {
  for (const path of ["/", "/embed-demo"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    const serious = results.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    expect(serious.map((item) => `${item.id}: ${item.nodes.map((node) => node.target).join(" | ")}`)).toEqual([]);
  }
});
