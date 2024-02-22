# Interface: ShortcutOptions

## `key` string

The key to trigger the shortcut. Only one key is allowed sans modifiers.

By default this is the key that matches [KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
with the exception that if the property is a letter, it will always be upper case and if it is
a non Latin alphabet letter it will be translated to a Latin letter per QWERTY layout - see
`get_shortcut_key` for more detail about the latter.

It is also possible to bind to [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
which is facilitated by prefixing the key with `'code:'`, i.e. `'code:Backquote'`. Binding to
`code` may be necessary for some symbol keys, i.e. for Ctrl + \` on a standard QWERTY layout
the code will be `'Backquote'` but the key will be `'Unidentified'`. A shortcut handler bound
with code value will always take priority over a regular key.

## `mod` string | string[] (optional)

A modifier key or multiple modifier keys that must be present at the same time to trigger the
shortcut. Note that if a modifier is not specified the shortcut will not trigger when present,
i.e. a shortcut for Ctrl+S will not trigger if Ctrl+Shift+S were pressed.

Allowed values are:
* `'system'` - a virtual modifier that maps to whatever modifier is defined as the `systemMod` in [the constructor options](./options.md)
* `'ctrl` - the Control key
* `'meta'` - the Meta key (this is the Command key on Mac OS)
* `'alt'` - the Alt key
* `'shift'` - the Shift key

## `handler` function
* `this` [Shocut](../shocut.md)
* `e` [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)

The function to handle the shortcut.

## `context` string | (string|string[])[] | function | false (optional)

Defines in which contexts the shortcut is allowed to fire:

1. If not set, `false` or an empty array the shortcut will apply in any context.

2. If function - a function that accepts active contexts as its only parameter evaluates
whether the shortcut should fire by returning a boolean value.

3. If string, the shortcut will either apply only if the context is set or never apply if the
context is active if the context name has been preceeded with ! (a negation).

4. If one dimensional array, an OR relation applies for all specified contexts i.e.
`['context1', 'context2', '!context3', '!context4']` means `'fire when context1 OR context2 OR
not-context3 OR not-context4'`

5. If an inner array is used contexts specified within will be subject to an AND relation with
each other. I.e.
`[['context1', 'context2', '!context3', '!context4']]` means `'fire if context1 AND context2
AND not-context3 AND not-context4'`.

6. Individual AND relations can be joined by OR per the rules of #4.

## `noDefaultPrevent` boolean (optional)

If set, the default action will not be prevented when a matching handler fires.

## `noPropagationStop` boolean (optional)

If set, the propagation will not be stopped when a matching handler fires and the event will bubble up.