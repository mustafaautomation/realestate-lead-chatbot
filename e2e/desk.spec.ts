import { expect, test } from "@playwright/test";

test.use({ video: "on" });

test("demo recording", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "I'm looking for a 3 bed under 650k in Highlands" }).click();
  await expect(page.getByRole("region", { name: "Summit Ridge chat" }).getByText("SR-2403")).toBeVisible();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /pre-approved/i }).click();
  await expect(page.getByText(/hot/i).first()).toBeVisible();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Book / }).click();
  await expect(page.getByText(/You're booked|already taken/)).toBeVisible();
  await page.waitForTimeout(800);
});

test("widget opens on the sample host page", async ({ page }) => {
  await page.goto("/embed-demo");
  const launcher = page.getByRole("button", { name: "Ask Summit Ridge" });
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator("#summit-ridge-widget")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#summit-ridge-widget")).toBeHidden();
});

test("a knowledge question shows a citation", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "What does a seller pay in commission?" }).click();
  await expect(page.getByText("5.5 percent")).toBeVisible();
  await expect(page.getByText("Source: Commission and fee FAQ")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/chat-citation.png", fullPage: true });
});

test("main flow books a showing", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/landing.png", fullPage: false });
  await page.getByRole("button", { name: "I'm looking for a 3 bed under 650k in Highlands" }).click();
  await expect(page.getByRole("region", { name: "Summit Ridge chat" }).getByText("SR-2403")).toBeVisible();
  await page.getByRole("button", { name: /pre-approved/i }).click();
  await expect(page.getByText(/hot/i).first()).toBeVisible();
  await page.getByRole("button", { name: /^Book / }).click();
  await expect(page.getByText(/You're booked|already taken/)).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/showing.png", fullPage: false });
});

test("talk to a person opens a handoff the desk can show", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Talk to a person" }).click();
  await expect(page.getByText(/Ticket HO-/)).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Handoffs" }).click();
  await expect(page.getByText("request").first()).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/admin-handoffs.png", fullPage: true });
});
