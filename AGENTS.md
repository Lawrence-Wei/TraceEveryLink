# Agent Instructions

## Product
- User-facing name: Chinese `接线镜`, English `TraceEveryLink`.
- Keep `PatchPlan` / `patchplan` technical identifiers unless explicitly asked to migrate storage, cookies, services, package names, or database names.
- Default UI language is English; users may manually switch to Chinese.
- See `DESIGN.md` for visual/product rules and `change.md` for completed changes.

## Package Manager
- Use **npm** with `package-lock.json`.
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Tests: `npm run test`
- Production build: `npm run build`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Single test file | `npx vitest run path/to/file.test.ts` |
| Prisma generate | `npm run db:generate` |
| Docker config check | `docker compose config` |
| Linux installer syntax | `bash -n scripts/install-linux.sh` |

## Project Map
- Main workbench: `src/app/DashboardClient.tsx`
- Global styling: `src/app/globals.css`
- i18n strings and default language: `src/shared/i18n.ts`
- Cisco model/port layout catalog: `src/shared/cisco-catalog.ts`
- Seed inventory: `prisma/seed.ts`
- Deployment: `Dockerfile`, `docker-compose.yml`, `scripts/install-linux.sh`
- Product docs: `README.md`, `DESIGN.md`, `change.md`, `docs/`

## Engineering Rules
- Preserve canonical port names: `Gi1/0/4`, `Te1/1/1`, `Hu1/0/1`; never display `1-0-4`.
- Cisco panels must follow official-like physical order, including 12-port banks where applicable.
- Keep all visible UI copy in i18n; preserve device, rack, cable, and port identifiers literally.
- Do not expose PostgreSQL `5432` in production compose.
- Do not commit secrets, `.env`, runtime photos, backups, or generated build output.
- Update `change.md` whenever behavior, deployment, docs, product naming, or UX changes.

## Database And Seed
- Local setup: copy `.env.example` to `.env`, ensure `DATABASE_URL` points to PostgreSQL, then run `npm run db:push` and `npm run db:seed`.
- Docker setup: prefer `docker compose up -d --build`; the `migrate` service runs schema push and seed.
- Seeded admin display name should remain `TraceEveryLink Admin`.

## Verification
- For code changes, run `npm run typecheck` and relevant Vitest tests.
- For deployment changes, also run `docker compose config` and `bash -n scripts/install-linux.sh`.
- For Dockerfile/runtime changes, run `docker build --target runner -t traceeverylink:deploy-check .` when Docker is available.
- For UI-heavy work, verify in browser and check desktop/mobile layouts for clipping, overlap, pan, wheel, and port selection.

## Commit Attribution
AI commits MUST include:
```text
Co-Authored-By: (agent name) <noreply@example.com>
```
