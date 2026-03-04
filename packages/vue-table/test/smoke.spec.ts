import { describe, expect, it } from 'vitest';
import { ioiTableVersion } from '../src';

describe('vue-table scaffold', () => {
  it('exports a version placeholder', () => {
    expect(ioiTableVersion).toBe('0.0.0');
  });
});
