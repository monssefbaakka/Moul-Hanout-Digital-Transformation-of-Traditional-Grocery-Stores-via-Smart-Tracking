# Flippa Readiness Plan — Moul Hanout

Goal: take the repository from "working MVP on my machine" to "a clean, licensed, demoable asset a stranger will pay for on Flippa."

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## 0. Reality check — what you are selling

Flippa pays for **traffic + revenue**, not source code. With zero users and no revenue, this lists in the **"starter site / code asset"** bucket (typically hundreds to low thousands USD). Every item in Phase 3 (traction) multiplies the price far more than polishing code. Do Phases 1–2 to be *sellable at all*; do Phase 3 to be *worth real money*.

Current strengths (keep in the listing pitch):
- Full-stack monorepo: NestJS 11 + Next.js 15 + Prisma 7 + PostgreSQL + Redis
- 10 backend domain modules, 14 Prisma models
- Docker Compose one-command run, CI, Swagger, seed data, screenshots
- Real product flows: auth, catalog, inventory, POS, alerts, reporting, admin

---

## Phase 1 — Blockers (must do before any listing)

Half a day of mechanical work. Without these, a buyer who clones the repo walks away.

### 1.1 Add a LICENSE / IP transfer terms
- [ ] Decide model: full IP transfer on sale (standard for Flippa code sales).
- [ ] Add `LICENSE` file. For a sold-outright asset, a proprietary "all rights reserved, full ownership transfers to buyer at sale" notice is fine; MIT only if you intend to keep reusing it yourself.
- [ ] State the transfer terms explicitly in the Flippa listing too.

### 1.2 Purge tracked junk files
These are committed and make the repo look unfinished:
- [ ] `backend/e2e_fail_full.txt`
- [ ] `backend/e2e_out.txt`
- [ ] `backend/tsc_output.txt`
- [ ] `backend/tmp_moul_cdc.txt`
- [ ] `frontend/tsconfig.tsbuildinfo`
- [ ] `frontend-dev.err.log`, `frontend-dev.out.log` (root)
- [ ] `backend/dist/` if tracked (build output should never be committed)

```bash
git rm --cached backend/e2e_fail_full.txt backend/e2e_out.txt \
  backend/tsc_output.txt backend/tmp_moul_cdc.txt \
  frontend/tsconfig.tsbuildinfo frontend-dev.err.log frontend-dev.out.log
```

### 1.3 Remove dev tooling leaked into the repo
- [ ] Untrack `.claude/` (37 files: skills, `worktrees/`, `.pyc`, personal settings). A buyer should not receive your local agent config.
- [ ] Untrack `.agents/`, `agents.md`, `skills-lock.json` unless you deliberately want to hand them over.
- [ ] Remove `.pnpm-store/` and `venv/` from the repo if tracked (they aren't a deliverable).

### 1.4 Fix `.gitignore` so junk never returns
Add:
```gitignore
# build / tooling output
*.tsbuildinfo
backend/dist/
frontend/.next/
*.txt.log
.claude/
.agents/
.pnpm-store/
venv/
__pycache__/
*.pyc
```
(Keep intentional `.txt` docs out of the wildcard if you have any.)

### 1.5 Rotate every secret
`.env` is not tracked (good) but holds live values on your disk. Before handing over the repo:
- [ ] Rotate `GEMINI_API_KEY` (revoke the old one).
- [ ] Regenerate `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET`.
- [ ] Rotate DB password.
- [ ] Confirm `.env.example` lists every required var with placeholder values and no real ones.
- [ ] Grep history for accidentally committed secrets: `git log -p | grep -iE "secret|api_key|password"`. If any real secret was ever committed, scrub history (`git filter-repo`) or the buyer can recover it.

### 1.6 Clean the git history surface
- [ ] Reword or squash the placeholder commit `ed5ff11 "Implement feature X ... bug Y in module Z"`.
- [ ] Confirm branch is `main`, no stray WIP branches (`suspicious-khayyam-*` worktree ref seen).

**Exit criterion:** fresh `git clone` → `docker compose up --build` → app runs, no junk files, no secrets, LICENSE present.

---

## Phase 2 — Buyer confidence (makes it credible)

One to two days. These raise the perceived quality and de-risk the purchase.

### 2.1 Prove it runs from a clean clone
- [ ] Test on a machine that has never seen the project (or a fresh container).
- [ ] `docker compose up --build` must reach a working app with seeded demo accounts.
- [ ] Document exact steps in README (already mostly there — verify every command actually works).

### 2.2 Green build + tests
- [ ] `npm run verify` passes end to end.
- [ ] CI badge green on `main`; screenshot or link it in the listing.
- [ ] Backend has 8 spec files — add coverage for the money paths: auth, sales/POS checkout, inventory decrement, reports totals. Aim for the critical flows, not 100%.
- [ ] Frontend has **0 tests**. Add at least a smoke test (renders dashboard, POS add-to-cart). Buyers heavily discount untested frontends.

### 2.3 Documentation a buyer can act on
- [ ] README quick-start verified (done-ish).
- [ ] Add `HANDOVER.md`: architecture summary, env vars explained, how to deploy to production, how to add a store, known limitations, roadmap. This is the #1 thing serious buyers ask for.
- [ ] Consolidate the scattered docs (`documentation.md`, `design.md`, `docs/`) or link them from one index.

### 2.4 Address the niche framing
Current product is single-store, French UI, Morocco-specific (Marjane dataset, `moulhanout.ma`). That's fine, but the listing must frame it as either:
- [ ] A ready-to-deploy vertical SaaS for Moroccan/French-speaking grocers, **or**
- [ ] A white-label POS + inventory starter that a buyer localizes.
Pick one narrative and make the README match it.

**Exit criterion:** a technical buyer can clone, run, understand, and deploy without contacting you.

---

## Phase 3 — Traction (multiplies the price 5–20x)

This is optional for *listing* but decisive for *value*. Flippa's best prices go to assets with proof of demand.

### 3.1 Live demo (do this even if nothing else in Phase 3)
- [ ] Deploy a public demo (Railway/Render/Fly for backend + DB, Vercel for frontend).
- [ ] Seed it, expose the two demo accounts (owner/cashier) read-mostly.
- [ ] Put the demo URL at the top of the listing. Buyers who can click convert far better than buyers who must clone.

### 3.2 Get real usage
- [ ] Onboard even one real grocery store. A single live user changes the category from "code" to "micro-business."
- [ ] Capture: number of stores, transactions processed, any monthly fee collected.
- [ ] Screenshot real (anonymized) usage/analytics.

### 3.3 Revenue signal
- [ ] If any store pays anything, document it (invoice, receipt). Even $20/mo recurring is a real multiple on Flippa.
- [ ] If no revenue, state the monetization model clearly (per-store subscription, setup fee) so the buyer sees the path.

**Exit criterion:** listing shows a live demo and at least one usage or revenue data point.

---

## Phase 4 — Listing package

- [ ] Title + one-liner: what it is, who it's for.
- [ ] Feature list (pull from README section "What The Platform Covers").
- [ ] Tech stack table (already in README).
- [ ] Screenshots (already in `screens/`) + demo URL.
- [ ] What's included: full source, IP transfer, docs, demo, X hours of handover support.
- [ ] Price + rationale (comparable Flippa POS/inventory code sales).
- [ ] Reason for selling (buyers always ask).
- [ ] Handover plan: repo transfer, secrets rotation, deployment walkthrough call.

---

## Effort / priority summary

| Phase | Effort | Effect on sale | Skip? |
| --- | --- | --- | --- |
| 1 — Blockers | ~0.5 day | Required to list at all | No |
| 2 — Confidence | 1–2 days | Higher price, fewer buyer objections | No |
| 3 — Traction | days–weeks | 5–20x price multiplier | Optional but huge |
| 4 — Listing | ~0.5 day | Converts viewers to bids | No |

**Minimum to list:** Phases 1, 2, 4.
**To list for real money:** add Phase 3.

---

## Quick-start checklist (do first, in order)

1. [ ] Add LICENSE
2. [ ] `git rm --cached` all junk + `.claude/` + tooling
3. [ ] Update `.gitignore`
4. [ ] Rotate all secrets, verify none in git history
5. [ ] Reword placeholder commit
6. [ ] Clean clone → `docker compose up --build` works
7. [ ] `npm run verify` green
8. [ ] Deploy live demo
9. [ ] Write `HANDOVER.md`
10. [ ] Draft Flippa listing
