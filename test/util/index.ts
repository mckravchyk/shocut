import type { Modifier } from 'src';

export function dispatchKeydown(key: string, code: string, modifiers: Array<Exclude<Modifier, 'system'>> = []): void {
  const eventProperties: Partial<KeyboardEvent> = {
    key,
    code,
  };

  for (const mod of modifiers) {
    // @ts-expect-error Assign to read-only properties
    eventProperties[`${mod}Key`] = true;
  }

  window.dispatchEvent(new KeyboardEvent('keydown', eventProperties));
}
