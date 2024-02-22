# Examples

## The system modifier

The system modifier is the default modifier for keyboard shortcuts on the OS. On Mac OS this would be the command key (the meta key) while on other systems it is the control key.

Shocut will attempt to detect this modifier key automatically but it is also possible to declare it with `systemMod` property of [Options](./api/structures/options.md) and this is recommended if more accurate OS data is made available by the environment (i.e. Electron).

By using the system modifier we can follow the OS convention for the shortcuts.

The following code will register a shortcut for cmd+K on Mac OS and ctrl+K on other systems:

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['system'],
      handler() { alert('You have pressed MOD + K'); },
    },
  ],
});
```

## Contexts

The `context` property of [ShortcutOptions](./api/structures/shortcut_options.md) allows to define OR / AND rules for contexts configurations that the shortcut is allowed to fire.

Elements in the outer array are subject to OR relation, while the inner array enforces AND. Context name can be prefixed with '!' to indicate a negation.

### Fire only if either 'context1' or 'context2' is active

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
      context: ['context1', 'context2'],
    },
  ],
  activeContexts: ['context1'],
});
```

### Fire only if both 'context1' and 'context2' are active

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
      context: [['context1', 'context2']], // Notice the double array
    },
  ],
  activeContexts: ['context1'],
});

// Activating a context
shocut.activateContext('context2');
```

### Never fire if 'context1' is active

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
      context: ['!context1'],
    },
  ],
  activeContexts: ['context1'],
});

// Deactivating a context
shocut.deactivateContext('context1');
```

### Fire in 'context1' or 'context2' but never 'context3'

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
      context: [['context1', '!context3'], ['context2', '!context3']],
    },
  ],
});

// Activating multiple contexts
shocut.activateContext('context1', 'context2');
```

### Using a callback function

It is also possible to use a callback function to determine if the shortcut should fire.

```ts
import { Shocut } from 'shocut';

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() { alert('You have pressed Ctrl + K'); },
      context: (activeContexts) => activeContexts.includes('context1'),
    },
  ],
});
```


## Combo Shortcuts

It's possible to use the contexts feature to define combo shortcuts such as Ctrl+K, V where the shortcut will fire only if the combination has been triggered.

```ts
import { Shocut } from 'shocut';

let modeTimer = 0;

const shocut = new Shocut({
  shortcuts: [
    {
      key: 'K',
      mod: ['ctrl'],
      handler() {
        clearTimeout(modeTimer);
        this.activateContext('Ctrl+K');
        modeTimer = setTimeout(() => { this.deactivateContext('Ctrl+K');}, 200);
      }
    },
    {
      key: 'V',
      mod: [],
      context: ['Ctrl+K'],
      handler() { alert('You have pressed Ctrl+K, V'); }
    },
  ],
});

```

There are no limits on the amount of shortcut combinations, although you would probably want to limit them to two. Unless you want to add cheat codes to your app :)