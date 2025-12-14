# Repository Guidelines

## Project Structure & Module Organization

- `src/` – application source.
  - `src/pages/` – Astro routes (e.g., `src/pages/index.astro`).
  - `src/layouts/` – shared layouts (e.g., `src/layouts/Layout.astro`).
  - `src/components/` – UI components (`.astro` for mostly static content, React for interactivity).
  - `src/components/ui/` – shadcn-style UI primitives.
  - `src/lib/` – utilities and helpers (see `src/lib/utils.ts`).
  - `src/styles/` – global styling (see `src/styles/global.css`).
- `public/` – static assets served as-is.
- `.ai/` – product and tech context (`.ai/prd.md`, `.ai/tech-stack.md`).
- `lessons/` – course notes (not part of the runtime app).

## Build, Test, and Development Commands

- `nvm use` – switch to the expected Node version (see `.nvmrc`).
- `npm install` – install dependencies.
- `npm run dev` – start the Astro dev server.
- `npm run build` – production build.
- `npm run preview` – serve the production build locally.
- `npm run lint` / `npm run lint:fix` – run ESLint (and auto-fix where possible).
- `npm run format` – format with Prettier.

Note: pre-commit runs `npx lint-staged` (see `.husky/pre-commit`), so keep staged files clean.

## Coding Style & Naming Conventions

- Prettier is the source of truth (`tabWidth: 2`, `semi: true`, double quotes, `printWidth: 120`).
- ESLint uses TypeScript strict configs; `console.*` is allowed but warned.
- Prefer path aliases for imports: `@/…` maps to `src/…` (see `tsconfig.json`).

## Testing Guidelines

- No automated tests are configured yet (Playwright E2E is planned in `.ai/prd.md`).
- If you introduce tests, keep them deterministic and add explicit scripts to `package.json` (e.g., `npm run test`).

## Commit & Pull Request Guidelines

- Commit history currently uses imperative summaries (e.g., “Add …”, “Update …”), sometimes chaining changes with `;`.
- PRs should include: what changed, why, how to verify (`npm run build`, `npm run lint`), and screenshots for UI changes.

## Security & Configuration Tips

- Copy `.env.example` to `.env` and fill: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`.
- Never commit secrets; keep credentials in local env and CI/CD secrets.
