cat > COURSE_LOG.md << 'EOF'
# Course Log

## M0.1 — npm workspaces
Built: monorepo root package.json (private, workspaces: packages/*) and packages/core/package.json (@acs/core).
Verified: npm install created node_modules/@acs/core as a symlink to ../../packages/core.
Owed: M0.2 TypeScript config.
EOF