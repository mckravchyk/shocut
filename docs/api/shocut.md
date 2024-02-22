# Class: Shocut

Registers and handles keyboard shortcuts.

## `new Shocut(options)`

* `options` [Options](structures/options.md) (optional)

## Instance Methods

### `.destroy()`

Removes all shortcuts and other data. Unbinds the keydown handler if it was automatically attached (if the handler was attached manually it will not be automatically removed).

### `.getActiveContexts()`

Returns `string[]` - the contexts that are currently active

### `.activateContext(...contexts)`

* `...contexts` string[] - the contexts to activate

Activates specified context names.

### `.setActiveContexts(...contexts)`

* `...contexts` string[] - new active contexts

Sets new active contexts, overriding the previous ones.

### `.deactivateContext(...contexts)`

* `...contexts` string[]  - the contexts to deactivate

Deactivates context(s)

### `.add(shortcuts)`

* `shortcuts` [ShortcutOptions](./structures/shortcut_options.md)[]

Adds new shortcuts.

### `.remove(removeShortcut, keys?)`

* `removeShortcut(shortcut)` function - An anti-filter function that indicates whether the shortcut is to be removed.
  * `shortcut` [Shortcut](./structures/shortcut.md)
  * Returns `boolean` indicating whether the shortcut is to be removed
* `keys` string | string[] (optional) - Run `removeShortcut` only for shortcuts registered for the particular keys rather than all, sparing unnecessary processing. The keys are case insensitive (unlike processing of [Shortcut](./structures/shortcut.md) in `removeShortcut`!).

Removes shortcuts that match the `removeShortcut` anti-filter callback and optionally, `keys`. It works opposite to the `Array.prototype.filter`.

Use `Shocut.modifiersMatch` to evaluate a shortcut by its modifiers.

NOTE: Single letter keys are always stored in upper case regardless of the original input data
and upper case letters must be used for comparison in `removeShortcut`. In the majority of
cases it would just suffice to use the `keys` argument which does not care about the case.

### `.handleKeydown(e)`

* `e` [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)

Returns `boolean` - indicates whether any shortcut handler has fired.

It is used internally to handle `keydown` on the `window` target by default. If the `noAutoBind` [option](./structures/options.md) has been set it must be called / bound manually to handle the event.

It is also possible to bind it to targets other than `window` or even create multiple instances, each being bound to handle the keydown event on a different target.

## Static Methods

### `Shocut.getShortcutKey(key, code)`

See [get_shortcut_key()](./shortcut_key.md)

### `Shocut.getSystemMod()`

Returns `string` - `'ctrl'` or `'meta'`

Gets the default modifier for keyboard shortcuts on the OS by reading data made available in `window.navigator`

This method is used by default if the `systemMod` [option](./structures/options.md) is not set.

### `Shocut.modifiersMatch(shortcut, modifiers)`

* `shortcut` [Shortcut](./structures/shortcut.md)
* `modifiers` string[] - Array of modifiers. Use empty array to test for no modifiers.

Returns `boolean`

Checks whether `modifiers` match those of the `shortcut`. It is meant to be used in the `.remove()` callback to remove shortcuts by their modifier.
