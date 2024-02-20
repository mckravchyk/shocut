import { dedupe, haveSameValues } from './lib/array';

import {
  type Modifier,
  type ShortcutMap,
  NON_TYPING_KEYS,
  type ShortcutArgs,
  type ShortcutContext,
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

export function processShortcutContext<ContextName extends string>(
  context: ShortcutArgs<ContextName>['context'],
): Array<ShortcutContext<ContextName> | ShortcutContext<ContextName>[]> {
  if (typeof context === 'undefined' || context === false) {
    return [];
  }

  if (typeof context === 'string') {
    return [context];
  }

  return dedupe(context);
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

function checkContextAndRelation(
  activeContexts: string[],
  input: string | string[],
): 'negation' | 'inclusion' | 'no_match' | 'match_if_single' {
  if (!Array.isArray(input)) {
    input = [input];
  }

  const affirmations = [];
  const negations = [];

  for (const context of input) {
    if (context.startsWith('!')) {
      negations.push(activeContexts.includes(context.substring(1)));
    }
    else {
      affirmations.push(activeContexts.includes(context));
    }
  }

  // It's important to process affirmations first, since this is an AND relation, active negation
  // will not have an effect if an affirmation does not match.
  for (const affirmation of affirmations) {
    if (!affirmation) {
      return 'no_match';
    }
  }

  // At this point there are either no affirmations or they all match - check for negations.

  let isNegation = false;

  // One negation is enough for it to have an effect. Just like negation in the outer OR is an AND,
  // here in the inner AND negation is an OR. I.e. if active context is ['a', 'b'] and the input is
  // ['a', '!b', '!c'] then the statement is a AND not-b AND not-c. not-b evaluates as false
  // therefore the statement is also false.
  for (const negation of negations) {
    if (negation) {
      isNegation = true;
    }
  }

  // If there are negations that do not match and no affirmations it needs to be considered
  // differently in the outer OR relation than a no match.
  if (negations.length > 0 && !isNegation && affirmations.length === 0) {
    return 'match_if_single';
  }

  return isNegation ? 'negation' : 'inclusion';
}

export function checkContext(
  activeContexts: string[],
  inputContext: Array<string | string[]>,
): boolean {
  // Global shortcut
  if (inputContext.length === 0) {
    return true;
  }

  if (!Array.isArray(inputContext)) {
    inputContext = [inputContext];
  }

  let matchFound = false;
  let matchIfSingle = false;
  let hasAffirmativeStatements = false;

  for (const context of inputContext) {
    const result = checkContextAndRelation(activeContexts, context);

    // If any of the AND inner statements evaluate as a negation the context will not be matched.
    if (result === 'negation') {
      return false;
    }

    if (result === 'inclusion') {
      matchFound = true;
      hasAffirmativeStatements = true;
    }
    else if (result === 'match_if_single') {
      matchIfSingle = true;
    }
    else if (result === 'no_match') {
      hasAffirmativeStatements = true;
    }
  }

  // match_if_single occurs when there are only negations that do not have any match. If there
  // are no affirmations then the contexts should match (fires in every contexts except those
  // negations). However, if there are affirmation statements and they all failed, it should not
  // match.
  if (matchIfSingle && !hasAffirmativeStatements) {
    return true;
  }

  return matchFound;
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
