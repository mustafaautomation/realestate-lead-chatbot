import { expect, test } from "@playwright/test";

test("mobile landing keeps the chat usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Qualify the buyer/ })).toBeVisible();
  await expect(page.getByLabel("Summit Ridge chat")).toBeVisible();
  await expect(page.getByTestId("trust-panel")).toBeVisible();
  await expect(page.getByTestId("metrics-strip")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/landing-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "What are your buyer fees?" }).click();
  await expect(page.getByText("5.5 percent")).toBeVisible();
  await expect(page.getByTestId("follow-up-chips")).toBeVisible();
});
