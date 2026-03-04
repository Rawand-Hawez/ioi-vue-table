# Contributing

## Source of Truth

Before implementing behavior, align with:

- `AGENTS.md`
- `SPEC.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`

## Modes

### Mode A: Vue-only (default)

No Rust toolchain is required.

1. `npm install`
2. `npm run dev`
3. `npm run ci`

### Mode B: Full/WASM (future)

`packages/table-core` is currently a placeholder. WASM is intentionally not implemented yet.

## PR Rules

- Keep PRs small and focused.
- Add tests with each behavior change.
- Preserve API stability in v1.x.
- Avoid heavy dependencies unless justified.
