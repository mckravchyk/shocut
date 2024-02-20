import { getShortcutKey } from 'keyboard-shortcuts-i18n';
import { dedupe, haveSameValues } from './lib/array';

import {
  checkContext,
  checkModifiersMatch,
  getArrayFromProp,
  getModifiers,
  hasNoModShortcuts,
  isSymbol,
  processShortcutContext,
  sanitizeKeyValue,
  validateContexts,
} from './functions';

const SUPPORTED_MODIFIERS = ['system', 'ctrl', 'meta', 'alt', 'shift'] as const;

/**
 * Shortcut modifier key:
 * - system - the default modifier key for standard keyboard shortcuts on the OS. It is defined by
 * the `systemMod` constructor property, which if not set, defaults to `'meta'` (command) on Mac OS
 * and `'ctrl'` on other systems.
 * - alt - the option key on Mac OS and alt key on other platforms
 * - ctrl - the control key
 * - meta - the command key on Macs or the Windows logo button on other computers
 */
export type Modifier = typeof SUPPORTED_MODIFIERS[number];

// eslint-disable-next-line max-len
export type ShortcutMap<ContextName extends string> = Map<string /* key */, Shortcut<ContextName>[]>;

export type ShortcutContext<ContextName extends string> = ContextName | `!${ContextName}`;

/**
 * The arguments for registering a shortcut.
 */
export interface ShortcutArgs<ContextName extends string> {
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

  handler: (this: Shocut<ContextName>, e: KeyboardEvent) => void

  /**
   * Defines in which contexts the shortcut is allowed to fire:
   *
   * #1 If not set, `false` or an empty array the shortcut will apply in any context.
   *
   * #2 If function - the function will evaluate whether the shortcut should fire taking active
   * contexts as its input.
   *
   * #3 If string, the shortcut will either apply only if the context is set or never apply if the
   * context is active if the context name has been preceeded with ! (a negation).
   *
   * #4 If one dimensional array, an OR relation applies for all specified contexts i.e.
   * `['context1', 'context2', '!context3', '!context4']` means `'fire when context1 OR context2 OR
   * not-context3 OR not-context4'`
   *
   * #5 If an inner array is used contexts specified within will be subject to an AND relation with
   * each other. I.e.
   * `[['context1', 'context2', '!context3', '!context4']]` means `'fire if context1 AND context2
   * AND not-context3 AND not-context4'`.
   *
   * #6 Individual AND relations can be joined by OR per the rules of #3.
   */
  context?: ShortcutContext<ContextName>
  | Array<ShortcutContext<ContextName> | ShortcutContext<ContextName>[]>
  | ((activeContexts: ContextName[]) => boolean)
  | false
}

/**
 * The shortcut properties as stored internally.
 */
export interface Shortcut<ContextName extends string> extends ShortcutArgs<ContextName> {
  key: string

  mod: Modifier[]

  handler: (this: Shocut<ContextName>, e: KeyboardEvent) => void

  context: Array<ShortcutContext<ContextName> | ShortcutContext<ContextName>[]>
  | ((activeContexts: ContextName[]) => boolean)
}

export interface Args<ContextName extends string> {
  shortcuts: ShortcutArgs<ContextName>[]

  /**
   * The modifier that will be mapped to the special `'system'` modifier to follow the default
   * keyboard shortcuts scheme on the OS.
   *
   * If not set it will be determined from `window.navigator` and set as `'meta'` if Mac OS is
   * detected or `'ctrl'` in any other case.
   */
  systemMod?: Exclude<Modifier, 'system'>

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
export const NON_TYPING_KEYS = [
  'Escape',
  ...F_KEYS,
  'PrintScreen',
  'Insert',
];

export class Shocut<ContextName extends string> {
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

  private systemMod_: Exclude<Modifier, 'system'>;

  public constructor(args: Args<ContextName>) {
    this.systemMod_ = args.systemMod || Shocut.getSystemMod();
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
  public add(shortcuts: ShortcutArgs<ContextName>[]): void {
    this.registerShortcuts(shortcuts);
  }

  /**
   * Removes shortcuts with a `removeShortuct` function that accepts the shortcut as an argument and
   * removes it if `true` is returned (works opposite to `Array.prototype.filter`).
   *
   * NOTE: Single letter keys are always stored in upper case regardless of the original input data
   * and upper case letters must be used for comparison in the filter function. In the majority of
   * cases it would just suffice to use the keyOrKeys argument which does not care about the case.
   *
   * @param keyOrKeys If set, the function will only be applied on specific keys rather than
   * processing everything. Unlike filter, this input is case insensitive.
  */
  public remove(
    removeShortcut: (shortcut: Shortcut<ContextName>) => boolean,
    keyOrKeys?: string | string[],
  ): void {
    let keys: string[] | null = null;

    if (Array.isArray(keyOrKeys)) {
      keys = keyOrKeys.map((k) => sanitizeKeyValue(k));
    }
    else if (typeof keyOrKeys === 'string') {
      keys = [sanitizeKeyValue(keyOrKeys)];
    }

    for (const [key, shortcuts] of Array.from(this.shortcuts_.entries())) {
      if (keys === null || keys.includes(key)) {
        this.shortcuts_.set(key, shortcuts.filter((v) => !removeShortcut(v)));
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
  public activateContext(...contexts: ContextName[]): void {
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
  public setActiveContexts(...contexts: ContextName[]) {
    validateContexts(contexts, 'Op1i3F4Reh84');
    this.activeContexts_ = [...contexts];
    this.processChanges_();
  }

  public deactivateContext(...contexts: ContextName[]): void {
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

  /**
   * Gets the default modifier for keyboard shortcuts on the OS by reading data made available in
   * `window.navigator`.
   */
  public static getSystemMod(): 'ctrl' | 'meta' {
    let platform = '';
    type NavigatorUaData = Navigator & { userAgentData: { platform: string } }
    const uaData = (window.navigator as NavigatorUaData).userAgentData;

    if (typeof uaData !== 'undefined' && typeof uaData.platform !== 'undefined') {
      platform = uaData.platform.toUpperCase();
    }
    else if (typeof window.navigator.platform !== 'undefined') {
      platform = window.navigator.platform.toUpperCase();
    }

    return platform.includes('MAC') ? 'meta' : 'ctrl';
  }

  /**
   * Whether the modifiers match those of the shortcut.
   *
   * @param mod Array of modifiers. Pass empty array if there are no modifiers.
   */
  public static modifiersMatch(shortcut: ShortcutArgs<string>, mod: Modifier[]): boolean {
    if (!Array.isArray(mod)) {
      mod = [mod];
    }

    let shortcutMod: Modifier[] = [];

    if (Array.isArray(shortcut.mod)) {
      shortcutMod = shortcut.mod;
    }
    else if (typeof shortcut.mod === 'string') {
      shortcutMod = [shortcut.mod];
    }
    else {
      shortcutMod = [];
    }

    return mod.length === shortcutMod.length && haveSameValues(mod, shortcutMod);
  }

  // Note that it must NOT be the ECMAScript private field # as it's used in tests
  private processShortcut_(e: KeyboardEvent, keyShortcuts: Shortcut<ContextName>[]): boolean {
    let shortcutFired = false;
    const modifiers = getModifiers(e);

    for (const shortcut of keyShortcuts) {
      if (
        checkModifiersMatch(modifiers, shortcut.mod, this.systemMod_)
        && checkContext(this.activeContexts_, shortcut.context)
      ) {
        shortcut.handler.call(this, e);

        e.preventDefault();
        e.stopPropagation();

        shortcutFired = true;
        // Note that multiple handlers for the same key combinations are allowed - do not break.
      }
    }

    return shortcutFired;
  }

  private registerShortcuts(shortcuts: ShortcutArgs<ContextName>[]): void {
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

    for (const s of shortcuts) {
      const key = sanitizeKeyValue(s.key);
      const shortcut = { ...s, key };

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
        context: processShortcutContext(shortcut.context),
      });
    }

    this.processChanges_();
  }

  private processChanges_(): void {
    this.hasNoModShortcutsInActiveCtx_ = hasNoModShortcuts(this.shortcuts_, this.activeContexts_);
  }
}
