import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readStylesheet(name: string): string {
  return readFileSync(resolve(process.cwd(), 'src', name), 'utf8');
}

describe('styles.css — default theme contract', () => {
  let css: string;

  beforeAll(() => {
    css = readStylesheet('styles.css');
  });

  const requiredSelectors = [
    ':root',
    '.ioi-table',
    '.ioi-table__viewport',
    '.ioi-table__table',
    '.ioi-table__header-content',
    '.ioi-table__header-label',
    '.ioi-table__header--sorted-asc',
    '.ioi-table__header--sorted-desc',
    '.ioi-table__filter-row',
    '.ioi-table__filter-cell',
    '.ioi-table__filter-input',
    '.ioi-table__filter-select',
    '.ioi-table__cell',
    '.ioi-table__row',
    '.ioi-table__row:hover',
    '.ioi-table__row--selected',
    '.ioi-table__row--focused',
    '.ioi-table__row--expanded',
    '.ioi-table__row--editing',
    '.ioi-table__row--dragging',
    '.ioi-table__row--drag-over-above',
    '.ioi-table__row--drag-over-below',
    '.ioi-table__cell--focused',
    '.ioi-table__cell--editing',
    '.ioi-table__cell--editable',
    '.ioi-table__cell--pinned-left-edge',
    '.ioi-table__cell--pinned-right-edge',
    '.ioi-table__empty',
    '.ioi-table__group-header',
    '.ioi-table__group-toggle',
    '.ioi-table__loading-overlay',
    '.ioi-table__error-overlay',
    '.ioi-table__resize-handle',
    '.ioi-table__resize-handle--disabled',
    '.ioi-table__drag-handle',
    '.ioi-table__expand-icon',
    '.ioi-table__expanded-content',
    '.ioi-table__sr-only',
    '.ioi-table__pagination',
    '.ioi-table thead th',
    '.ioi-table__header--pinned-left-edge',
    '.ioi-table__header--pinned-right-edge'
  ];

  it.each(requiredSelectors)('contains selector "%s"', (selector: string) => {
    expect(css).toContain(selector);
  });

  it('defines --ioi-table-* custom properties on :root', () => {
    const rootBlock = css.match(/:root\s*\{[^}]+\}/s)?.[0];
    expect(rootBlock).toBeDefined();
    expect(rootBlock).toContain('--ioi-table-border');
    expect(rootBlock).toContain('--ioi-table-focus-color');
    expect(rootBlock).toContain('--ioi-table-header-bg');
    expect(rootBlock).toContain('--ioi-table-header-color');
    expect(rootBlock).toContain('--ioi-table-row-hover-bg');
    expect(rootBlock).toContain('--ioi-table-row-selected-bg');
    expect(rootBlock).toContain('--ioi-table-row-focused-bg');
  });

  it('sets table width and border-collapse', () => {
    expect(css).toContain('border-collapse');
    expect(css).toContain('table-layout');
  });

  it('sets header background color', () => {
    expect(css).toContain('background');
  });

  it('sets cell padding', () => {
    expect(css).toContain('padding');
  });

  it('sets cell border', () => {
    expect(css).toContain('border');
  });

  it('provides sort indicators', () => {
    const sortedAsc = css.match(/\.ioi-table__header--sorted-asc[^{]*\{[^}]+\}/s)?.[0];
    const sortedDesc = css.match(/\.ioi-table__header--sorted-desc[^{]*\{[^}]+\}/s)?.[0];
    expect(sortedAsc).toBeDefined();
    expect(sortedDesc).toBeDefined();
  });

  it('provides pagination container styles', () => {
    expect(css).toContain('.ioi-table__pagination');
  });

  describe('pagination selectors', () => {
    const paginationSelectors = [
      '.ioi-table__pagination',
      '.ioi-table__pagination-info',
      '.ioi-table__pagination-size',
      '.ioi-table__pagination-btn',
      '.ioi-table__pagination-pages'
    ];

    it.each(paginationSelectors)('contains pagination selector "%s"', (selector: string) => {
      expect(css).toContain(selector);
    });

    it('styles disabled pagination buttons', () => {
      expect(css).toContain('.ioi-table__pagination-btn:disabled');
    });
  });

  it('has dark-mode token overrides via @media (prefers-color-scheme: dark)', () => {
    expect(css).toContain('prefers-color-scheme: dark');
  });

  it('has accessibility media queries', () => {
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('prefers-contrast: high');
  });
});

describe('minimal.css — structural baseline contract', () => {
  let css: string;

  beforeAll(() => {
    css = readStylesheet('minimal.css');
  });

  const requiredSelectors = [
    '.ioi-table',
    '.ioi-table__viewport',
    '.ioi-table__table',
    '.ioi-table__cell',
    '.ioi-table__row',
    '.ioi-table__header-content',
    '.ioi-table__filter-input',
    '.ioi-table__filter-select',
    '.ioi-table__resize-handle',
    '.ioi-table__sr-only'
  ];

  it.each(requiredSelectors)('contains selector "%s"', (selector: string) => {
    expect(css).toContain(selector);
  });

  it('sets border-collapse on table', () => {
    expect(css).toContain('border-collapse: collapse');
  });

  it('sets cell padding', () => {
    expect(css).toContain('padding');
  });
});

describe('themes/shadcn.css — shadcn variable contract', () => {
  let css: string;

  beforeAll(() => {
    css = readStylesheet('themes/shadcn.css');
  });

  const requiredShadcnVars = [
    '--background',
    '--foreground',
    '--muted',
    '--muted-foreground',
    '--card',
    '--card-foreground',
    '--accent',
    '--accent-foreground',
    '--border',
    '--input',
    '--ring',
    '--primary'
  ];

  it.each(requiredShadcnVars)('references shadcn variable "%s"', (variable: string) => {
    expect(css).toContain(`var(${variable})`);
  });

  it('maps to ioi-table custom properties', () => {
    expect(css).toContain('--ioi-table-bg');
    expect(css).toContain('--ioi-table-color');
    expect(css).toContain('--ioi-table-border');
    expect(css).toContain('--ioi-table-header-bg');
  });

  it('does not use @apply or Tailwind directives', () => {
    expect(css).not.toContain('@apply');
    expect(css).not.toContain('@tailwind');
  });

  it('styles the pagination button with shadcn variables', () => {
    expect(css).toContain('.ioi-table__pagination-btn');
  });
});
