---
"@ioi-dev/vue-table": minor
---

Add `useColumnState` with stable column IDs, visibility/order/pin/sizing state, and a persistence adapter interface with an in-memory default implementation.

Update `IoiTable.vue` to derive `pinnedLeft`, `center`, and `pinnedRight` partitions and apply sticky CSS pinning for left/right columns while keeping full-column rendering (no horizontal virtualization windowing).
