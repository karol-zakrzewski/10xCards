import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Witaj w 10xDevs Astro Starter!" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }
}
