import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

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

const readErrorMessage = async (response: APIResponse) => {
  try {
    const body = await response.json();
    return typeof body?.error?.message === "string" ? body.error.message : "";
  } catch {
    return "";
  }
};

const ensureUserCanLogin = async (request: APIRequestContext, credentials: { email: string; password: string }) => {
  const signInResponse = await request.post("/api/v1/auth/sign-in", { data: credentials });
  if (signInResponse.ok()) {
    return;
  }

  const signUpResponse = await request.post("/api/v1/auth/sign-up", { data: credentials });
  if (!signUpResponse.ok()) {
    const message = await readErrorMessage(signUpResponse);
    throw new Error(
      `Failed to create E2E user (status: ${signUpResponse.status()}). ${message || "Check auth configuration."}`
    );
  }

  const retrySignInResponse = await request.post("/api/v1/auth/sign-in", { data: credentials });
  if (!retrySignInResponse.ok()) {
    const message = await readErrorMessage(retrySignInResponse);
    throw new Error(
      `Failed to sign in E2E user after sign up (status: ${retrySignInResponse.status()}). ${
        message || "Check auth configuration."
      }`
    );
  }
};

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
