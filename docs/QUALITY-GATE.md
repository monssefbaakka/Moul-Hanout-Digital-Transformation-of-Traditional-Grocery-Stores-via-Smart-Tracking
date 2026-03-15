# Quality Gate

## Goal

Do not push code that is obviously broken.

This quality gate is intentionally simple.
It protects the team without slowing early development too much.

---

## What Runs Automatically

### Before each push

The local Git `pre-push` hook runs:

```bash
npm run verify
```

### On GitHub

The workflow in `.github/workflows/quality-gate.yml` runs on:

- push
- pull request

---

## Current Automatic Checks

### 1. Shared package build

Purpose:

- catch broken shared types
- catch broken shared utilities
- protect both frontend and backend from contract drift

Command:

```bash
npm run check:shared
```

### 2. Backend unit tests

Purpose:

- verify important backend behavior still works
- stop obviously broken backend changes

Command:

```bash
npm run check:backend
```

Note:

- backend tests run with `--runInBand` for reliability on Windows and CI

### 3. Frontend lint and build

Purpose:

- keep code readable
- catch syntax and type issues
- avoid pushing frontend code that does not compile

Command:

```bash
npm run check:frontend
```

---

## Main Verify Command

Use this command before opening a PR:

```bash
npm run verify
```

It runs:

1. shared package build
2. backend unit tests
3. frontend lint
4. frontend build

---

## What These Checks Help Enforce

- working code
- buildable frontend
- readable code through linting
- safe shared contracts
- basic backend stability

---

## What Is Not Fully Automated Yet

These still need review discipline:

- comment quality
- architecture quality
- naming quality
- whether code is too complex
- whether a feature is implemented in the right module

These should be checked in PR review.

---

## Recommended Next Tests

After the backend Prisma baseline is stabilized, add these:

1. backend lint in CI
2. backend build in CI
3. backend e2e test for health and auth
4. frontend component tests for key forms
5. coverage threshold for critical modules
