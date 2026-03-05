export function normalizeSelectedKeys(keys: Array<string | number>): Array<string | number> {
  const seen = new Set<string | number>();
  const normalized: Array<string | number> = [];

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(key);
  }

  return normalized;
}
