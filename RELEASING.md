# Releasing @ioi-dev/vue-table

## Tag-Based Release

1. **Ensure version is correct** in `packages/vue-table/package.json`.

2. **Create a changeset** (optional, for changelog generation):
   ```bash
   npx changeset
   npx changeset version
   ```

3. **Commit and tag**:
   ```bash
   git commit -am "chore: version packages"
   git tag v0.3.0
   git push origin release/v0.3.0 --tags
   ```

4. **Merge to main** (after review approval). The tag must exist on main for the workflow to trigger.

5. The GitHub Actions release workflow will:
   - Run lint, typecheck, tests, build, and packed-consumer verification
   - Verify the tag version matches `package.json`
   - Publish to npm with provenance (OIDC)

## Manual Release (Emergency)

```bash
npm run build --workspace @ioi-dev/vue-table
npm run verify:artifact --workspace @ioi-dev/vue-table
npm publish --workspace @ioi-dev/vue-table --access public
```

## Pre-release

```bash
npm publish --workspace @ioi-dev/vue-table --tag next --access public
```
