---
"@ioi-dev/vue-table": minor
---

Add key-based row selection APIs to `useIoiTable`, including single/multi toggle behavior, shift-range selection over sorted+filtered order, and `selectAll` scopes (`visible`, `filtered`, `allLoaded`).

Document and enforce `rowKey` selection requirements with a dev warning when selection is used without `rowKey`.
