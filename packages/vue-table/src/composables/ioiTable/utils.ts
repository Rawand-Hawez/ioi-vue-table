export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toIndexArray(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start) }, (_, offset) => start + offset);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  return !(value instanceof Date);
}

export function collectNestedObjectLeafPaths(
  value: Record<string, unknown>,
  prefix: string,
  leafPaths: string[]
): void {
  const keys = Object.keys(value);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const nestedPath = prefix.length > 0 ? `${prefix}.${key}` : key;
    const nestedValue = value[key];

    if (isPlainObject(nestedValue)) {
      collectNestedObjectLeafPaths(nestedValue, nestedPath, leafPaths);
      continue;
    }

    leafPaths.push(nestedPath);
  }
}

export function stringifyFacetValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? value.toISOString() : '';
  }

  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}
