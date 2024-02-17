export function dedupe<T extends unknown[]>(arr: T): T {
  return [...new Set(arr)] as T;
}

/**
 * Returns whether a has all values that b has and b has all values that a has regardless of
 * duplicates or array length.
 */
export function haveSameValues(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (const value of a) {
    if (!b.includes(value)) {
      return false;
    }
  }

  for (const value of b) {
    if (!a.includes(value)) {
      return false;
    }
  }

  return true;
}
