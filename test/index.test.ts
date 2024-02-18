/* eslint-disable object-curly-newline, no-new */

import { Platform, KeyboardShortcuts, type Modifier } from 'src';

function dispatchKeydown(key: string, code: string, modifiers: Array<Exclude<Modifier, 'system'>> = []): void {
  const eventProperties: Partial<KeyboardEvent> = {
    key,
    code,
  };

  for (const mod of modifiers) {
    // @ts-expect-error Assign to read-only properties
    eventProperties[`${mod}Key`] = true;
  }

  window.dispatchEvent(new KeyboardEvent('keydown', eventProperties));
}

describe('Shortcut handling', () => {
  describe('General', () => {
    test('A shortcut fires with no modifiers', () => {
      let a = 0;
      let b = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          {
            key: 'A',
            handler() { a += 1; },
          },
          {
            key: 'A',
            handler() { b += 1; },
            mod: [],
          },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA');
      expect(a).toBe(1);
      expect(b).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for each modifier', () => {
      let ctrl = 0;
      let meta = 0;
      let alt = 0;
      let shift = 0;
      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
          { key: 'A', mod: ['alt'], handler() { alt += 1; } },
          { key: 'A', mod: ['meta'], handler() { meta += 1; } },
          { key: 'A', mod: ['shift'], handler() { shift += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['alt']);
      dispatchKeydown('a', 'KeyA', ['meta']);
      dispatchKeydown('a', 'KeyA', ['shift']);

      expect(ctrl).toBe(1);
      expect(meta).toBe(1);
      expect(alt).toBe(1);
      expect(shift).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for multiple modifiers', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'shift'], handler() { fireCount += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['shift', 'ctrl']);
      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('2 identical key handlers fire in the order they were added', () => {
      const result: number[] = [];

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['shift'], handler() { result.push(0); } },
          { key: 'A', mod: ['shift'], handler() { result.push(1); } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['shift']);
      expect(result).toEqual([0, 1]);

      sh.destroy();
    });

    test("A shortcut bound with 'code:' prefix' binds to the code value of the event", () => {
      let fired = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          {
            key: 'code:KeyA',
            handler() { fired += 1; },
          },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('m', 'KeyA');
      expect(fired).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for the QWERTY equivalent (code value) of a non-Latin key', () => {
      let fired = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          {
            key: 'W',
            handler() { fired += 1; },
          },
        ],
        platform: Platform.linux,
      });

      // Greek layout example
      dispatchKeydown('ς', 'KeyW');
      expect(fired).toBe(1);

      sh.destroy();
    });
  });

  describe('Non-firing', () => {
    test("A shortcut does not fire if it's key was not used", () => {
      let fired = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          {
            key: 'N',
            handler() { fired += 1; },
          },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA');
      expect(fired).toBe(0);

      sh.destroy();
    });

    test('A shortcut does not fire if its modifier is not present', () => {
      let ctrl = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['alt']);

      expect(ctrl).toBe(0);

      sh.destroy();
    });

    test('A shortcut does not fire for a superfluous modifier', () => {
      let ctrl = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'alt']);

      expect(ctrl).toBe(0);

      sh.destroy();
    });

    test('A shortcut bound to no modifier does not fire if a modifier is present', () => {
      let fired = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          {
            key: 'A',
            handler() { fired += 1; },
          },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);
      expect(fired).toBe(0);

      sh.destroy();
    });
  });

  describe('Context', () => {
    test('A shortcut fires in any context', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; } },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: false },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: [] },
        ],
        platform: Platform.linux,
        activeContexts: ['test'],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);

      expect(fireCount).toBe(3);

      sh.destroy();
    });

    test('a shortcut fires only in specific contexts', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: 'test' },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: ['test2'] },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']); // 0

      sh.activateContext('test');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 1

      sh.activateContext('test2');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 2

      expect(fireCount).toBe(3);

      sh.destroy();
    });

    test('a shortcut never fires in specific contexts', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: '!test' },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: ['test', '!test2'] },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']); // #1

      sh.activateContext('test');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // #2

      sh.activateContext('test2');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 0

      expect(fireCount).toBe(2);

      sh.destroy();
    });
  });

  describe('The system modifier', () => {
    test('A shortcut fires for the system modifier', () => {
      let ctrl = 0;
      let meta = 0;

      const sh1 = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { ctrl += 1; } },
        ],
        platform: Platform.linux,
      });

      const sh2 = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { meta += 1; } },
        ],
        platform: Platform.macos,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['meta']);

      expect(ctrl).toBe(1);
      expect(meta).toBe(1);

      sh1.destroy();
      sh2.destroy();
    });

    test('ctrl + system = ctrl on systems other than Mac OS', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'system'], handler() { fireCount += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('meta + system = meta on Mac OS', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['meta', 'system'], handler() { fireCount += 1; } },
        ],
        platform: Platform.macos,
      });

      dispatchKeydown('a', 'KeyA', ['meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('meta + system = meta + ctrl on systems other than Mac OS', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['meta', 'system'], handler() { fireCount += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('ctrl + system = ctrl + meta on Mac OS', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'system'], handler() { fireCount += 1; } },
        ],
        platform: Platform.macos,
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });
  });

  describe('Typing optimization', () => {
    test('Shortcuts are not processed while typing if there are no shortcuts without modifiers', () => {
      let fired = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', handler() { fired += 1; }, mod: ['ctrl'] },
        ],
        platform: Platform.linux,
      });

      // @ts-expect-error Accessing private method
      const originalProcessShortcut = sh.processShortcut_;

      const processShortcut = jest.fn(
        (...args: Parameters<KeyboardShortcuts<string>['processShortcut_']>) => originalProcessShortcut.call(sh, ...args),
      );

      // @ts-expect-error Overriding private method with the mock.
      sh.processShortcut_ = processShortcut;

      dispatchKeydown('a', 'KeyA');
      expect(processShortcut).not.toHaveBeenCalled();

      // Control to ensure that the call detection is setup properly
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      expect(processShortcut).toHaveBeenCalled();

      expect(fired).toBe(1);

      sh.destroy();
    });

    // This needs to be an isolated case to ensure that the typing optimization does not interfere
    // with the shortcut.
    test('A shortcut fires for the shift modifier (as the only shortcut bound)', () => {
      let shift = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'A', mod: ['shift'], handler() { shift += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('a', 'KeyA', ['shift']);
      expect(shift).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for non-typing keys', () => {
      let fireCount = 0;

      const sh = new KeyboardShortcuts({
        shortcuts: [
          { key: 'Escape', handler() { fireCount += 1; } },
          { key: 'F1', handler() { fireCount += 1; } },
          { key: 'F12', handler() { fireCount += 1; } },
          { key: 'PrintScreen', handler() { fireCount += 1; } },
          { key: 'Insert', handler() { fireCount += 1; } },
        ],
        platform: Platform.linux,
      });

      dispatchKeydown('Escape', 'Escape');
      dispatchKeydown('F1', 'F1');
      dispatchKeydown('F12', 'F12');
      dispatchKeydown('PrintScreen', 'PrintScreen');
      dispatchKeydown('Insert', 'Insert');

      expect(fireCount).toBe(5);

      sh.destroy();
    });
  });
});

describe('Management', () => {
  test('The handler is bound manually', () => {
    let fired = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { fired += 1; },
        },
      ],
      platform: Platform.linux,
      noAutoBind: true,
    });

    dispatchKeydown('a', 'KeyA');
    window.addEventListener('keydown', sh.handleKeydown);
    dispatchKeydown('a', 'KeyA');

    expect(fired).toBe(1);

    window.removeEventListener('keydown', sh.handleKeydown);
    sh.destroy();
  });

  test('destroy() unbinds the handler if it was automatically added', () => {
    let fired = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { fired += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    sh.destroy();
    dispatchKeydown('a', 'KeyA');
    expect(fired).toBe(1);
  });

  test('Initializes with a context value', () => {
    let fireCount = 0;

    const sh = new KeyboardShortcuts<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { fireCount += 1; }, context: 'a' },
      ],
      platform: Platform.linux,
      activeContexts: ['a'],
    });

    dispatchKeydown('a', 'KeyA');
    expect(fireCount).toBe(1);

    sh.destroy();
  });

  test('New active contexts are addded', () => {
    let a = 0;
    let b = 0;

    const sh = new KeyboardShortcuts<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
      platform: Platform.linux,
      activeContexts: ['a'],
    });

    dispatchKeydown('a', 'KeyA');
    sh.activateContext('b', 'c');
    dispatchKeydown('a', 'KeyA');

    expect(sh.getActiveContexts()).toEqual(['a', 'b', 'c']);
    expect(a).toBe(2);
    expect(b).toBe(1);

    sh.destroy();
  });

  test('Active contexts are set', () => {
    let a = 0;
    let b = 0;

    const sh = new KeyboardShortcuts<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
      platform: Platform.linux,
      activeContexts: ['a'],
    });

    dispatchKeydown('a', 'KeyA');
    sh.setActiveContexts('b', 'c');
    dispatchKeydown('a', 'KeyA');

    expect(sh.getActiveContexts()).toEqual(['b', 'c']);
    expect(a).toBe(1);
    expect(b).toBe(1);

    sh.destroy();
  });

  test('Contexts are deactivated', () => {
    let a = 0;
    let b = 0;

    const sh = new KeyboardShortcuts<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
      platform: Platform.linux,
      activeContexts: ['a', 'b'],
    });

    dispatchKeydown('a', 'KeyA');
    sh.deactivateContext('a');
    dispatchKeydown('a', 'KeyA');

    expect(sh.getActiveContexts()).toEqual(['b']);
    expect(a).toBe(1);
    expect(b).toBe(2);

    sh.destroy();
  });

  test('New shortcuts are added', () => {
    let fired = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');

    sh.add([
      {
        key: 'A',
        handler() { fired += 1; },
      },
    ]);

    dispatchKeydown('a', 'KeyA');
    expect(fired).toBe(1);

    sh.destroy();
  });

  test('All shortcuts are removed', () => {
    let a = 0;
    let b = 0;
    let c = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { a += 1; },
        },
        {
          key: 'a',
          handler() { b += 1; },
        },
        {
          key: 'C',
          handler() { c += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');
    sh.remove(() => true);
    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(1);

    sh.destroy();
  });

  test('Shortcuts are removed by key (with the special argument)', () => {
    let a = 0;
    let b = 0;
    let c = 0;

    // Those are multiple test cases in one to avoid polution of the suite. Shortcut removal already
    // occupies a disproporionate amount of test cases.

    let sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { a += 1; },
        },
        {
          key: 'a',
          handler() { b += 1; },
        },
        {
          key: 'C',
          handler() { c += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');
    sh.remove(() => true, 'a');
    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    sh.destroy();

    // Uppercase key

    a = 0;
    b = 0;
    c = 0;

    sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { a += 1; },
        },
        {
          key: 'a',
          handler() { b += 1; },
        },
        {
          key: 'C',
          handler() { c += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');
    sh.remove(() => true, 'A'); // Uppercase
    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    sh.destroy();

    // Array input

    a = 0;
    b = 0;
    c = 0;

    sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { a += 1; },
        },
        {
          key: 'a',
          handler() { b += 1; },
        },
        {
          key: 'C',
          handler() { c += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');
    sh.remove(() => true, ['A']); // Array
    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    sh.destroy();

    // Special keys and code values

    a = 0;
    let escape = 0;
    let codeW = 0;

    sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'Escape',
          handler() { escape += 1; },
        },
        {
          key: 'code:KeyW',
          handler() { codeW += 1; },
        },
        {
          key: 'A',
          handler() { a += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    sh.remove(() => true, 'Escape');

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    sh.remove(() => true, 'code:KeyW');

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    expect(escape).toBe(1);
    expect(codeW).toBe(2);
    expect(a).toBe(3);

    sh.destroy();
  });

  test('Shortcuts are removed by key (with the anti-filter function)', () => {
    let a = 0;
    let b = 0;
    let c = 0;

    let sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { a += 1; },
        },
        {
          key: 'a',
          handler() { b += 1; },
        },
        {
          key: 'C',
          handler() { c += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');
    sh.remove((s) => s.key === 'A');
    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('c', 'KeyC');

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(2);

    sh.destroy();

    // Special keys and code values

    a = 0;
    let escape = 0;
    let codeW = 0;

    sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'Escape',
          handler() { escape += 1; },
        },
        {
          key: 'code:KeyW',
          handler() { codeW += 1; },
        },
        {
          key: 'A',
          handler() { a += 1; },
        },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    sh.remove((s) => s.key === 'Escape');

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    sh.remove((s) => s.key === 'code:KeyW');

    dispatchKeydown('Escape', 'Escape');
    dispatchKeydown('w', 'KeyW');
    dispatchKeydown('a', 'KeyA');

    expect(escape).toBe(1);
    expect(codeW).toBe(2);
    expect(a).toBe(3);

    sh.destroy();
  });

  test('Shortcuts are removed by modifier', () => {
    let ctrl = 0;
    let alt = 0;
    let noMod = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [
        {
          key: 'A',
          handler() { ctrl += 1; },
          mod: ['ctrl'],
        },
        {
          key: 'A',
          handler() { noMod += 1; },
        },
        {
          key: 'A',
          handler() { alt += 1; },
          mod: ['alt'],
        },
      ],
      platform: Platform.linux,
    });

    // Expecting to not have an effect
    sh.remove((s) => KeyboardShortcuts.modifiersMatch(s, ['alt', 'ctrl']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);

    sh.remove((s) => KeyboardShortcuts.modifiersMatch(s, ['ctrl']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);

    sh.remove((s) => KeyboardShortcuts.modifiersMatch(s, ['alt']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);
    sh.remove((s) => KeyboardShortcuts.modifiersMatch(s, []));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);

    expect(ctrl).toBe(1);
    expect(alt).toBe(2);
    expect(noMod).toBe(3);

    sh.destroy();
  });

  test('Shortcuts are removed by handler', () => {
    let a = 0;
    let b = 0;

    const handler = () => {
      a += 1;
    };

    const sh = new KeyboardShortcuts({
      shortcuts: [
        { handler, key: 'A' },
        { handler() { b += 1; }, key: 'A' },
      ],
      platform: Platform.linux,
    });

    dispatchKeydown('a', 'KeyA');

    sh.remove((s) => s.handler === handler);

    dispatchKeydown('a', 'KeyA');

    expect(a).toBe(1);
    expect(b).toBe(2);

    sh.destroy();
  });

  test('Shortcuts are removed by context', () => {
    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;
    let e = 0;

    const sh = new KeyboardShortcuts({
      shortcuts: [
        { key: 'A', mod: ['ctrl'], handler() { a += 1; }, context: 'test' },
        { key: 'A', mod: ['ctrl'], handler() { b += 1; }, context: ['test2'] },
        { key: 'A', mod: ['ctrl'], handler() { c += 1; }, context: [] },
        { key: 'A', mod: ['ctrl'], handler() { d += 1; }, context: false },
        { key: 'A', mod: ['ctrl'], handler() { e += 1; } },
      ],
      platform: Platform.linux,
      activeContexts: ['test', 'test2'],
    });

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    sh.remove((s) => s.context.includes('test'));

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    sh.remove((s) => s.context.includes('test2'));

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    sh.remove((s) => s.context.length === 0);

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    expect(a).toBe(1);
    expect(b).toBe(2);
    expect(c).toBe(3);
    expect(d).toBe(3);
    expect(e).toBe(3);

    sh.destroy();
  });

  describe('Errors', () => {
    test('An error is thrown when registering a symbol key shortcut with Shift modifier', () => {
      let errorCount = 0;

      try {
        new KeyboardShortcuts({
          shortcuts: [
            { key: '|', mod: ['shift'], handler: jest.fn },
          ],
          platform: Platform.linux,
        });
      }
      catch {
        errorCount += 1;
      }

      try {
        new KeyboardShortcuts({
          shortcuts: [
            { key: '#', mod: ['shift', 'ctrl'], handler: jest.fn },
          ],
          platform: Platform.linux,
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new KeyboardShortcuts({
        shortcuts: [
        ],
        platform: Platform.linux,
      });

      try {
        sh.add([
          { key: '}', mod: ['shift', 'ctrl'], handler: jest.fn },
        ]);
      }
      catch {
        errorCount += 1;
      }

      // Expecting not - code bindings are allowed.
      try {
        sh.add([
          { key: 'code:Backquote', mod: ['shift', 'ctrl'], handler: jest.fn },
        ]);
      }
      catch {
        errorCount += 1;
      }

      expect(errorCount).toBe(3);

      sh.destroy();
    });

    test('An error is thrown when registering a shortcut with an invalid modifier value', () => {
      let errorCount = 0;

      try {
        new KeyboardShortcuts({
          shortcuts: [
            // @ts-expect-error For testing purposes.
            { key: 'A', mod: ['magic'], handler: jest.fn },
          ],
          platform: Platform.linux,
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new KeyboardShortcuts({
        shortcuts: [
        ],
        platform: Platform.linux,
      });

      try {
        sh.add([
          // @ts-expect-error For testing purposes.
          { key: 'A', mod: ['magic'], handler: jest.fn },
        ]);
      }
      catch {
        errorCount += 1;
      }

      expect(errorCount).toBe(2);

      sh.destroy();
    });

    test("An error is thrown when activating a context that starts with '!'", () => {
      let errorCount = 0;

      try {
        new KeyboardShortcuts({
          shortcuts: [],
          activeContexts: ['!test'],
          platform: Platform.linux,
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new KeyboardShortcuts({
        shortcuts: [],
        platform: Platform.linux,
      });

      try {
        sh.activateContext('!test');
      }
      catch {
        errorCount += 1;
      }

      try {
        sh.activateContext('test', '!test');
      }
      catch {
        errorCount += 1;
      }

      try {
        sh.setActiveContexts('test', '!test');
      }
      catch {
        errorCount += 1;
      }

      expect(errorCount).toBe(4);

      sh.destroy();
    });
  });
});
