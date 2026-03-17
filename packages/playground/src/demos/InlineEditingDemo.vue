<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { Table } from '@ioi-dev/vue-table';
import type { CellSlotProps, ColumnDef, IoiCellCommitPayload } from '@ioi-dev/vue-table';
import { useTheme } from '../composables/useTheme';
import { createTeamMembers, type TeamMember } from '../utils/demoData';

const { activeTheme } = useTheme();

const rows = shallowRef<TeamMember[]>(createTeamMembers(80));

const columns: ColumnDef<TeamMember>[] = [
  { id: 'id',         field: 'id',         header: 'ID',          type: 'number', width: 72 },
  { id: 'name',       field: 'name',       header: 'Name',        type: 'text',   width: 200, headerFilter: 'text' },
  { id: 'email',      field: 'email',      header: 'Email',       type: 'text',   width: 220 },
  { id: 'role',       field: 'role',       header: 'Role',        type: 'text',   width: 180, headerFilter: 'select' },
  { id: 'team',       field: 'team',       header: 'Team',        type: 'text',   width: 120, headerFilter: 'select' },
  {
    id: 'hourlyRate',
    field: 'hourlyRate',
    header: 'Rate (£/hr)',
    type: 'number',
    width: 120,
    validate: (v) => {
      const n = Number(v);
      if (isNaN(n) || n < 10 || n > 500) return 'Must be between £10 and £500';
      return true;
    },
  },
  { id: 'status', field: 'status', header: 'Status', type: 'text', width: 110 },
];

interface TableRef {
  startEdit: (opts: { field: string; rowKey: string | number; value?: unknown }) => void;
  setEditDraft: (v: unknown) => void;
  commitEdit: () => boolean;
  cancelEdit: () => void;
}
const tableRef = ref<TableRef | null>(null);

const editingCell = ref<{ field: string; rowKey: string | number } | null>(null);
const editingError = ref<string | null>(null);
const lastCommit = ref<string | null>(null);

const editableFields = new Set(['name', 'email', 'role', 'hourlyRate', 'status']);

function onCellClick(slotProps: CellSlotProps<TeamMember>): void {
  if (!editableFields.has(slotProps.column.field as string)) return;
  const key = slotProps.row.id;
  editingCell.value = { field: slotProps.column.field as string, rowKey: key };
  editingError.value = null;
  tableRef.value?.startEdit({ field: slotProps.column.field as string, rowKey: key, value: slotProps.value });
}

function onInputChange(e: Event): void {
  tableRef.value?.setEditDraft((e.target as HTMLInputElement).value);
}

function onCommit(): void {
  const ok = tableRef.value?.commitEdit();
  if (ok) {
    editingCell.value = null;
    editingError.value = null;
  }
}

function onCancel(): void {
  tableRef.value?.cancelEdit();
  editingCell.value = null;
  editingError.value = null;
}

function onCellCommit(payload: IoiCellCommitPayload<TeamMember>): void {
  // Update local row data
  const row = rows.value.find((r) => r.id === payload.rowKey);
  if (row) {
    (row as Record<string, unknown>)[payload.field] = payload.newValue;
  }
  lastCommit.value = `Updated ${payload.field} for row ${payload.rowKey}: "${payload.oldValue}" → "${payload.newValue}"`;
}
</script>

<template>
  <div class="demo">
    <div class="demo-header">
      <div>
        <h2 class="demo-title">Inline Editing</h2>
        <p class="demo-desc">
          Click any <strong>Name, Email, Role, Rate,</strong> or <strong>Status</strong> cell to edit inline.
          Rate has a validation rule (£10–£500). Press Enter to commit, Escape to cancel.
        </p>
      </div>
      <div v-if="editingCell" class="editing-indicator">
        Editing <strong>{{ editingCell.field }}</strong> on row {{ editingCell.rowKey }}
      </div>
    </div>

    <div v-if="lastCommit" class="commit-toast">{{ lastCommit }}</div>

    <div :class="`theme-${activeTheme}`">
      <Table
        ref="tableRef"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :height="500"
        :row-height="40"
        :overscan="8"
        @cell-commit="onCellCommit"
      >
        <template #cell="slotProps: CellSlotProps<TeamMember>">
          <!-- Editable cell: editing state -->
          <template
            v-if="editingCell &&
              editingCell.field === slotProps.column.field &&
              editingCell.rowKey === slotProps.row.id"
          >
            <div class="edit-cell">
              <input
                class="edit-input"
                :class="{ 'edit-input--error': editingError }"
                :value="slotProps.value as string"
                @input="onInputChange"
                @keydown.enter="onCommit"
                @keydown.escape="onCancel"
                autofocus
              />
              <div v-if="editingError" class="edit-error">{{ editingError }}</div>
              <div class="edit-actions">
                <button class="edit-btn edit-btn--ok" @click="onCommit">✓</button>
                <button class="edit-btn edit-btn--cancel" @click="onCancel">✕</button>
              </div>
            </div>
          </template>

          <!-- Status column: colored chip -->
          <template v-else-if="slotProps.column.field === 'status'">
            <span
              :class="['status-chip', slotProps.value === 'Active' ? 'status-chip--active' : 'status-chip--inactive']"
              :title="editableFields.has('status') ? 'Click to edit' : ''"
              @click="onCellClick(slotProps)"
            >
              {{ slotProps.value }}
            </span>
          </template>

          <!-- Rate: formatted -->
          <template v-else-if="slotProps.column.field === 'hourlyRate'">
            <span
              class="editable-cell"
              @click="onCellClick(slotProps)"
            >£{{ slotProps.value }}</span>
          </template>

          <!-- Other editable fields -->
          <template v-else-if="editableFields.has(slotProps.column.field as string)">
            <span class="editable-cell" @click="onCellClick(slotProps)">{{ slotProps.value }}</span>
          </template>

          <!-- Non-editable -->
          <template v-else>{{ slotProps.value }}</template>
        </template>
      </Table>
    </div>

    <div class="hint-bar">
      <span class="hint-icon">&#9432;</span>
      Editable columns are highlighted on hover. Click a cell to start editing.
    </div>

    <section class="code-section">
      <h3>Usage</h3>
      <pre v-pre class="code-block"><code>// All columns are editable by default. Opt out with editable: false.
const columns = [
  { field: 'name',  header: 'Name',  type: 'text' },
  { field: 'score', header: 'Score', type: 'number',
    validate: (v) => {
      const n = Number(v)
      if (isNaN(n) || n &lt; 0 || n &gt; 100) return 'Must be 0–100'
      return true
    }
  },
  { field: 'id', header: 'ID', editable: false },  // read-only
]

// Listen for committed edits
&lt;Table @cell-commit="onCellCommit" /&gt;

function onCellCommit({ rowKey, field, oldValue, newValue }) {
  // update your local data here
}

// Programmatic editing via table ref
tableRef.value.startEdit({ field: 'name', rowKey: 1, value: 'Alice' })
tableRef.value.commitEdit()   // returns false if validation fails
tableRef.value.cancelEdit()</code></pre>
    </section>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: 1rem; }

.demo-header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.demo-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
.demo-desc { margin: 0.25rem 0 0; color: #64748b; font-size: 0.82rem; max-width: 60ch; }

.editing-indicator {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
  padding: 0.4rem 0.8rem; font-size: 0.78rem; color: #1d4ed8;
}

.commit-toast {
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 0.5rem 0.9rem; font-size: 0.78rem; color: #166534;
  font-family: 'SFMono-Regular', Menlo, monospace;
}

.editable-cell {
  display: block; width: 100%; cursor: text;
  border-radius: 4px; padding: 0 2px;
  transition: background 100ms;
}
.editable-cell:hover { background: #f1f5f9; }

.edit-cell { display: flex; flex-direction: column; gap: 0.15rem; padding: 2px; }
.edit-input {
  border: 1px solid #0f5bd4; border-radius: 5px; padding: 0.2rem 0.4rem;
  font-size: 0.82rem; outline: none; width: 100%;
  box-shadow: 0 0 0 3px rgba(15,91,212,0.12);
}
.edit-input--error { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
.edit-error { font-size: 0.68rem; color: #dc2626; }
.edit-actions { display: flex; gap: 0.2rem; }
.edit-btn {
  border: none; border-radius: 4px; padding: 0.1rem 0.3rem;
  font-size: 0.72rem; cursor: pointer; font-weight: 700;
}
.edit-btn--ok { background: #0f5bd4; color: #fff; }
.edit-btn--cancel { background: #f1f5f9; color: #64748b; }

.status-chip {
  display: inline-block; font-size: 0.72rem; font-weight: 600;
  padding: 0.15rem 0.55rem; border-radius: 20px; cursor: pointer;
}
.status-chip--active  { background: #f0fdf4; color: #166534; }
.status-chip--inactive { background: #f8fafc; color: #94a3b8; }

.hint-bar {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.75rem; color: #94a3b8;
  padding: 0.5rem 0.75rem;
  background: #f8fafc; border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.hint-icon { font-size: 0.85rem; }
</style>
