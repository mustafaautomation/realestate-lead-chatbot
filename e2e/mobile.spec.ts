import { expect, test } from "@playwright/test";

test("mobile landing keeps the chat usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Qualify the buyer/ })).toBeVisible();
  await expect(page.getByLabel("Summit Ridge chat")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/landing-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "What's your open house policy?" }).click();
  await expect(page.getByText("Saturday 11:00 AM")).toBeVisible();
});
