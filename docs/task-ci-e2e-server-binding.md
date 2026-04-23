# Task Documentation

## 1. What Was Done
The objective was to fix the GitHub Actions backend CI failure that appeared after commit `9d5be3335398c1538d7952a2cd266a4d8d2954ba`.

The first problem was that the GitHub Actions summary looked misleading. It showed a warning about `/usr/bin/git` exit code `128`, which suggested a checkout problem. After inspecting the workflow job logs, the real failure was different: the `Backend e2e tests` step failed, and the two failing tests both ended with `read ECONNRESET`.

The implemented solution was to make the NestJS test application explicitly start listening on an ephemeral port inside the e2e test bootstrap. Concretely, after `await app.init()`, the test now also calls `await app.listen(0)`.

The final result is that the backend e2e suite now runs reliably under the CI-style parallel request tests, and the full local backend quality path passes again.

## 2. Detailed Audit
The work started with failure analysis instead of changing code immediately.

I first inspected the local workflow file `.github/workflows/quality-gate.yml` and confirmed that the pipeline structure itself was normal:
- checkout
- Node setup
- dependency install
- shared build
- Prisma generate
- migrations
- seed
- backend unit tests
- backend e2e tests
- backend build
- frontend check

Because the user-provided summary mentioned `/usr/bin/git` exit code `128`, I verified whether checkout was actually failing. Using the GitHub Actions run metadata and decoded job logs, I confirmed the following:
- `Checkout` succeeded
- `Install dependencies` succeeded
- `Shared packages build` succeeded
- `Generate Prisma Client` succeeded
- `Run database migrations` succeeded
- `Seed database` succeeded
- `Backend unit tests` succeeded
- `Backend e2e tests` failed

This was important because it prevented a wrong fix. The git `128` message came from post-job cleanup and was only a warning. It was not the reason the workflow concluded with failure.

I then inspected the backend e2e log and saw that the same two tests had failed in two separate GitHub Actions runs:
- `GET /api/v1/health is excluded from global throttling`
- `POST /api/v1/auth/login is rate limited after repeated attempts`

Both failures ended with `read ECONNRESET` instead of assertion mismatches. That pattern matters because it suggests connection instability during the test rather than incorrect business logic.

Next, I reviewed `backend/test/app.e2e-spec.ts` and found that both failing tests send 12 requests concurrently with `Promise.all(...)`. I also found that the Nest test app was only initialized with:
- `await app.init()`

It was never explicitly bound with `app.listen(...)`.

That detail is the key technical cause. With `supertest`, sequential requests often work fine against a lazily initialized server object, but concurrent requests can race the server binding path and produce intermittent socket resets. This explains why:
- only the concurrency-based tests failed
- the failures were `ECONNRESET`
- other e2e tests continued to pass
- the problem reproduced on GitHub-hosted Linux runners across multiple runs

I considered two possible fix directions:
- weaken the tests by making the requests sequential
- keep the concurrency assertions and make the server startup deterministic

The second option was preferred because it preserves the original test intent. The health test still verifies that a burst of requests is not throttled, and the login test still verifies that repeated rapid login attempts hit rate limiting.

The actual code change was minimal:
- updated the e2e bootstrap in `backend/test/app.e2e-spec.ts`
- added `await app.listen(0);` immediately after `await app.init();`

This binds the application to an ephemeral port once per test setup, which removes the lazy-start race without changing application logic, route behavior, or throttling rules.

After the edit, I validated the change in two stages:
- ran `cmd /c npm run test:e2e --workspace backend`
- ran `cmd /c npm run check:backend`

Both passed successfully.

I also observed an existing GitHub Actions warning during post-job cleanup:
- `fatal: No url found for submodule path '.claude/worktrees/suspicious-khayyam-0f3982' in .gitmodules`

I did not change that path in this task because it was not the failing step and because removing a tracked gitlink is a separate repository cleanup task. The failure fixed here was the e2e `ECONNRESET` behavior.

## 3. Technical Choices and Reasoning
The main design choice was to stabilize the test harness instead of changing the product code.

Naming and structure:
- I kept the fix inside the e2e bootstrap because the bug was in test-server setup, not in a backend module.
- No application module, controller, service, DTO, or repository logic was changed.

Why `app.listen(0)`:
- `0` tells the operating system to assign an available ephemeral port.
- This avoids hardcoding a port and prevents port-collision risk in local or CI environments.
- It makes concurrent HTTP tests operate against a fully bound server instance.

Maintainability:
- The fix is one line and easy to understand.
- Future contributors reading the e2e bootstrap can quickly infer that the suite intentionally supports concurrent request tests.

Scalability:
- The solution scales with more concurrency-based e2e tests because it stabilizes the shared bootstrap path rather than patching individual assertions one by one.

Performance:
- Binding once during each test setup is inexpensive compared with the rest of the e2e boot sequence.
- It avoids unnecessary retries or test flakiness, which is a bigger productivity cost than the small startup overhead.

Security:
- No secrets, tokens, environment defaults, or permissions were changed.
- The fix does not weaken rate limiting or bypass any guard behavior.

## 4. Files Modified
- `backend/test/app.e2e-spec.ts` — bound the Nest e2e test application to an ephemeral listening port after initialization to prevent concurrent `supertest` request socket resets
- `docs/task-ci-e2e-server-binding.md` — added the required technical audit documentation for this CI fix task

## 5. Validation and Checks
- GitHub Actions diagnosis: inspected workflow run `24839487678` and confirmed the real failing step was `Backend e2e tests`, not checkout
- Regression diagnosis: inspected previous failing run `24802519820` and confirmed the same two e2e tests failed with `ECONNRESET`
- Local e2e validation: `cmd /c npm run test:e2e --workspace backend` passed
- Local backend quality validation: `cmd /c npm run check:backend` passed
- Prisma generation: passed during `check:backend`
- Backend unit tests: passed during `check:backend`
- Backend build: passed during `check:backend`
- Frontend validation: not rerun in this task because the fix only touched backend e2e bootstrap code
- Residual warning: the repository still emits a GitHub Actions post-checkout warning for `.claude/worktrees/suspicious-khayyam-0f3982`; this warning was observed but not changed in this task

## 6. Mermaid Diagrams
```mermaid
flowchart TD
    A[beforeEach starts Nest test app] --> B[app.init only]
    B --> C[Concurrent supertest requests begin]
    C --> D[Lazy server binding races]
    D --> E[Intermittent ECONNRESET in CI]
```

```mermaid
flowchart TD
    A[beforeEach starts Nest test app] --> B[app.init]
    B --> C[app.listen on ephemeral port]
    C --> D[Concurrent supertest requests use already-bound server]
    D --> E[Health and throttling e2e tests complete reliably]
```

```mermaid
sequenceDiagram
    participant CI as GitHub Actions
    participant Jest as Jest e2e suite
    participant Nest as Nest test app
    participant ST as supertest

    CI->>Jest: run backend e2e tests
    Jest->>Nest: create app
    Jest->>Nest: app.init()
    Jest->>Nest: app.listen(0)
    Jest->>ST: send concurrent requests
    ST->>Nest: hit bound HTTP server
    Nest-->>ST: stable responses
    ST-->>Jest: assertions pass
```

## Commit Message
fix: stabilize backend e2e server bootstrap in CI
