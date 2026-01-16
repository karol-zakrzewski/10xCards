import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { server } from "../mocks/server";
import GenerateFlashcardsView from "@/components/generate/GenerateFlashcardsView";

const buildValidSourceText = () => "a".repeat(1000);

const buildSuccessResponse = () => ({
  generation: {
    id: 101,
    generatedCount: 2,
    generationDurationMs: 120,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  proposals: [
    { id: "proposal-1", front: "Pytanie 1", back: "Odpowiedz 1" },
    { id: "proposal-2", front: "Pytanie 2", back: "Odpowiedz 2" },
  ],
});

describe("GenerateFlashcardsView", () => {
  it("generate.success.sendsRequestAndShowsProposals", async () => {
    const sourceText = buildValidSourceText();
    let receivedBody: unknown = null;

    server.use(
      http.post("/api/v1/generations", async ({ request }) => {
        receivedBody = await request.json();
        await delay(40);
        return HttpResponse.json(buildSuccessResponse(), { status: 201 });
      })
    );

    const user = userEvent.setup();

    render(<GenerateFlashcardsView />);

    const textarea = screen.getByLabelText("Tekst źródłowy");
    fireEvent.change(textarea, { target: { value: sourceText } });

    const generateButton = screen.getByRole("button", { name: "Generuj" });
    await user.click(generateButton);

    expect(await screen.findByText("Generowanie w toku")).toBeVisible();

    expect(await screen.findByText("Propozycje fiszek")).toBeVisible();
    expect(screen.getByText("Pytanie 1")).toBeVisible();
    expect(screen.getByText("Odpowiedz 1")).toBeVisible();
    expect(screen.getByText("Generowanie zakończone")).toBeVisible();

    await waitFor(() => expect(receivedBody).toEqual({ sourceText }));
  });

  it("generate.error.showsBannerAndRetries", async () => {
    const sourceText = buildValidSourceText();
    let attempt = 0;

    server.use(
      http.post("/api/v1/generations", async () => {
        attempt += 1;
        if (attempt === 1) {
          return HttpResponse.json(
            {
              error: {
                code: "PROVIDER_ERROR",
                message: "Ups",
              },
            },
            { status: 500 }
          );
        }
        return HttpResponse.json(buildSuccessResponse(), { status: 201 });
      })
    );

    const user = userEvent.setup();

    render(<GenerateFlashcardsView />);

    const textarea = screen.getByLabelText("Tekst źródłowy");
    fireEvent.change(textarea, { target: { value: sourceText } });

    await user.click(screen.getByRole("button", { name: "Generuj" }));

    expect(await screen.findByText("Nie udało się wygenerować fiszek")).toBeVisible();
    expect(screen.getByText("Błąd dostawcy AI. Spróbuj ponownie później.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText("Propozycje fiszek")).toBeVisible();
    await waitFor(() => expect(attempt).toBe(2));
  });

  it("sourceText.validation.blocksAndAllowsGenerate", () => {
    render(<GenerateFlashcardsView />);

    const textarea = screen.getByLabelText("Tekst źródłowy");
    const generateButton = screen.getByRole("button", { name: "Generuj" });

    expect(generateButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "Za krótko" } });
    expect(screen.getByText("Wpisz co najmniej 1000 znaków.")).toBeVisible();
    expect(generateButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: buildValidSourceText() } });
    expect(screen.queryByText("Wpisz co najmniej 1000 znaków.")).not.toBeInTheDocument();
    expect(generateButton).toBeEnabled();
  });

  it("proposals.actions.updateStatusAndEdit", async () => {
    server.use(http.post("/api/v1/generations", () => HttpResponse.json(buildSuccessResponse(), { status: 201 })));

    const user = userEvent.setup();

    render(<GenerateFlashcardsView />);

    fireEvent.change(screen.getByLabelText("Tekst źródłowy"), { target: { value: buildValidSourceText() } });
    await user.click(screen.getByRole("button", { name: "Generuj" }));

    expect(await screen.findByText("Propozycje fiszek")).toBeVisible();

    const cardOne = screen.getByText("Pytanie 1").closest('[data-slot="card"]');
    const cardTwo = screen.getByText("Pytanie 2").closest('[data-slot="card"]');

    expect(cardOne).not.toBeNull();
    expect(cardTwo).not.toBeNull();

    const cardOneScope = within(cardOne as HTMLElement);
    const cardTwoScope = within(cardTwo as HTMLElement);

    await user.click(cardOneScope.getByRole("button", { name: "Akceptuj fiszkę" }));
    expect(cardOneScope.getByText("Zaakceptowana")).toBeVisible();

    await user.click(cardTwoScope.getByRole("button", { name: "Odrzuć fiszkę" }));
    expect(cardTwoScope.getByText("Odrzucona")).toBeVisible();

    await user.click(cardTwoScope.getByRole("button", { name: "Cofnij odrzucenie" }));
    expect(cardTwoScope.getByText("Oczekuje")).toBeVisible();

    await user.click(cardOneScope.getByRole("button", { name: "Edytuj fiszkę" }));

    const frontInput = await screen.findByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");

    expect(frontInput).toHaveValue("Pytanie 1");
    expect(backInput).toHaveValue("Odpowiedz 1");

    await user.clear(frontInput);
    await user.type(frontInput, "Nowy przód");
    await user.clear(backInput);
    await user.type(backInput, "Nowy tył");

    await user.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(await screen.findByText("Nowy przód")).toBeVisible();
    expect(screen.getByText("Nowy tył")).toBeVisible();
    expect(screen.getByText("Edytowana ręcznie")).toBeVisible();
  });

  it("edit.validation.blocksSave", async () => {
    server.use(http.post("/api/v1/generations", () => HttpResponse.json(buildSuccessResponse(), { status: 201 })));

    const user = userEvent.setup();

    render(<GenerateFlashcardsView />);

    fireEvent.change(screen.getByLabelText("Tekst źródłowy"), { target: { value: buildValidSourceText() } });
    await user.click(screen.getByRole("button", { name: "Generuj" }));

    expect(await screen.findByText("Propozycje fiszek")).toBeVisible();

    const cardOne = screen.getByText("Pytanie 1").closest('[data-slot="card"]');
    expect(cardOne).not.toBeNull();

    await user.click(within(cardOne as HTMLElement).getByRole("button", { name: "Edytuj fiszkę" }));

    const frontInput = await screen.findByLabelText("Przód");
    const backInput = screen.getByLabelText("Tył");

    await user.clear(frontInput);
    await user.clear(backInput);

    expect(screen.getByText("Przód musi mieć 1–200 znaków.")).toBeVisible();
    expect(screen.getByText("Tył musi mieć 1–500 znaków.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Zapisz zmiany" })).toBeDisabled();
  });

  it("saveAcceptedBar.sendsRequestAndRetriesOnError", async () => {
    const sourceText = buildValidSourceText();
    let saveAttempt = 0;
    let savedBody: unknown = null;

    server.use(
      http.post("/api/v1/generations", () => HttpResponse.json(buildSuccessResponse(), { status: 201 })),
      http.post("/api/v1/flashcards/bulkCreate", async ({ request }) => {
        saveAttempt += 1;
        savedBody = await request.json();

        if (saveAttempt === 1) {
          return HttpResponse.json({ error: { code: "INTERNAL_ERROR", message: "Błąd zapisu." } }, { status: 500 });
        }

        return HttpResponse.json({ data: { created: 1 } }, { status: 201 });
      })
    );

    const user = userEvent.setup();

    render(<GenerateFlashcardsView />);

    fireEvent.change(screen.getByLabelText("Tekst źródłowy"), { target: { value: sourceText } });
    await user.click(screen.getByRole("button", { name: "Generuj" }));

    expect(await screen.findByText("Propozycje fiszek")).toBeVisible();

    const saveButton = screen.getByRole("button", { name: "Zapisz zaakceptowane" });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText("Zaznacz fiszki do zapisu.")).toBeVisible();

    const cardOne = screen.getByText("Pytanie 1").closest('[data-slot="card"]');
    expect(cardOne).not.toBeNull();
    await user.click(within(cardOne as HTMLElement).getByRole("button", { name: "Akceptuj fiszkę" }));

    expect(saveButton).toBeEnabled();
    expect(screen.getByText("Do zapisu: 1")).toBeVisible();

    await user.click(saveButton);

    expect(await screen.findByText("Błąd zapisu.")).toBeVisible();
    await waitFor(() =>
      expect(savedBody).toEqual({
        generationId: 101,
        items: [{ front: "Pytanie 1", back: "Odpowiedz 1", source: "ai-full" }],
      })
    );

    await user.click(saveButton);

    await waitFor(() => expect(saveAttempt).toBe(2));
    await waitFor(() => expect(screen.queryByText("Propozycje fiszek")).not.toBeInTheDocument());
  });
});
