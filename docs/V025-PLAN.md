# v0.2.5 Plan — @ioi-dev/vue-table

**Status**: ✅ Released 2026-04-13
**Based on**: v0.2.4
**Goal**: Final pre-v1.0.0 release — closes remaining gaps, introduces minimal styling tier
**Last Updated**: 2026-04-13

> Historical planning document. For the next milestone see [v1.0-PLAN.md](./v1.0-PLAN.md). For the post-v1.0 line see [ROADMAP.md](./ROADMAP.md).

---

## Overview

v0.2.5 is the last minor release before the stable v1.0.0 milestone. It addresses:

- One outstanding BEM modifier gap from the v0.2.1 list
- A new CSS entry point between "fully styled" and "completely unstyled"
- Three new interactive features (row reorder, clipboard copy, column groups)
- Playground cleanup to use properly exported package types

> **MCP server bridge has been deferred to v1.2.** It is no longer part of v0.2.5 scope. See §5.

No breaking changes. All additions are backward-compatible.

---

## 1. Package Changes

### 1.1 `ioi-table__row--expanded` Base Style

**Priority**: Low — small fix  
**Package area**: `src/styles.css`

The `ioi-table__row--expanded` modifier is already applied in `IoiTable.vue` when a row is expanded, but no base CSS rule exists for it. Users have no styling hook without adding it themselves.

**What to add:**
```css
.ioi-table__row--expanded {
  background-color: #f0f7ff;
}
```

A subtle, neutral background to distinguish expanded rows. Users can override via the BEM class.

**Acceptance criteria:**
- [ ] `.ioi-table__row--expanded` has a base rule in `styles.css`
- [ ] The rule is documented in BEM class reference

---

### 1.2 `@ioi-dev/vue-table/minimal` Entry Point

**Priority**: High  
**Package area**: `src/minimal.css`, `package.json` exports

Currently there are two options: fully styled (`@ioi-dev/vue-table`) or completely bare (`@ioi-dev/vue-table/unstyled`). There is no middle ground.

The `unstyled` entry point produces an unusable-looking table out of the box — no padding, no borders, no readable structure. This creates friction for developers who want to style it themselves but still need a functional starting point.

**New entry point**: `@ioi-dev/vue-table/minimal`

**What `minimal.css` includes:**
- Cell padding and row height
- 1px neutral border between rows (`#e2e8f0`)
- Header bottom border
- Sticky header background (white) so it doesn't bleed into rows on scroll
- Subtle hover row highlight (`rgba(0,0,0,0.025)`) — colour-agnostic
- Focus ring for keyboard navigation (accessibility)
- Scrollbar container sizing

**What `minimal.css` explicitly excludes:**
- No brand colours
- No rounded corners
- No shadows or gradients
- No custom fonts or weights
- No icons or decorative elements
- Nothing that requires overriding to fit a design system

**Usage:**
```ts
import { Table } from '@ioi-dev/vue-table/unstyled';
import '@ioi-dev/vue-table/minimal';
```

**Acceptance criteria:**
- [ ] `minimal.css` exists in `src/`
- [ ] `package.json` exports map includes `"./minimal"` pointing to `dist/minimal.css`
- [ ] Table is visually readable with zero additional CSS
- [ ] All colours are neutral (no blue accent, no brand)
- [ ] Documented in API-REFERENCE.md entry points table

---

### 1.3 Row Drag-and-Drop Reorder

**Priority**: Medium  
**Package area**: `src/components/IoiTable.vue`, `src/composables/useIoiTable.ts`, `src/types.ts`

Allow users to reorder rows by dragging, in addition to the existing column reorder. This is a very common requirement in list/table UIs.

**API design:**
```ts
// Props
rowDraggable?: boolean         // enables drag handle column (default: false)

// Events
'row-reorder': (payload: IoiRowReorderPayload) => void

// Types
interface IoiRowReorderPayload {
  fromIndex: number;           // source index in current visible order
  toIndex: number;             // destination index
  row: TRow;
}
```

**Behaviour:**
- A drag handle column prepended automatically when `rowDraggable` is true
- Drag handle uses `ioi-table__drag-handle` BEM class
- Fires `row-reorder` event — does NOT mutate the rows array (controlled, like all other APIs)
- Works alongside sorting (sorting disables row drag or warns)
- Keyboard-accessible: Alt+Arrow keys to move focused row

**BEM additions:**
- `ioi-table__drag-handle` — the handle cell
- `ioi-table__row--dragging` — applied to the row being dragged
- `ioi-table__row--drag-over` — applied to the drop target row

**Acceptance criteria:**
- [ ] `rowDraggable` prop enables drag handles
- [ ] `row-reorder` event fires with correct from/to indices
- [ ] Keyboard reorder works (Alt+Arrow)
- [ ] Drag does not mutate rows array
- [ ] BEM classes documented
- [ ] Tests cover reorder logic

---

### 1.4 Ctrl+C Copy Selection to Clipboard

**Priority**: Medium  
**Package area**: `src/composables/ioiTable/keyboard.ts`, `src/types.ts`

When rows are selected, pressing Ctrl+C (Cmd+C on Mac) copies them as tab-separated values to the clipboard. This is expected behaviour for power users.

**Behaviour:**
- Copies selected rows in current visible order (respects sort/filter)
- Tab-separated columns, newline-separated rows
- Headers included as first row by default
- Only visible (non-hidden) columns included
- Fires `data:extract` semantic event on copy

**Props:**
```ts
copyable?: boolean   // enables Ctrl+C behaviour (default: true when selection enabled)
```

**Exposed method (via tableRef):**
```ts
copySelectionToClipboard(): Promise<void>
```

**Acceptance criteria:**
- [ ] Ctrl+C copies selected rows to clipboard
- [ ] Headers included, hidden columns excluded
- [ ] `data:extract` semantic event fires
- [ ] `copySelectionToClipboard()` method exposed on tableRef
- [ ] Works without browser clipboard API (graceful degradation)
- [ ] Tests cover copy output format

---

### 1.5 Column Groups / Spanning Headers

**Priority**: Medium — complex  
**Package area**: `src/types.ts`, `src/components/IoiTable.vue`, `src/composables/useIoiTable.ts`

Multi-level column headers. Groups a set of columns under a shared header that spans them. Standard in enterprise data tables, currently in v1.2.0 roadmap — pulling forward as it significantly improves the component's completeness before v1.0.

**API design:**
```ts
// New top-level prop
columnGroups?: ColumnGroup[]

interface ColumnGroup {
  id: string;
  header: string;
  columnIds: string[];         // IDs of columns that belong to this group
}
```

**Behaviour:**
- Renders a second `<tr>` in `<thead>` for the group row
- Group header `<th>` uses `colspan` equal to the number of visible columns in the group
- Pinned columns in a group: group header also sticky
- No nested groups in v0.2.5 — single-level only
- Group header slot: `#column-group-header="{ group }"`

**BEM additions:**
- `ioi-table__group-header-row` — the `<tr>` containing group headers
- `ioi-table__group-header-cell` — each `<th>` in the group row
- `ioi-table__group-header-cell--empty` — placeholder `<th>` for ungrouped columns

**Acceptance criteria:**
- [ ] `columnGroups` prop renders spanning headers
- [ ] `colspan` calculated correctly with hidden columns
- [ ] Pinning respected
- [ ] `#column-group-header` slot works
- [ ] No nested groups (single-level only, documented)
- [ ] Tests cover colspan calculation and hidden column edge cases

---

### 1.6 MCP Server Bridge — **Deferred to v1.2**

Moved out of v0.2.5 scope on 2026-04-13. Tracked in the v1.2 roadmap alongside nested column groups and RTL support. See §5.

---

## 2. Playground Changes

### 2.1 Replace Stale Local Type Definitions

**Priority**: Low — cleanup  
**Files**: All demo files that define `GroupHeader` or `AggregationType` locally

Both types are now exported from the package. Local definitions are stale and should be removed.

**Affected demos** (confirm by grep):
- `RowGroupingDemo.vue` — uses local `AggregationType` import alias
- Any demo that manually defined `interface GroupHeader { ... }`

**Change:**
```ts
// Before
type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

// After
import type { AggregationType, GroupHeader } from '@ioi-dev/vue-table';
```

**Acceptance criteria:**
- [ ] No local `AggregationType` definitions in playground
- [ ] No local `GroupHeader` definitions in playground
- [ ] All demos import from `@ioi-dev/vue-table` directly

---

### 2.2 MCP Demo Tab — **Deferred to v1.2**

Paired with §1.6. Will land when the MCP bridge ships.

---

### 2.3 Minimal Theme Demo

**Priority**: Medium (paired with 1.2)  
**Files**: `packages/playground/src/styles/table-themes.css`, `useTheme.ts`

Add a fourth theme option to the playground theme switcher: **Minimal** — uses `@ioi-dev/vue-table/minimal` with no additional CSS.

**Change:**
- Add `minimal` to the theme options in `useTheme.ts`
- Add `.theme-minimal` wrapper in `table-themes.css` (empty — the minimal CSS does all the work)
- Update theme switcher labels: Default / Minimal / Tailwind / Bootstrap

**Acceptance criteria:**
- [ ] Minimal theme selectable in all demo tabs
- [ ] Table renders with only `minimal.css` applied
- [ ] No console errors or layout breakage

---

## 3. Documentation Updates

### 3.1 Update ROADMAP.md

- Mark column groups as pulled forward from v1.2.0 to v0.2.5
- Record MCP bridge deferral to v1.2 (previously planned for v0.2.5, originally on v2.0.0 roadmap)
- Add v0.2.5 to release schedule table

### 3.2 Update API-REFERENCE.md

- Add `minimal` to entry points table
- Document `rowDraggable` prop and `row-reorder` event
- Document `copyable` prop and `copySelectionToClipboard` method
- Document `columnGroups` prop and `#column-group-header` slot
- Remove duplicate "Render Entries API" section (lines 936–973 are identical to 897–911) — **already fixed**
- Fix server-side prop example: replace `:fetch-fn` with `data-mode="server" + :server-options` — **already fixed in root README**

### 3.2a Update AI.md

- Add v0.2.5 feature summaries (minimal CSS, row reorder, clipboard, column groups)

### 3.2b Update package README body

- Add documentation for each v0.2.5 feature to match the subtitle tagline

### 3.3 Migration Guide: v0.2.x → v0.2.5

Update existing `packages/vue-table/MIGRATION.md` — prepend a v0.2.x → v0.2.5 section:
- No breaking changes
- New opt-in features (minimal CSS, row reorder, clipboard, column groups)
- Type import cleanup (`GroupHeader`, `AggregationType` now exported — remove local definitions)

> Do NOT create a separate MIGRATION-v1.0.md — v1.0 has not shipped. Update the single migration file when v1.0 is ready.

---

## 4. Release Checklist

### Package (`packages/vue-table`)
- [ ] 1.1 `ioi-table__row--expanded` base style added
- [ ] 1.2 `minimal.css` created, export path added
- [ ] 1.3 `rowDraggable` prop and `row-reorder` event
- [ ] 1.4 Ctrl+C clipboard copy
- [ ] 1.5 `columnGroups` prop

> §1.6 `useMcpBridge` and `packages/mcp-server` deferred to v1.2.

### Playground (`packages/playground`)
- [ ] 2.1 Local type defs replaced with package imports
- [ ] 2.3 Minimal theme option added

> §2.2 MCP demo tab deferred to v1.2.

### Docs
- [ ] 3.1 ROADMAP.md updated
- [ ] 3.2 API-REFERENCE.md updated
- [ ] 3.3 Migration guide created

### CI / Quality
- [ ] All existing tests pass
- [ ] New tests for 1.3, 1.4, 1.5
- [ ] Bundle size audit (`vue-table` package still <75KB)
- [ ] Playground deploys without errors

---

## 5. Scope Boundaries

The following are **explicitly out of scope** for v0.2.5 and belong to v1.0.0 or later:

| Item | Reason | Target |
|------|--------|--------|
| MCP server bridge (`useMcpBridge`, `packages/mcp-server`) | Deferred 2026-04-13 — scope/stability for v0.2.5, strategic fit better in v1.2 | v1.2 |
| MCP playground demo tab | Paired with MCP bridge | v1.2 |
| Row edit via MCP (`edit` permission) | Security review needed | v1.2+ |
| Nested column groups | Complexity, single-level covers 90% of use cases | v1.2 |
| Horizontal virtualization | Architectural change | v1.1 |
| RTL support | Separate workstream | v1.2 |
| XLSX/PDF export | Out of scope per SPEC.md | — |
| Dark mode prop | Nice-to-have, v1.0 roadmap | v1.0 |
| MCP multi-table support | Part of MCP workstream | v1.2+ |

---

## 6. Summary

| # | Item | Area | Priority |
|---|------|------|----------|
| 1.1 | `row--expanded` base style | Package | Low |
| 1.2 | Minimal CSS entry point | Package | High |
| 1.3 | Row drag-and-drop reorder | Package | Medium |
| 1.4 | Ctrl+C clipboard copy | Package | Medium |
| 1.5 | Column groups / spanning headers | Package | Medium |
| 2.1 | Replace stale local type defs | Playground | Low |
| 2.3 | Minimal theme in switcher | Playground | Medium |
| 3.x | Documentation updates | Docs | Medium |

> Deferred to v1.2: §1.6 MCP server bridge, §2.2 MCP demo tab.
