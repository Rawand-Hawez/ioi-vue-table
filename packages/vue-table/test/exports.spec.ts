import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataTable, IoiTable, Table } from '../src';
import { Table as UnstyledTable } from '../src/unstyled';
import { useColumnState } from '../src/composables/useColumnState';
import { useIoiTable } from '../src/composables/useIoiTable';
import { get, has, set } from '../src/utils/nestedPath';

describe('public component exports', () => {
  it('keeps Table, IoiTable, and DataTable as the same component', () => {
    expect(Table).toBe(IoiTable);
    expect(DataTable).toBe(IoiTable);
    expect(UnstyledTable).toBe(IoiTable);
  });

  it('exposes composables and nestedPath helpers as importable modules', () => {
    expect(typeof useIoiTable).toBe('function');
    expect(typeof useColumnState).toBe('function');
    expect(typeof get).toBe('function');
    expect(typeof set).toBe('function');
    expect(typeof has).toBe('function');
  });

  it('keeps CSS subpath exports aligned for styles.css and style.css', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>;
    };

    expect(packageJson.exports?.['./styles.css']).toBe('./dist/style.css');
    expect(packageJson.exports?.['./style.css']).toBe('./dist/style.css');
  });
});
