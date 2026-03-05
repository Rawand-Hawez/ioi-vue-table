<script setup lang="ts">
import { computed, ref } from 'vue';
import { IoiTable } from '@ioi/vue-table';
import type {
  ColumnDef,
  CsvImportMapping,
  CsvImportPreview,
  CsvImportResult,
  ParseCsvOptions
} from '@ioi/vue-table';

interface CsvImportRow {
  id: number | null;
  user: {
    profile: {
      name: string | null;
    };
  };
  tags: unknown;
  score: number | null;
  createdAt: string | null;
}

interface CsvImportTableExpose {
  parseCSV: (
    fileOrText: string | Blob,
    options?: ParseCsvOptions
  ) => Promise<CsvImportPreview<CsvImportRow>>;
  commitCSVImport: (
    mapping?: CsvImportMapping,
    options?: { mode?: 'append' | 'replace'; skipInvalidRows?: boolean }
  ) => CsvImportResult<CsvImportRow>;
}

const columns = ref<ColumnDef<CsvImportRow>[]>([
  {
    id: 'id',
    field: 'id',
    header: 'ID',
    type: 'number',
    width: 90,
    validate: (value) =>
      value === null || (typeof value === 'number' && value >= 1) ? true : 'ID must be >= 1'
  },
  {
    id: 'user.profile.name',
    field: 'user.profile.name',
    header: 'User Name',
    type: 'text',
    width: 200
  },
  {
    id: 'tags',
    field: 'tags',
    header: 'Tags',
    type: 'text',
    width: 220
  },
  {
    id: 'score',
    field: 'score',
    header: 'Score',
    type: 'number',
    width: 120,
    validate: (value) =>
      value === null || (typeof value === 'number' && value >= 0) ? true : 'Score must be >= 0'
  },
  {
    id: 'createdAt',
    field: 'createdAt',
    header: 'Created At',
    type: 'date',
    width: 160
  }
]);
const rows = ref<CsvImportRow[]>([]);

const tableRef = ref<CsvImportTableExpose | null>(null);
const preview = ref<CsvImportPreview<CsvImportRow> | null>(null);
const importResult = ref<CsvImportResult<CsvImportRow> | null>(null);
const mapping = ref<CsvImportMapping>({});
const hasHeader = ref(true);
const previewRowLimit = ref(200);
const csvText = ref(`ID,USER.PROFILE.NAME,TAGS,SCORE,CREATEDAT
1,Alpha,"[""ops"",""north""]",92,2026-03-01
2,Beta,[broken],-7,2026-03-02
3,Gamma,[],77,invalid-date`);

const previewErrorCount = computed(() =>
  (preview.value?.rows ?? []).reduce((sum, row) => sum + row.errors.length, 0)
);

function updateMapping(columnId: string, rawValue: string): void {
  mapping.value = {
    ...mapping.value,
    [columnId]: rawValue === '' ? null : Number(rawValue)
  };
}

function onMappingChange(columnId: string, event: Event): void {
  const target = event.target as HTMLSelectElement;
  updateMapping(columnId, target.value);
}

async function parseFromText(): Promise<void> {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  const nextPreview = await table.parseCSV(csvText.value, {
    hasHeader: hasHeader.value,
    previewRowLimit: previewRowLimit.value
  });
  preview.value = nextPreview;
  mapping.value = { ...nextPreview.mapping };
  importResult.value = null;
}

async function parseFromFile(event: Event): Promise<void> {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const nextPreview = await table.parseCSV(file, {
    hasHeader: hasHeader.value,
    previewRowLimit: previewRowLimit.value
  });
  preview.value = nextPreview;
  mapping.value = { ...nextPreview.mapping };
  importResult.value = null;
  target.value = '';
}

function commitPreviewImport(): void {
  const table = tableRef.value;
  if (!table) {
    return;
  }

  importResult.value = table.commitCSVImport(mapping.value, {
    mode: 'append',
    skipInvalidRows: true
  });
}
</script>

<template>
  <section class="demo">
    <header class="demo__header">
      <div>
        <h2>CSV Import</h2>
        <p>
          Preview + mapping + validation in JS mode. Commit appends only valid rows by default.
        </p>
      </div>
      <div class="demo__options">
        <label>
          <input v-model="hasHeader" type="checkbox">
          First row is header
        </label>
        <label>
          Preview row limit
          <input v-model.number="previewRowLimit" type="number" min="1" step="1">
        </label>
      </div>
    </header>

    <div class="demo__controls">
      <textarea v-model="csvText" rows="6" spellcheck="false" />
      <div class="demo__buttons">
        <button type="button" @click="parseFromText">Preview From Text</button>
        <label class="demo__file">
          <input type="file" accept=".csv,text/csv,text/plain" @change="parseFromFile">
          <span>Preview From File</span>
        </label>
        <button type="button" :disabled="!preview" @click="commitPreviewImport">
          Commit Valid Rows
        </button>
      </div>
    </div>

    <section v-if="preview" class="preview">
      <header class="preview__header">
        <p>
          Delimiter:
          <code>{{ preview.delimiter === '\t' ? 'tab' : preview.delimiter }}</code>
          • Rows: <strong>{{ preview.totalRows }}</strong>
          • Previewed: <strong>{{ preview.rows.length }}</strong>
          • Errors: <strong>{{ previewErrorCount }}</strong>
        </p>
      </header>

      <div class="preview__mapping">
        <label v-for="column in preview.columns" :key="column.columnId">
          <span>{{ column.header }}</span>
          <select
            :value="
              mapping[column.columnId] === null || mapping[column.columnId] === undefined
                ? ''
                : String(mapping[column.columnId])
            "
            @change="onMappingChange(column.columnId, $event)"
          >
            <option value="">Unmapped</option>
            <option v-for="(header, index) in preview.headers" :key="`${column.columnId}-${index}`" :value="index">
              {{ header || `column_${index + 1}` }}
            </option>
          </select>
        </label>
      </div>

      <pre v-if="previewErrorCount > 0" class="preview__errors">{{
        preview.rows
          .filter((row) => row.errors.length > 0)
          .slice(0, 8)
          .map((row) => `row ${row.rowNumber}: ${row.errors.map((error) => `${error.field} -> ${error.message}`).join('; ')}`)
          .join('\n')
      }}</pre>
    </section>

    <pre v-if="importResult" class="preview__result">{{ JSON.stringify(importResult, null, 2) }}</pre>

    <IoiTable ref="tableRef" :rows="rows" :columns="columns" :height="420" :row-height="34" :overscan="5" />
  </section>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 1rem;
}

.demo__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
}

.demo__header h2 {
  margin: 0;
  font-size: 1.35rem;
}

.demo__header p {
  margin: 0.35rem 0 0;
  color: #4f5f74;
}

.demo__options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}

.demo__options label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  color: #334359;
}

.demo__options input[type='number'] {
  width: 86px;
  border: 1px solid #c3cede;
  border-radius: 8px;
  padding: 0.3rem 0.45rem;
  font: inherit;
}

.demo__controls {
  display: grid;
  gap: 0.6rem;
}

.demo__controls textarea {
  width: 100%;
  border: 1px solid #c3cede;
  border-radius: 10px;
  padding: 0.75rem;
  font: 500 0.8rem/1.4 'SFMono-Regular', Menlo, Consolas, monospace;
  color: #1e2d42;
}

.demo__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.demo__buttons button,
.demo__file span {
  border: 0;
  border-radius: 9px;
  padding: 0.48rem 0.78rem;
  background: #0f5bd4;
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.demo__buttons button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.demo__file {
  position: relative;
}

.demo__file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.preview {
  border: 1px solid #d5dfed;
  border-radius: 12px;
  padding: 0.75rem;
  background: #f8fbff;
  display: grid;
  gap: 0.7rem;
}

.preview__header p {
  margin: 0;
  font-size: 0.82rem;
  color: #405167;
}

.preview__mapping {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.6rem;
}

.preview__mapping label {
  display: grid;
  gap: 0.32rem;
}

.preview__mapping span {
  font-size: 0.74rem;
  color: #4f5f74;
}

.preview__mapping select {
  border: 1px solid #c3cede;
  border-radius: 8px;
  padding: 0.32rem 0.42rem;
  font: inherit;
}

.preview__errors,
.preview__result {
  margin: 0;
  padding: 0.6rem;
  border-radius: 10px;
  border: 1px solid #d5dfed;
  background: #ffffff;
  font: 500 0.72rem/1.4 'SFMono-Regular', Menlo, Consolas, monospace;
  color: #2e3d53;
  overflow: auto;
}
</style>
