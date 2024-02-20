/**
 * Removes duplicate values from a multi-dimensional array recursively (strict equality check of
 * simple types only).
 */
export function dedupe<T extends unknown[]>(input: T): T {
  const output: T = [] as unknown as T;

  for (const val of input) {
    if (Array.isArray(val)) {
      output.push(dedupe(val));
    }
    else if (!output.includes(val)) {
      output.push(val);
    }
  }

  return output;
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
