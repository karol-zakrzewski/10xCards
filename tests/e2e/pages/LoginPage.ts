import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Logowanie" });
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Hasło");
    this.submitButton = page.getByRole("button", { name: /Zaloguj/ });
  }

  private async waitForHydration(): Promise<void> {
    await this.page.waitForFunction(() => {
      const islands = Array.from(document.querySelectorAll("astro-island"));
      if (islands.length === 0) {
        return true;
      }
      return islands.every((island) => island.hasAttribute("hydrated") || !island.hasAttribute("ssr"));
    });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await this.waitForHydration();
  }

  async login(email: string, password: string): Promise<void> {
    await this.waitForHydration();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await Promise.all([this.page.waitForURL("**/generate"), this.submitButton.click()]);
  }
}
