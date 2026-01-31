import { expect, test } from "@playwright/test";

import { GeneratePage } from "./pages/GeneratePage";
import { LoginPage } from "./pages/LoginPage";

const getCredentials = () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E credentials. Ensure E2E_EMAIL and E2E_PASSWORD are set in .env.test.");
  }

  return { email, password };
};

test("login.happyPath.redirectsToGenerate", async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Arrange
    const login = new LoginPage(page);
    const generate = new GeneratePage(page);
    const { email, password } = getCredentials();

    await login.goto();
    await expect(login.heading).toBeVisible();

    // Act
    await login.login(email, password);

    // Assert
    const res = await request.post("http://localhost:3000/api/v1/auth/sign-in");
    expect(res.ok()).toBeTruthy();
    await page.waitForURL("**/generate");
    await expect(page).toHaveURL(/\/generate$/);
    await expect(generate.sourceText).toBeVisible();
  } finally {
    await context.close();
  }
});
