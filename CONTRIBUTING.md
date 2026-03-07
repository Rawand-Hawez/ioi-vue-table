# Contributing to IOI Vue Table

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Rawand-Hawez/ioi-vue-table.git
cd ioi-vue-table

# Install dependencies
npm install

# Start the playground
npm --workspace @ioi/vue-table-playground run dev
```

## Development Workflow

### Mode A: Vue-only (default)

No Rust toolchain is required. This is the standard development mode.

```bash
npm install
npm run dev
npm run ci
```

### Mode B: Full/WASM (future)

The `packages/table-core` Rust workspace is currently a placeholder. WASM acceleration is planned for a future release.

## Pull Request Guidelines

- **Keep PRs small and focused** - One feature or fix per PR
- **Add tests** - All behavior changes require test coverage
- **Preserve API stability** - No breaking changes in v1.x
- **Minimize dependencies** - Avoid heavy dependencies unless justified
- **Run checks before submitting**:
  ```bash
  npm --workspace @ioi-dev/vue-table run test
  npm --workspace @ioi-dev/vue-table run typecheck
  npm --workspace @ioi-dev/vue-table run lint
  ```

## Code Style

- TypeScript strict mode is enabled
- Follow existing code patterns
- Keep the public API surface minimal

## Testing

```bash
# Run tests
npm --workspace @ioi-dev/vue-table run test

# Run tests with coverage
npm --workspace @ioi-dev/vue-table run test:coverage
```

## Project Structure

```
packages/
├── vue-table/       # Published npm package @ioi-dev/vue-table
├── table-core/      # Rust workspace (placeholder for future WASM)
└── playground/      # Vite demo app for development
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
