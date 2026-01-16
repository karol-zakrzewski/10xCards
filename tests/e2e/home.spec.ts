import { expect, test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test("home.load.showsHeading", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const home = new HomePage(page);

  await home.goto();
  await expect(home.heading).toBeVisible();

  await context.close();
});
