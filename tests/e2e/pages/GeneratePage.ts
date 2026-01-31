import type { Locator, Page } from "@playwright/test";

export class GeneratePage {
  readonly page: Page;
  readonly sourceText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceText = page.getByLabel(/Tekst źródłowy/);
  }
}
