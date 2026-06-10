import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function readPackageJson() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
    exports?: Record<string, unknown>;
    files?: string[];
  };
}

describe('package contract — CSS subpaths', () => {
  it('exports all documented CSS subpaths', () => {
    const pkg = readPackageJson();
    expect(pkg.exports?.['./styles.css']).toBe('./dist/style.css');
    expect(pkg.exports?.['./style.css']).toBe('./dist/style.css');
    expect(pkg.exports?.['./minimal']).toBe('./dist/minimal.css');
    expect(pkg.exports?.['./minimal.css']).toBe('./dist/minimal.css');
  });

  it('main JS entry does not import CSS', () => {
    const indexSource = readFileSync(resolve(process.cwd(), 'src/index.ts'), 'utf8');
    expect(indexSource).not.toMatch(/import\s+['"]\.\/styles\.css['"]/);
  });

  it('unstyled entry does not import CSS', () => {
    const unstyledSource = readFileSync(resolve(process.cwd(), 'src/unstyled.ts'), 'utf8');
    expect(unstyledSource).not.toMatch(/import\s+['"]\.\/.*\.css['"]/);
  });

  it('dist/style.css exists after build', () => {
    expect(existsSync(resolve(process.cwd(), 'dist/style.css'))).toBe(true);
  });

  it('dist/minimal.css exists after build', () => {
    expect(existsSync(resolve(process.cwd(), 'dist/minimal.css'))).toBe(true);
  });

  it('dist/style.css contains theme selectors', () => {
    const css = readFileSync(resolve(process.cwd(), 'dist/style.css'), 'utf8');
    expect(css).toContain('.ioi-table');
    expect(css).toContain('--ioi-table');
    expect(css).toContain('.ioi-table__row--selected');
    expect(css).toContain('.ioi-table__pagination');
    expect(css.length).toBeGreaterThan(100);
  });
});
