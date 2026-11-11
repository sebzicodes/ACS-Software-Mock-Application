# COURSE_LOG.md

## M0.1 — npm workspace monorepo initialization
Built: root `package.json` with `"workspaces": ["packages/*"]`; `packages/core/package.json` scoped as `@acs/core`.
Verified: `node_modules/@acs/core` symlink resolves correctly to `../../packages/core`.
Owed: M0.2 — TypeScript configuration.

## M0.2 — TypeScript configuration
Built: `tsconfig.base.json` (strict, shared) + `packages/core/tsconfig.json` extending it; a null-check function in `core/src/index.ts` proving `strictNullChecks` catches unguarded access; a `typecheck` script.
Verified: `npx tsc -p packages/core` failed on unguarded `value.toFixed()`, passed clean after adding `if (value === null)` check; `npm run typecheck --workspace=packages/core` exits clean.
Owed: M0.3 — Vitest setup.

## M0.3 — Vitest setup
Built: Vitest installed and configured in `packages/core`; `index.test.ts` covers both branches of `numberOrNull` (null-guard and normal path).
Verified: `npm run test --workspace=packages/core` reports 2 passed (2).
Owed: M0.4 — CI, green on day one.

## M0.4 — CI, green on day one
Built: `.github/workflows/ci.yml` (checkout → setup-node → npm ci → typecheck → test on `packages/core`); proved it via PR #1 on `lab/m0.4-red-green`.
Verified: PR #1 went red on a failing assertion, green after the fix, merged; run #12 on `main` green.
Owed: M1.1 — Domain model; opens by adding the branch rule on `main`.

## M1.1 — Cardholder vs. credential
Built: `protect-main` ruleset requiring `core`; `Cardholder` and `Credential` types (PR #2); `badgeLabel` in `core/src/domain.ts` with tests for linked and unlinked cardholders (PR #3). Note: `05a6d4e` is an empty test push to `main` made before the rule existed.
Verified: direct push rejected (GH013); typecheck caught missing `cardholderId` (TS2741); 4 tests pass; PR #3 green.
Owed: M1.2 — Credential status. 

## M1.2 — Credential status
Built: `CredentialStatus` union and `status` on `Credential` (PR #4); `isCredentialActive` with default-deny and one test per status (PR #5).
Verified: typecheck caught TS2741 (missing field), TS2345 (`string` too wide), TS2820 (`"actve"`), TS2367 (impossible comparison); 8 tests pass locally; PR #5 green; `main` green (CI #32).
Owed: M1.3 — Readers and controllers.
Story: My first `isCredentialActive` listed the denied statuses joined with `&&`, a condition that could never be true; the compiler caught it, and I rewrote it to allow only "active", so any new status is denied by default.

## M1.3 — Readers and controllers
Built: `Controller` and `Reader` types (PR #7); `controllerForReader` returning the wired controller or `null` for a dangling `controllerId`, with four tests (PR #8).
Verified: typecheck clean; 12 tests pass locally; PR #8 CI green.
Owed: M1.4 — Schedules.
Story: I asserted against `controllers[2]` in a two-item list; TypeScript accepted it because it assumes an index holds a `Controller`, but at runtime it was `undefined`, and only the test caught the off-by-one.

## M1.4 — Schedules
Built: `WeekDay` union, `TimeWindow` (minutes after local midnight, start inclusive, end exclusive) and `Schedule` types (PR #9); `fix` adding sat/sun to `WeekDay` (PR #10); `isWithinSchedule` with default-deny and 9 table-driven tests (PR #11).
Verified: typecheck caught TS2820 (`"thur"`) and TS2322 (`"friday"`); 21 tests pass locally; PR #__ CI green; `main` green after merge.
Owed: M1.5 — Access levels.
Story: My night-shift fixture was one window from 1080 to 130, which crosses midnight and contains zero minutes, so every overnight badge was denied; only the tests expecting `true` caught it, and I split it into two windows at midnight.