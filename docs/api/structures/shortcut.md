# Interface: Shortcut extends [ShortcutOptions](./shortcut_options.md)

Shortcut data as stored internally and exposed in the anti-filter callback parameter of `Shocut.remove`

It is simplified [ShortcutOptions](./shortcut_options.md):
- `string` values are simplified to an array of 1 if the option accepts an array
- Unset booleans are simplified to `false`
- Unset / `false` arrays are simplified to an empty array `[]`
- `key` is always uppercase if it is a single character
- Modifier names in `mod` are always lowercase

## `mod` string[]

## `context` (string | string[])[] | function

## `noDefaultPrevent` boolean

## `noPropagationStop` boolean
