# 10xCards

> A web app for creating flashcards faster: generate cards with AI from pasted text, curate them, and save to Supabase (review / spaced repetition planned post-MVP).

![status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)

## Table of contents

- [Project description](#project-description)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Project description

10xCards is a minimalist flashcard app (**UI in Polish**) built as an MVP. It focuses on the shortest path from “I have a text” to “I have good cards I can review”:

- Paste a short text (**1000–10000 characters**) and generate a small set of Q/A flashcards with AI
- Edit each card, accept/reject it, and **bulk-save only accepted cards**
- Create cards manually (front/back)
- Store cards in **Supabase (PostgreSQL)** (review / spaced repetition planned post-MVP)

Product requirements and key decisions live in:

- `.ai/prd.md`
- `.ai/tech-stack.md`

## Tech stack

Frontend

- Astro (`astro`) + React (`react`, `react-dom`)
- TypeScript
- Tailwind CSS (`tailwindcss`) + `tailwind-merge`
- shadcn/ui-style components (Radix UI, class-variance-authority, lucide-react)

Backend

- Astro API routes (`src/pages/api`)
- Supabase (PostgreSQL, Auth, Row Level Security)

AI

- Google Gemini (model gateway)

Tooling

- ESLint (`eslint`) + Prettier (`prettier`)
- Husky + lint-staged for pre-commit checks

CI/CD & hosting

- GitHub Actions
- Cloudflare Pages (Astro Cloudflare adapter + Wrangler)

## Getting started locally

Prerequisites

- Node.js **22.14.0** (see `.nvmrc`)
- npm

Setup

```bash
# 1) use the expected Node.js version
nvm use

# 2) install dependencies
npm install

# 3) configure environment variables
cp .env.example .env
# fill in: SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
# optional for E2E: E2E_BASE_URL, E2E_EMAIL, E2E_PASSWORD
```

Run the app

```bash
npm run dev
```

Build & preview

```bash
npm run build
npm run preview
```

## Available scripts

- `npm run dev` – start Astro dev server
- `npm run build` – build for production
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint
- `npm run lint:fix` – run ESLint with `--fix`
- `npm run format` – format with Prettier
- `npm run astro` – run the Astro CLI
- `npm run test` – run unit + integration tests once (Vitest)
- `npm run test:watch` – run Vitest in watch mode
- `npm run test:e2e` – run E2E tests (Playwright)
- `npm run test:e2e:headed` – run Playwright with visible browser

## Testing

Test suite covers critical MVP flows across multiple layers:

- **Unit tests**: validation schemas, viewmodels, and service logic (Vitest).
- **Integration tests**: API route handlers and services with mocked Supabase/AI (Vitest).
- **E2E tests**: UI happy paths for login and generation/curation; some API responses are stubbed in Playwright.

Run tests locally

```bash
# install Playwright browsers once
npx playwright install

# unit + integration
npm run test

# e2e
npm run test:e2e
```

## Project scope

MVP includes

- AI flashcard generation from pasted text (**1000–10000 character** hard limit; no auto-truncation)
- Manual card creation (front/back)
- Review & curation flow: edit proposals, accept/reject (with undo)
- Manage saved flashcards: edit and delete
- Bulk save of accepted cards; edits after acceptance require re-acceptance
- Supabase persistence (cards with `user_id`, `front`, `back`, `source`, `generation_id`) with RLS enabled
- Generation metrics (generated count, accepted counts) + generation error logs
- Authentication: sign up, sign in, delete account; password recovery UI (email flow TBD)
- End-to-end tests (Playwright) for the main “happy paths”

Out of scope (MVP)

- Review flow and scheduling (spaced repetition; e.g. SM-2) — planned post-MVP
- Custom advanced spaced-repetition algorithms (beyond SM-2)
- Importing files (PDF/DOCX/etc.)
- Sharing decks between users
- Integrations with external learning platforms
- Mobile apps
- Content filtering, tagging, sources/metadata
- Payments, SSO, autosave

Success metrics (from PRD)

- ≥75% of AI-generated cards are accepted
- ≥75% of all created cards originate from AI
- Playwright tests cover the main flows
- Event logs are complete for the vast majority of operations

## Project status

This repository contains a working MVP app with auth, AI generation/curation, and flashcards; review flow remains **post-MVP**.

- [x] MVP defined (`.ai/prd.md`)
- [x] Tech stack selected (`.ai/tech-stack.md`)
- [x] Supabase schema
- [x] Auth screens and session handling
- [x] AI generation flow (Google Gemini) + card curation
- [x] Playwright end-to-end tests
- [x] CI/CD + deployment (GitHub Actions → Cloudflare Pages)
- [ ] Review flow (spaced repetition) — post-MVP

## License

No license file is currently included in the repository. If you plan to open-source this project, add a `LICENSE` file (for example: MIT).
