# Releasing @ioi-dev/vue-table

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

## Making a Release

1. **Create a changeset** after your changes:
   ```bash
   npx changeset
   ```
   Select `@ioi-dev/vue-table`, choose the bump type (patch/minor/major), and write a summary.

2. **Commit the changeset** markdown file alongside your code changes.

3. **Merge to main**. The GitHub Actions release workflow will:
   - Run lint, typecheck, tests, and packed-consumer verification
   - Open a "Version Packages" PR that applies version bumps and updates the changelog
   - Publish to npm when the Version Packages PR is merged

## Manual Release (Emergency)

```bash
npm run build --workspace @ioi-dev/vue-table
npm run verify:artifact --workspace @ioi-dev/vue-table
npx changeset version
npx changeset publish
```

## Pre-release

```bash
npx changeset pre enter next
# make changes, create changesets
npx changeset version
npx changeset publish
npx changeset pre exit
```
