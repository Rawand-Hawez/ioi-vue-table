type PathSegments = readonly string[];

const PATH_CACHE_MAX_ENTRIES = 2048;
const DANGEROUS_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const pathCache = new Map<string, PathSegments | null>();
const dotCharCode = 46;
const zeroCharCode = 48;
const nineCharCode = 57;
const hasOwnProperty = Object.prototype.hasOwnProperty;

function getCachedPath(path: string): PathSegments | null | undefined {
  if (!pathCache.has(path)) {
    return undefined;
  }

  const cached = pathCache.get(path) ?? null;
  pathCache.delete(path);
  pathCache.set(path, cached);
  return cached;
}

function setCachedPath(path: string, segments: PathSegments | null): void {
  if (pathCache.has(path)) {
    pathCache.delete(path);
  } else if (pathCache.size >= PATH_CACHE_MAX_ENTRIES) {
    const oldestKey = pathCache.keys().next().value;
    if (oldestKey !== undefined) {
      pathCache.delete(oldestKey);
    }
  }

  pathCache.set(path, segments);
}

function isNumericSegment(segment: string): boolean {
  if (segment.length === 0) {
    return false;
  }

  for (let index = 0; index < segment.length; index += 1) {
    const code = segment.charCodeAt(index);
    if (code < zeroCharCode || code > nineCharCode) {
      return false;
    }
  }

  return true;
}

function parsePath(path: string): PathSegments | null {
  const cached = getCachedPath(path);
  if (cached !== undefined) {
    return cached;
  }

  if (path.length === 0) {
    setCachedPath(path, null);
    return null;
  }

  const segments: string[] = [];
  let segmentStart = 0;

  for (let index = 0; index < path.length; index += 1) {
    if (path.charCodeAt(index) !== dotCharCode) {
      continue;
    }

    if (index === segmentStart) {
      setCachedPath(path, null);
      return null;
    }

    segments.push(path.slice(segmentStart, index));
    segmentStart = index + 1;
  }

  if (segmentStart === path.length) {
    setCachedPath(path, null);
    return null;
  }

  segments.push(path.slice(segmentStart));
  if (segments.some((segment) => DANGEROUS_PATH_SEGMENTS.has(segment))) {
    setCachedPath(path, null);
    return null;
  }
  setCachedPath(path, segments);

  return segments;
}

function readSegment(target: unknown, segment: string): unknown {
  if (target === null || target === undefined) {
    return undefined;
  }

  if (Array.isArray(target) && isNumericSegment(segment)) {
    return target[Number(segment)];
  }

  if (typeof target === 'object') {
    return (target as Record<string, unknown>)[segment];
  }

  return undefined;
}

function hasSegment(target: unknown, segment: string): boolean {
  if (target === null || target === undefined) {
    return false;
  }

  if (Array.isArray(target) && isNumericSegment(segment)) {
    const index = Number(segment);
    return index >= 0 && index < target.length && index in target;
  }

  if (typeof target === 'object') {
    return hasOwnProperty.call(target, segment);
  }

  return false;
}

function writeSegment(target: unknown, segment: string, value: unknown): void {
  if (Array.isArray(target) && isNumericSegment(segment)) {
    target[Number(segment)] = value;
    return;
  }

  if (typeof target === 'object' && target !== null) {
    (target as Record<string, unknown>)[segment] = value;
  }
}

function resolveSegments(path: string): PathSegments | null {
  if (typeof path !== 'string') {
    return null;
  }

  return parsePath(path);
}

export function get(target: unknown, path: string): unknown {
  const segments = resolveSegments(path);
  if (!segments) {
    return undefined;
  }

  let current: unknown = target;

  for (let index = 0; index < segments.length; index += 1) {
    current = readSegment(current, segments[index]);
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

export function has(target: unknown, path: string): boolean {
  const segments = resolveSegments(path);
  if (!segments) {
    return false;
  }

  let current: unknown = target;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!hasSegment(current, segment)) {
      return false;
    }

    current = readSegment(current, segment);
  }

  return true;
}

export function set(target: unknown, path: string, value: unknown): void {
  const segments = resolveSegments(path);
  if (!segments || segments.length === 0 || target === null || typeof target !== 'object') {
    return;
  }

  let current: unknown = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];
    const existingValue = readSegment(current, segment);

    if (typeof existingValue === 'object' && existingValue !== null) {
      current = existingValue;
      continue;
    }

    const nextContainer: unknown = isNumericSegment(nextSegment) ? [] : {};
    writeSegment(current, segment, nextContainer);
    current = nextContainer;
  }

  writeSegment(current, segments[segments.length - 1], value);
}

export const __nestedPathCache = {
  size(): number {
    return pathCache.size;
  }
};
