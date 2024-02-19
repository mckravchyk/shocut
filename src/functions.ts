import { haveSameValues } from './lib/array';

import {
  type Modifier,
  type ShortcutMap,
  NON_TYPING_KEYS,
} from '.';

export function getArrayFromProp<T>(prop: T[] | T | undefined, defaultValue?: T): T[] {
  return Array.isArray(prop)
    ? prop
    : typeof prop !== 'undefined'
      ? [prop]
      : typeof defaultValue !== 'undefined'
        ? [defaultValue] : [];
}

export function isSymbol(charCode: number): boolean {
  return (
    charCode >= 32 && charCode <= 47
    || charCode >= 91 && charCode <= 96
    || charCode >= 123 && charCode <= 126
    || charCode >= 160 && charCode <= 191
  );
}

export function getModifiers(e: KeyboardEvent): Array<Exclude<Modifier, 'system'>> {
  const modifiers: Array<Exclude<Modifier, 'system'>> = [];

  if (e.ctrlKey) {
    modifiers.push('ctrl');
  }

  if (e.metaKey) {
    modifiers.push('meta');
  }

  if (e.shiftKey) {
    modifiers.push('shift');
  }

  if (e.altKey) {
    modifiers.push('alt');
  }

  return modifiers;
}

export function sanitizeKeyValue(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}

export function validateContexts(contexts: string[], trace: string): void {
  for (const context of contexts) {
    if (context.startsWith('!')) {
      throw new Error(`Context value must not start with '!' [${trace}]`);
    }
  }
}

export function checkModifiersMatch(
  input: Array<Exclude<Modifier, 'system'>>,
  target: Modifier[],
  systemKey: Exclude<Modifier, 'system'>,
) : boolean {
  if (target.length === 0) {
    return input.length === 0;
  }

  target = [...target];

  if (target.includes('system')) {
    target.splice(target.indexOf('system'), 1);

    if (!target.includes(systemKey)) {
      target.push(systemKey);
    }
  }

  if (input.length !== target.length) {
    return false;
  }

  if (!haveSameValues(target, input)) {
    return false;
  }

  return true;
}

export function checkContext(
  activeContexts: string[],
  inputContext: string[],
): boolean {
  if (inputContext.length === 0) {
    return true;
  }

  if (!Array.isArray(inputContext)) {
    inputContext = [inputContext];
  }

  // Check for excluded contexts
  for (const context of inputContext) {
    if (context.startsWith('!') && activeContexts.includes(context.substring(1))) {
      return false;
    }
  }

  let isGlobal = true;

  // Check for required contexts
  for (const context of inputContext) {
    if (!context.startsWith('!')) {
      isGlobal = false;

      if (activeContexts.includes(context)) {
        return true;
      }
    }
  }

  return isGlobal;
}

/**
 * Whether there are any "non modifier" shortcuts active. See the comment in
 * `KeyboardShortcuts['handleKeydown']` for more details.
 */
export function hasNoModShortcuts(
  shortcuts: ShortcutMap<string>,
  activeContexts: string[],
): boolean {
  for (const [key, keyShortcuts] of Array.from(shortcuts.entries())) {
    // Non-typing keys are not considered for this optimization.
    if (NON_TYPING_KEYS.includes(key)) {
      continue;
    }

    for (const shortcut of keyShortcuts) {
      if (!checkContext(activeContexts, shortcut.context)) {
        continue;
      }

      // Shift is not treated as a modifier here since it plays a frequent role when typing
      // text.
      if (shortcut.mod.length === 0 || shortcut.mod.filter((mod) => mod !== 'shift').length === 0) {
        return true;
      }
    }
  }

  return false;
}
