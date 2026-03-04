# ARCHITECTURE.md — Data Flow, WASM Boundaries, and Invariants

## 1) Core Principle
The table is composable-first. Components are a thin UI shell over composables.

## 2) Data Flow (Index-based Pipeline)
- Source rows live in JS: shallowRef<T[]>
- Heavy operations produce index arrays (number[])
  - filteredIndices: number[]
  - sortedIndices: number[]
  - visibleIndices: number[] (viewport window)
- Rendering always maps: row = rows[visibleIndices[i]]

This prevents cloning large row objects and keeps memory stable.

## 3) WASM Boundary Rules
- WASM must NOT receive arbitrary JS objects.
- WASM should operate on:
  - primitive arrays / typed arrays
  - index arrays
  - pre-encoded column ops
- WASM returns:
  - indices
  - viewport ranges and offsets
  - CSV strings/chunks
- Path resolution can be Rust, but must expose the same JS fallback API:
  - get(row, path), set(row, path, value), has(row, path)

## 4) Virtualization Strategy (Constraints)
High-risk intersections:
- dynamic row height + virtualization
- sticky columns + horizontal virtualization
- resizing + pinning

The implementation must include a torture-test page early.

## 5) Server Mode Contract (v1 clarity)
Server mode changes responsibilities:
- Sorting/filtering/search are expressed as a debounced query state payload.
- Backend returns rows + pagination token/page info.
- In v1, grouping/aggregation is disabled in server mode unless backend provides it explicitly.

## 6) Editing Policy (Locked)
Default: staged edits with commit/cancel.
- Draft value lives in editing state, not in row data.
- Commit triggers:
  - row patch (client mode) OR
  - callback/promise (server mode), with optional optimistic update.

## 7) Selection Policy (Locked)
- Selection is key-based when rowKey exists (recommended).
- Index-based selection is allowed only for local-only / visible-only scenarios.
- Shift-range selection operates over the current sorted+filtered order but stores keys.

## 8) Semantic Events (Versioned)
All state-changing actions emit:
- type: data:filter | data:sort | data:select | data:modify | data:extract | data:explore
- schemaVersion: 1
- payload includes contextual state (filters/sort/columns) to be machine-readable.

## 9) Vapor Plan (Later)
- Vapor not supported in v1.0.
- Plan: separate entry point @ioi/vue-table/vapor with function renderers instead of slots.
- Core composables must remain render-agnostic to enable this later.
