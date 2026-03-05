# RELEASE.md — @ioi-dev/vue-table

This repository uses Changesets for versioning. Do not manually edit version numbers.

## 1) Create/Review Changesets

Every PR that changes `@ioi-dev/vue-table` must include a file in `.changeset/` with the intended bump (`patch`, `minor`, `major`).

Before release, verify pending changesets:

```bash
ls .changeset
```

## 2) Apply Version Bumps (Changesets)

Run versioning from the repository root:

```bash
npx @changesets/cli version
```

This updates package versions and changelogs from `.changeset/*.md`.

## 3) Build and Validate Package Contents

```bash
npm --workspace @ioi-dev/vue-table run build
npm_config_cache=/tmp/npm-cache npm --workspace @ioi-dev/vue-table pack
```

Verify the tarball contains `dist/` JS bundles plus declarations (`dist/index.d.ts`, etc.) and does not include playground sources.

## 4) Publish

This package defaults to public publishing via `publishConfig.access = "public"`:

```bash
npm publish --workspace @ioi-dev/vue-table
```

## 5) Post-Publish

- Tag and push release commit(s).
- Merge or remove consumed changeset files on the release branch as part of normal changeset workflow.
