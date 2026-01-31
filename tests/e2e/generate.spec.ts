import { expect, test } from "@playwright/test";

import { GeneratePage } from "./pages/GeneratePage";
import { LoginPage } from "./pages/LoginPage";
import { ensureUserCanLogin, getCredentials } from "./utils/auth";

test("generate.happyPath.savesAcceptedAndShowsInFlashcards", async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const { email, password } = getCredentials();
    await ensureUserCanLogin(request, { email, password });

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, password);

    const generate = new GeneratePage(page);
    await generate.waitForHydration();

    const sourceText = "a".repeat(1000);
    const now = new Date().toISOString();
    const generationId = 1111;
    const proposalA = {
      id: "proposal-1",
      front: "Co to jest React?",
      back: "Biblioteka JavaScript do budowania UI.",
      source: "ai-full",
    } as const;
    const proposalB = {
      id: "proposal-2",
      front: "Czym jest Astro?",
      back: "Framework do budowania szybkich stron, wspierający wyspy interaktywności.",
      source: "ai-full",
    } as const;

    await page.route("**/api/v1/generations", async (route) => {
      const payload = route.request().postDataJSON() as { sourceText?: string };
      expect(payload?.sourceText).toBe(sourceText);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          generation: {
            id: generationId,
            generatedCount: 2,
            generationDurationMs: 420,
            createdAt: now,
          },
          proposals: [proposalA, proposalB],
        }),
      });
    });

    await page.route(/\/api\/v1\/flashcards(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "flashcard-1",
              front: proposalA.front,
              back: proposalA.back,
              source: "ai-full",
              generationId,
              createdAt: now,
              updatedAt: now,
            },
          ],
          page: {
            page: 1,
            limit: 20,
            total: 1,
          },
        }),
      });
    });

    await page.route("**/api/v1/flashcards/bulkCreate", async (route) => {
      const payload = route.request().postDataJSON() as {
        generationId: number;
        items: { front: string; back: string; source: string }[];
      };

      expect(payload).toEqual({
        generationId,
        items: [
          {
            front: proposalA.front,
            back: proposalA.back,
            source: "ai-full",
          },
        ],
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            created: [
              {
                id: "flashcard-1",
                front: proposalA.front,
                back: proposalA.back,
                source: "ai-full",
                generationId,
                createdAt: now,
                updatedAt: now,
              },
            ],
            generation: {
              id: generationId,
              acceptedUneditedCount: 1,
              acceptedEditedCount: 0,
              updatedAt: now,
            },
          },
        }),
      });
    });

    await generate.sourceText.fill(sourceText);
    await generate.generateButton.click();

    await expect(generate.proposalsHeading).toBeVisible();
    await expect(generate.acceptButtons).toHaveCount(2);

    await generate.acceptButtons.first().click();
    await expect(generate.savedCountBadge).toContainText("Do zapisu: 1");

    await generate.saveAcceptedButton.click();

    await page.getByRole("link", { name: "Moje fiszki" }).click();
    await expect(page).toHaveURL(/\/flashcards/);
    await expect(page.getByText(proposalA.front)).toBeVisible();
    await expect(page.getByText(proposalA.back)).toBeVisible();
  } finally {
    await context.close();
  }
});
