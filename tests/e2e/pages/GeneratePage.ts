import type { Locator, Page } from "@playwright/test";

export class GeneratePage {
  readonly page: Page;
  readonly sourceText: Locator;
  readonly generateButton: Locator;
  readonly proposalsHeading: Locator;
  readonly acceptButtons: Locator;
  readonly saveAcceptedButton: Locator;
  readonly savedCountBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceText = page.getByLabel(/Tekst źródłowy/);
    this.generateButton = page.getByRole("button", { name: "Generuj" });
    this.proposalsHeading = page.getByRole("heading", { name: "Propozycje fiszek" });
    this.acceptButtons = page.getByRole("button", { name: "Akceptuj fiszkę" });
    this.saveAcceptedButton = page.getByRole("button", { name: "Zapisz zaakceptowane" });
    this.savedCountBadge = page.getByText(/Do zapisu:/);
  }

  async waitForHydration(): Promise<void> {
    await this.page.waitForFunction(() => {
      const islands = Array.from(document.querySelectorAll("astro-island"));
      if (islands.length === 0) {
        return true;
      }
      return islands.every((island) => island.hasAttribute("hydrated") || !island.hasAttribute("ssr"));
    });
  }

  async goto(): Promise<void> {
    await this.page.goto("/generate");
    await this.waitForHydration();
  }
}
