import { expect, test } from "@playwright/test";

import { GeneratePage } from "./pages/GeneratePage";
import { LoginPage } from "./pages/LoginPage";
import { ensureUserCanLogin, getCredentials } from "./utils/auth";

test("login.happyPath.redirectsToGenerate", async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Arrange
    const login = new LoginPage(page);
    const generate = new GeneratePage(page);
    const { email, password } = getCredentials();

    await ensureUserCanLogin(request, { email, password });

    await login.goto();
    await expect(login.heading).toBeVisible();

    // Act
    await login.login(email, password);

    // Assert
    await expect(page).toHaveURL(/\/generate$/);
    await expect(generate.sourceText).toBeVisible();
  } finally {
    await context.close();
  }
});

test("login.validation.showsErrors", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const login = new LoginPage(page);

    await login.goto();
    await expect(login.heading).toBeVisible();

    await login.submitButton.click();

    await expect(page.getByText("Email jest wymagany.")).toBeVisible();
    await expect(page.getByText("Hasło jest wymagane.")).toBeVisible();

    await login.emailInput.fill("niepoprawny-email");
    await login.passwordInput.fill("123");
    await login.submitButton.click();

    await expect(page.getByText("Podaj poprawny adres e-mail.")).toBeVisible();
    await expect(page.getByText("Hasło musi mieć co najmniej 6 znaków.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});

test("login.error401.showsSubmitError", async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const login = new LoginPage(page);
    const { email, password } = getCredentials();

    await ensureUserCanLogin(request, { email, password });

    await login.goto();
    await expect(login.heading).toBeVisible();

    await login.emailInput.fill(email);
    await login.passwordInput.fill(`${password}__wrong`);
    await login.submitButton.click();

    await expect(page.getByText("Nieprawidłowy e-mail lub hasło.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});
