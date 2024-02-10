import { getShortcutKey } from 'keyboard-shortcuts-i18n';
import { dedupe } from './lib/array';

const SUPPORTED_MODIFIERS = ['system', 'ctrl', 'meta', 'alt', 'shift'] as const;

/**
 * Shortcut modifier key:
 * - system - the default modifier key for standard keyboard shortcuts on the OS. It is the command
 * key on Mac OS and the control key on other systems.
 * - alt - the option key on Mac OS and alt key on other platforms
 * - ctrl - the control key
 * - meta - the command key on Macs or the Windows logo button on other computers
 */
export type Modifier = typeof SUPPORTED_MODIFIERS[number];

type ShortcutMap<ContextName extends string> = Map<string /* key */, Shortcut<ContextName>[]>;

export type ShortcutContextName<ContextName extends string> = ContextName | `!${ContextName}`;

export type ShortcutContext<
  ContextName extends string
> = ShortcutContextName<ContextName> | ShortcutContextName<ContextName>[]

export type Shortcut<ContextName extends string> = {
  /**
   * The key to trigger the shortcut. Only one key is allowed sans modifiers.
   *
   * By default this is the key that matches the `KeyboardEvent['key']` property with the exception
   * that if the property is a letter, it will always be upper case and if it is a non Latin
   * alphabet letter it will be translated to a Latin letter per QWERTY layout - see
   * `keyboard-shortcuts-i18n` npm package for more detail about the latter.
   *
   * It is also possible to bind to `KeyboardEvent['code']` - this is facilitated by prefixing the
   * key with `'code:'`, i.e. `'code:Backquote'`. Binding to `code` may be necessary for some
   * symbol keys, i.e. for Ctrl + ` on a standard QWERTY layout the code will be `'Backquote'` but
   * the key will be `'Unidentified'`. A shortcut handler bound with code value will always take
   * priority over a regular key.
   */
  key: string

  /**
   * A modifier key or multiple modifier keys that must be present at the same time to trigger the
   * shortcut. Note that if a modifier is not specified the shortcut will not trigger when present,
   * i.e. a shortcut for Ctrl+S will not trigger if Ctrl+Shift+S were pressed.
   */
  mod?: Modifier | Modifier[]

  // FIXME: this as the event target / current target - the same as it would be in the original
  // event callback
  handler: (this: null, e: KeyboardEvent) => void

  /**
   * Defines in which contexts the shortcut is allowed to fire:
   * - If not set, `false` or an empty array the shortcut will apply in any context
   * - If one or more contexts are defined, the shortcut will only apply if at least one of those
   * contexts are active
   * - If a context is added with a '!' prefix, the shortcut will never apply if this context is
   * active.
   */
  context?: ShortcutContext<ContextName> | false
}

export enum Platform {
  linux,
  macos,
  windows,
  other
}

export interface Args<ContextName extends string> {
  shortcuts: Shortcut<ContextName>[]
  platform: Platform
  activeContexts?: ContextName[]

  /**
   * If set, the `keydown` event handler will not be bound during initialization and the
   * `handleKeydown` method can be used instead to bind it manually.
   */
  noAutoBind?: boolean
}

const F_KEYS = (() => {
  const fkeys = [];
  for (let i = 1; i <= 12; i += 1) {
    fkeys.push(`F${i}`);
  }

  return fkeys;
})();

/**
 * Key codes of special keys that are not modifiers and do not play a part in typing text.
 */
const NON_TYPING_KEYS = [
  'Escape',
  ...F_KEYS,
  'PrintScreen',
  'Insert',
];

export class KeyboardShortcuts<ContextName extends string> {
  private shortcuts_: ShortcutMap<ContextName> = new Map();

  /**
   * Represents contexts which are currently considered for the shortcut.
   */
  private activeContexts_: Array<ContextName>;

  /**
   * See the comment in `handleKeydown`.
   */
  private hasNoModShortcutsInActiveCtx_ = false;

  private autobind_ = false;

  private platform_: Platform;

  public constructor(args: Args<ContextName>) {
    this.platform_ = args.platform;
    this.activeContexts_ = args.activeContexts || [];

    validateContexts(this.activeContexts_, 'Nu46QORqkIX5');

    if (!args.noAutoBind) {
      this.autobind_ = true;
      window.addEventListener('keydown', this.handleKeydown);
    }

    this.registerShortcuts(args.shortcuts);
  }

  public destroy() {
    if (this.autobind_) {
      window.removeEventListener('keydown', this.handleKeydown);
    }
  }

  /**
   * Adds new shortcuts.
   */
  public add(shortcuts: Shortcut<ContextName>[]): void {
    this.registerShortcuts(shortcuts);
  }

  /**
   * Removes shortcuts with a `filter` function (similar to `Array.prototype.filter`) for specified
   * `keyOrKeys` or if not set, all keys.
  */
  public remove(
    filter: (shortcut: Shortcut<ContextName>) => boolean,
    keyOrKeys?: string | string[],
  ): void {
    for (const [key, shortcuts] of Array.from(this.shortcuts_.entries())) {
      if (typeof keyOrKeys === 'undefined' || keyOrKeys === key || keyOrKeys.includes(key)) {
        this.shortcuts_.set(key, shortcuts.filter(filter));
      }
    }

    this.processChanges_();
  }

  public getActiveContexts(): ContextName[] {
    return [...this.activeContexts_];
  }

  /**
   * Adds a new context or multiple to be active to the current active contexts.
   *
   * @throws If any of the context names is invalid. Context name must not start with '!'.
   */
  public activateContext(contexts: ContextName | ContextName[]): void {
    if (!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    validateContexts(contexts, 'mevfnGDa1MXm');

    for (const context of contexts) {
      if (!this.activeContexts_.includes(context)) {
        this.activeContexts_.push(context);
      }
    }

    this.processChanges_();
  }

  /**
   * Sets new active contexts, overriding the previous value.
   *
   * @throws If any of the context names is invalid. Context name must not start with '!'.
   */
  public setActiveContexts(contexts: ContextName[]) {
    validateContexts(contexts, 'Op1i3F4Reh84');
    this.activeContexts_ = [...contexts];
    this.processChanges_();
  }

  public deactivateContext(contexts: ContextName | ContextName[]): void {
    if (!Array.isArray(contexts)) {
      contexts = [contexts];
    }

    for (const context of contexts) {
      const index = this.activeContexts_.indexOf(context);

      if (index !== -1) {
        this.activeContexts_.splice(index, 1);
      }
    }

    this.processChanges_();
  }

  /**
   * Handles the `keydown` event to process keyboard shortcuts.
   *
   * If the `noAutoBind` was used it must be bound manually with `EventTarget.addEventListener`.
   * This also makes it possible to create several instaces to handle different DOM elements.
   *
   * @returns a boolean indicating whether any shortcut handler has fired.
   */
  public handleKeydown = (e: KeyboardEvent): boolean => {
    // This is an optimization to minimize processing while typing text. When there are no modifiers
    // used (except Shift) and the key is not one of the special "NON_TYPING_KEYS" only process
    // further when it's known that there are any active "non modifier" shortcuts. A shortcut that
    // uses only shift is also treated as a non-modifier shortcut while NON_TYPING_KEYS are never
    // treated as a non-modifier shortcut (the idea of this is that non-modifier shortcuts on
    // letters are rarely used, but Escape or F-keys can be bound frequently).
    if (
      this.hasNoModShortcutsInActiveCtx_
      || e.ctrlKey || e.metaKey || e.altKey // no shift!
      || NON_TYPING_KEYS.includes(e.code)
    ) {
      const keyShortcuts = [
        ...(this.shortcuts_.get(`code:${e.code}`) || []),
        ...(this.shortcuts_.get(getShortcutKey(e.key, e.code)) || []),
      ];

      if (typeof keyShortcuts !== 'undefined' && keyShortcuts.length > 0) {
        return this.processShortcut_(e, keyShortcuts);
      }
    }

    return false;
  };

  // Note that it must not be the ECMAScript private field # as it's used in tests
  private processShortcut_(e: KeyboardEvent, keyShortcuts: Shortcut<ContextName>[]): boolean {
    let shortcutFired = false;
    const modifiers = getModifiers(e);

    for (const shortcut of keyShortcuts) {
      if (
        checkModifiersMatch(modifiers, shortcut.mod || false, this.platform_)
        && checkContext(this.activeContexts_, shortcut.context)
      ) {
        shortcut.handler.call(null, e);

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        shortcutFired = true;
        // Note that multiple handlers for the same key combinations are allowed - do not break.
      }
    }

    return shortcutFired;
  }

  private registerShortcuts(shortcuts: Shortcut<ContextName>[]): void {
    for (const shortcut of shortcuts) {
      const mods = getArrayFromProp(shortcut.mod);

      for (const mod of mods) {
        if (!SUPPORTED_MODIFIERS.includes(mod)) {
          throw new Error(`Invalid modifier ${mod}`);
        }

        // Note that for code bindings that start with code: - the first letter is c and so is not
        // a symbol. That is desired - the point of disallowing binding to key with Shift is that
        // Shift changes the key so it does not make sense at all, but a direct code bind with Shift
        // does.
        if (mods.includes('shift') && isSymbol(shortcut.key.charCodeAt(0))) {
          throw new Error(`Shift is not allowed as a modifier with symbol keys (key: ${shortcut.key})`);
        }
      }
    }

    for (const shortcut of shortcuts) {
      let keyShortcuts: Shortcut<ContextName>[];

      if (this.shortcuts_.has(shortcut.key)) {
        keyShortcuts = this.shortcuts_.get(shortcut.key)!;
      }
      else {
        keyShortcuts = [];
        this.shortcuts_.set(shortcut.key, keyShortcuts);
      }

      keyShortcuts.push({
        key: shortcut.key,
        handler: shortcut.handler,
        mod: dedupe(getArrayFromProp(shortcut.mod)),
        context: shortcut.context !== false
          ? dedupe(getArrayFromProp<ShortcutContextName<ContextName>>(shortcut.context))
          : false,
      });
    }

    this.processChanges_();
  }

  private processChanges_(): void {
    this.hasNoModShortcutsInActiveCtx_ = hasNoModShortcuts(this.shortcuts_, this.activeContexts_);
  }
}

function getArrayFromProp<T>(prop: T[] | T | undefined, defaultValue?: T): T[] {
  return Array.isArray(prop)
    ? prop
    : typeof prop !== 'undefined'
      ? [prop]
      : typeof defaultValue !== 'undefined'
        ? [defaultValue] : [];
}

function isSymbol(charCode: number): boolean {
  return (
    charCode >= 32 && charCode <= 47
    || charCode >= 91 && charCode <= 96
    || charCode >= 123 && charCode <= 126
    || charCode >= 160 && charCode <= 191
  );
}

function getModifiers(e: KeyboardEvent): Array<Exclude<Modifier, 'system'>> {
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

function validateContexts(contexts: string[], trace: string): void {
  for (const context of contexts) {
    if (context.startsWith('!')) {
      throw new Error(`Context value must not start with '!' [${trace}]`);
    }
  }
}

function checkModifiersMatch(
  input: Array<Exclude<Modifier, 'system'>>,
  target: Modifier | Modifier[] | false,
  platform: Platform,
) : boolean {
  if (target === false) {
    return input.length === 0;
  }

  if (!Array.isArray(target)) {
    target = [target];
  }

  target = [...target];

  if (target.includes('system')) {
    target.splice(target.indexOf('system'), 1);

    if (platform === Platform.macos) {
      if (!target.includes('meta')) {
        target.push('meta');
      }
    }
    else if (!target.includes('ctrl')) {
      target.push('ctrl');
    }
  }

  if (input.length !== target.length) {
    return false;
  }

  // No match if the input does not have a modifier required by the shortcut
  for (const mod of target) {
    if (!input.includes(mod as Exclude<Modifier, 'system'>)) {
      return false;
    }
  }

  // No match if the input has a modifier that is not required by the shortcut
  for (const mod of input) {
    if (!target.includes(mod)) {
      return false;
    }
  }

  return true;
}

function checkContext(
  activeContexts: string[],
  inputContext?: string | string[] | false,
): boolean {
  if (typeof inputContext === 'undefined' || inputContext === false) {
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
function hasNoModShortcuts(
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

      if (
        typeof shortcut.mod === 'undefined'
        // Shift is not treated as a modifier here since it plays a frequent role when typing
        // text.
        || shortcut.mod === 'shift'
        || (Array.isArray(shortcut.mod) && (
          shortcut.mod.length === 0
          || shortcut.mod.filter((mod) => mod !== 'shift').length === 0
        ))
      ) {
        return true;
      }
    }
  }

  return false;
}
