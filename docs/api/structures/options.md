# Interface: Options

[Shocut](../shocut.md) constructor options

## `shortcuts` [ShortcutOptions](./shortcut_options.md)[] (optional)

The keyboard shortcuts to register.

## `systemMod` string (optional)

The physical modifier to use for the special `'system'` shortcut modifier value. It is expected to be `'meta'` on Mac OS and `'ctrl'` on other systems. Any modifier value is allowed except `'system'` (see [ShortcutOptions](./shortcut_options.md) for valid modifier values).

If not provided, Shocut will do its own feature detection based on the data made available in `window.navigator` property, which is NOT 100% reliable.

In Electron apps it is recommended to pass this value manually based on the data that is provided by Electron APIs.

## `activeContexts` string[] (optional)

Initial active contexts

## `noAutoBind` boolean (optional)

If enabled the keydown handler will not be bound automatically, requiring to bind / call `Shocut.handleKeydown` manually. This is useful if you want to preprocess the event, make Shocut a part of the existing keydown handling logic or even bind multiple Shocut instances to different focusable elements.