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