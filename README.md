# 10xCards

> A web app for creating flashcards faster: generate cards with AI from pasted text, curate them, save to Supabase, and review with the SM-2 spaced-repetition algorithm.

![status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)

## Table of contents

- [Project description](#project-description)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Project description

10xCards is a minimalist flashcard app (**UI in Polish**) built as an MVP. It focuses on the shortest path from “I have a text” to “I have good cards I can review”:

- Paste a short text (up to **1000 characters**) and generate a small set of Q/A flashcards with AI
- Edit each card, accept/reject it, and **bulk-save only accepted cards**
- Create cards manually in the same editor
- Store cards in **Supabase (PostgreSQL)** and review them with **SM-2** spaced repetition

Product requirements and key decisions live in:

- `.ai/prd.md`
- `.ai/tech-stack.md`

## Tech stack

Frontend

- Astro (`astro`) + React (`react`, `react-dom`)
- TypeScript
- Tailwind CSS (`tailwindcss`) + `tailwind-merge`
- shadcn/ui-style components (Radix UI, class-variance-authority, lucide-react)

Backend (planned for MVP)

- Supabase (PostgreSQL, Auth, Row Level Security)

AI (planned for MVP)

- OpenRouter (model gateway)

Tooling

- ESLint (`eslint`) + Prettier (`prettier`)
- Husky + lint-staged for pre-commit checks

CI/CD & hosting (planned)

- GitHub Actions
- DigitalOcean (Docker-based deployment)

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
# fill in: SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY
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

## Project scope

MVP includes

- AI flashcard generation from pasted text (**1000 character** hard limit; no auto-truncation)
- Manual card creation (front/back)
- Review & curation flow: edit, accept/reject, delete
- Bulk save of accepted cards; edits after acceptance require re-acceptance
- Supabase persistence (cards with `user_id`, `front`, `back`, `due_at`, `sm2_state`) with RLS enabled
- SM-2 scheduling (store `due_at` in **UTC**)
- Event logging for `generated`, `accepted`, `rejected` (for MVP metrics)
- Authentication: sign up, sign in, password reset, delete account
- End-to-end tests (Playwright) for the main “happy paths”

Out of scope (MVP)

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

This repository currently contains the Astro/React/Tailwind scaffold; MVP features described in `.ai/prd.md` are **in progress**.

- [x] MVP defined (`.ai/prd.md`)
- [x] Tech stack selected (`.ai/tech-stack.md`)
- [ ] Supabase schema + RLS
- [ ] Auth screens and session handling
- [ ] AI generation flow (OpenRouter) + card curation
- [ ] SM-2 review flow
- [ ] Playwright end-to-end tests
- [ ] CI/CD + deployment

## License

No license file is currently included in the repository. If you plan to open-source this project, add a `LICENSE` file (for example: MIT).
