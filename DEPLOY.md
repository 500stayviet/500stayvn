# Production Deploy Guide

This document defines the standard commercial deployment flow for this project.

## Core Principles

- Always keep `frontend/package-lock.json` committed and synchronized with `frontend/package.json`.
- Amplify build must use deterministic dependency installation with `npm ci --no-audit`.
- Do not run `prisma migrate deploy` inside Amplify build.
- Run database migration in a controlled release step before code deployment.

## Standard Release Routine

### Step 1) Run DB migration locally and verify

1. Open terminal at `frontend`.
2. Run migration deploy:

```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

3. Verify migration status:

```bash
npx prisma migrate status --schema=./prisma/schema.prisma
```

4. Run a quick application build check:

```bash
npm ci --no-audit
npm run build
```

5. Smoke-check critical flows against the target DB (login, booking, payment API, admin pages).

### Step 2) Deploy code by Git push

1. Commit only intended release changes (including lockfile updates when dependencies changed).
2. Push to `main`:

```bash
git push origin main
```

3. Confirm Amplify build uses:
   - preBuild: `npm ci --no-audit`
   - build: `npx prisma generate --schema=./prisma/schema.prisma` then `npm run build`

4. Verify deployment result is `Deployed` and run production smoke tests.

## When dependencies change

If `frontend/package.json` is updated:

1. Regenerate lockfile from `frontend`:

```bash
rm -rf node_modules package-lock.json
npm install --no-audit
```

2. Commit both files:
   - `frontend/package.json`
   - `frontend/package-lock.json`

3. Re-run:

```bash
npm ci --no-audit
```

If `npm ci` fails locally, do not deploy until lockfile mismatch is resolved.

## Incident checklist for build failures

- `npm ci` failure: verify lockfile sync first.
- Build timeout: check whether migration was accidentally reintroduced into Amplify build.
- Prisma client errors: ensure `npx prisma generate` runs during build and schema path is correct.
- Env errors: confirm required Amplify environment variables are configured.
