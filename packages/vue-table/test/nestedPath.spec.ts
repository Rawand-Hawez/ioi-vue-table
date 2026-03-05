import { describe, expect, it } from 'vitest';
import { __nestedPathCache, get, has, set } from '../src/utils/nestedPath';

describe('nestedPath', () => {
  it('gets and checks nested object values', () => {
    const row = {
      user: {
        profile: {
          name: 'Rawa'
        }
      }
    };

    expect(get(row, 'user.profile.name')).toBe('Rawa');
    expect(has(row, 'user.profile.name')).toBe(true);
    expect(get(row, 'user.profile.title')).toBeUndefined();
    expect(has(row, 'user.profile.title')).toBe(false);
  });

  it('gets and checks array index values', () => {
    const row = {
      tags: ['ops', 'frontend'],
      items: [{ price: 10 }, { price: 20 }]
    };

    expect(get(row, 'tags.0')).toBe('ops');
    expect(has(row, 'tags.1')).toBe(true);
    expect(get(row, 'items.1.price')).toBe(20);
    expect(has(row, 'items.2.price')).toBe(false);
  });

  it('creates nested objects in set', () => {
    const row: Record<string, unknown> = {};

    set(row, 'user.profile.name', 'Alpha');

    expect(row).toEqual({
      user: {
        profile: {
          name: 'Alpha'
        }
      }
    });
  });

  it('creates arrays when numeric segments are used', () => {
    const row: Record<string, unknown> = {};

    set(row, 'tags.0', 'first');

    expect(row).toEqual({
      tags: ['first']
    });
  });

  it('sets values into arrays of objects', () => {
    const row: Record<string, unknown> = {};

    set(row, 'items.0.name', 'Desk');

    expect(row).toEqual({
      items: [{ name: 'Desk' }]
    });
  });

  it('extends arrays when setting a past-end index', () => {
    const row = {
      tags: ['a']
    };

    set(row, 'tags.3', 'd');

    expect(row.tags).toHaveLength(4);
    expect(1 in row.tags).toBe(false);
    expect(2 in row.tags).toBe(false);
    expect(row.tags[3]).toBe('d');
  });

  it('overwrites null or undefined mid-path with containers in set', () => {
    const nullRow: { user: unknown } = { user: null };
    const undefinedRow: { user?: unknown } = {};

    set(nullRow, 'user.profile.name', 'A');
    set(undefinedRow, 'user.profile.name', 'B');

    expect(nullRow).toEqual({
      user: {
        profile: {
          name: 'A'
        }
      }
    });
    expect(undefinedRow).toEqual({
      user: {
        profile: {
          name: 'B'
        }
      }
    });
  });

  it('does not throw on null or undefined mid-path in get and has', () => {
    const row = {
      user: null as unknown
    };

    expect(get(row, 'user.profile.name')).toBeUndefined();
    expect(has(row, 'user.profile.name')).toBe(false);
  });

  it('treats empty or invalid path segments as unresolved', () => {
    const row: Record<string, unknown> = { user: { name: 'Alpha' } };

    expect(get(row, '')).toBeUndefined();
    expect(has(row, '')).toBe(false);
    expect(get(row, 'user..name')).toBeUndefined();
    expect(has(row, 'user..name')).toBe(false);

    set(row, '', 'ignored');
    set(row, 'user..name', 'ignored');

    expect(row).toEqual({
      user: {
        name: 'Alpha'
      }
    });
  });

  it('keeps the internal path cache bounded under high-cardinality paths', () => {
    const row: Record<string, unknown> = {};

    for (let index = 0; index < 5_000; index += 1) {
      get(row, `nested.path.${index}`);
    }

    expect(__nestedPathCache.size()).toBeLessThanOrEqual(2048);
  });
});
