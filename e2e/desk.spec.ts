import { expect, test } from "@playwright/test";

test.use({ video: "on" });

test("demo recording", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Highlands, 3 beds, under $650k" }).click();
  await expect(page.getByRole("region", { name: "Summit Ridge chat" }).getByText("SR-2403")).toBeVisible();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /pre-approved/i }).click();
  await expect(page.getByText(/hot/i).first()).toBeVisible();
  await page.waitForTimeout(400);
  await page.getByTestId("quick-reply").filter({ hasText: /^Book / }).click();
  await expect(page.getByText(/You're booked|already taken/)).toBeVisible();
  await page.waitForTimeout(500);
});

test("widget opens on the sample host page", async ({ page }) => {
  await page.goto("/embed-demo");
  const launcher = page.getByRole("button", { name: "Open chat with Summit Ridge desk" });
  await expect(launcher).toBeVisible();
  await expect(page.getByTestId("launcher-teaser")).toBeVisible();
  await launcher.click();
  await expect(page.locator("#summit-ridge-widget")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#summit-ridge-widget")).toBeHidden();
});

test("a knowledge question shows a citation", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "What are your buyer fees?" }).click();
  await expect(page.getByText("5.5 percent")).toBeVisible();
  const chip = page.getByTestId("citation-chip").filter({ hasText: "Commission and fee FAQ" });
  await expect(chip).toBeVisible();
  await chip.focus();
  await expect(page.getByTestId("citation-preview")).toBeVisible();
  await expect(page.getByTestId("message-actions").getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByTestId("mode-pill")).toHaveText("Demo mode");
  await page.screenshot({ path: "docs/screenshots/chat-citation.png", fullPage: true });
});

test("main flow books a showing", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/landing.png", fullPage: false });
  await page.getByRole("button", { name: "Highlands, 3 beds, under $650k" }).click();
  await expect(page.getByTestId("card-carousel")).toBeVisible();
  await expect(page.getByRole("region", { name: "Summit Ridge chat" }).getByText("SR-2403")).toBeVisible();
  await page.getByRole("button", { name: /pre-approved/i }).click();
  await expect(page.getByText(/hot/i).first()).toBeVisible();
  await expect(page.getByTestId("slot-chips")).toBeVisible();
  await page.getByTestId("quick-reply").filter({ hasText: /^Book / }).click();
  await expect(page.getByTestId("card-confirm")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/showing.png", fullPage: false });
});

test("talk to a person opens a handoff the desk can resume", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Talk to a person" }).click();
  await expect(page.getByText(/Ticket HO-/)).toBeVisible();
  await expect(page.getByTestId("handoff-banner")).toContainText(/Connecting|Maya Ellison/);
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Handoffs" }).click();
  await expect(page.getByText("request").first()).toBeVisible();
  await page.getByRole("button", { name: "Resume bot" }).first().click();
  await expect(page.getByText("Bot resumed")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/admin-handoffs.png", fullPage: true });
});
