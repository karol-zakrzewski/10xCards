# Rozbieżności (z `.ai/generate-view-implementation-plan.md`)

Poniżej zebrane są wszystkie rozbieżności **wymienione** w `.ai/generate-view-implementation-plan.md`.

## 1) Limit długości `sourceText`

**Rozbieżność**

- Część dokumentacji produktu wskazuje limit **1000 znaków**.
- Kontrakt API oraz plan UI zakładają zakres **1000–10000 znaków**.

**Ustalona decyzja w planie**

- Przyjąć zakres zgodny z walidacją API: **1000–10000** (walidacja na `trim()`).

**Źródła**

- `.ai/generate-view-implementation-plan.md:14`
- `src/lib/validation/generations.ts` (min 1000, max 10000)
- `.ai/prd.md` (wzmianki o 1000 znaków)
- `.ai/api-plan.md` (1000–10000)
- `.ai/ui-plan.md` (1000–10000)

## 2) Nazwa/ścieżka endpointu bulk create fiszek

**Rozbieżność**

- Specyfikacja opisuje endpoint jako `POST /flashcards:bulkCreate` (w ramach bazowej ścieżki `/api/v1`).
- Aktualny routing w repo (Astro file-based routing) wystawia endpoint jako `POST /api/v1/flashcards/bulkCreate`.

**Ustalona decyzja w planie**

- Frontend na start powinien wołać ścieżkę, która realnie działa w repo: `POST /api/v1/flashcards/bulkCreate`.
- Jeśli chcemy zachować nazwę ze spec (`/flashcards:bulkCreate`), należy dodać alias/rewriter lub drugi route po stronie backendu.

**Źródła**

- `.ai/generate-view-implementation-plan.md:12`
- `.ai/generate-view-implementation-plan.md:374`
- `src/pages/api/v1/flashcards/bulkCreate.ts`
- `.ai/api-plan.md` (nazwa `POST /flashcards:bulkCreate`)

