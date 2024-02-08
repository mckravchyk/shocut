export function dedupe<T extends unknown[]>(arr: T): T {
  return [...new Set(arr)] as T;
}
