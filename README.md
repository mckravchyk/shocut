# Shocut

Shocut is a fast keyboard shortcuts (hotkey) library for web based renderers (web apps and Electron apps). 

## Key Features:
- Multi-context support: set any number of contexts that can be active and define shortcuts that can only fire in certain contexts and / or never fire fire in certain contexts. Supports both AND and OR rules and makes it possible to define shortcut combos (i.e. Ctrl+K, V).
- Fast: Shocut is not only lightweight but ensures that minimal resources are used while typing. If all shortcuts in the active contexts are bound with modifier keys (except special keys like Escape or F-keys), Shocut will immediately skip processing regular typing keystrokes since they are sure to not trigger any shortcuts.
- i18n friendly - [supports non-Latin alphabet layouts well](https://www.kravchyk.com/keyboard-shortcuts-on-non-latin-alphabet-layouts/) by falling back to the physical QWERTY code value when a non-Latin alphabet letter is pressed while still respecting custom Latin alphabet keyboard layouts like Dvorak. 
- A virtual 'system' modifier that maps to the command key on Mac OS and the control key on other systems allowing to easily define keyboard shortcuts that respect the OS's convention.
- 0 dependencies

## Installation

```
npm install shocut --save
```

## Basic Usage

```ts
import { Shocut } from 'shocut';

const sh = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
    },
  ],
});
```

## Documentation and Examples

- [API Documentation](./docs/api/)
- [Examples](./docs/examples.md)

## Browser Support

Shocut is available as an ES2015 bundle and needs to go through further transpilation to target older browsers which should be handled by your bundler.

Besides transpilation, you must ensure the following APIs are polyfilled to support older browsers:
- `Array.prototype.includes`
- `Map.prototype.entries`
