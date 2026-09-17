
# Course Log

## M0.1 — npm workspaces
Built: monorepo root package.json (private, workspaces: packages/*) and packages/core/package.json (@acs/core).
Verified: npm install created node_modules/@acs/core as a symlink to ../../packages/core.
Owed: M0.2 TypeScript config.
## M0.2 — TypeScript configuration
Built: tsconfig.base.json (strict, shared) + packages/core/tsconfig.json extending it; a null-check function in core/src/index.ts proving strictNullChecks catches unguarded access; a typecheck script.
Verified: npx tsc -p packages/core failed on unguarded value.toFixed(), passed clean after adding if (value === null) check; npm run typecheck --workspace=packages/core exits clean.
Owed: M0.3 — Vitest setup.