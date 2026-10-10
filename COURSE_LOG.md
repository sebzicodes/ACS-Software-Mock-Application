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