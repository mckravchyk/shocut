/* eslint-disable object-curly-newline, no-new */

import { Shocut } from 'src';
import { dispatchKeydown } from './util';

type NavigatorUaData = Navigator & { userAgentData: { platform: string } };

// This ensures that the default platform to determine the system key is Linux. This is the primary
// method so overriding navigator.platform is not required.
(window.navigator as NavigatorUaData).userAgentData = {
  platform: 'Linux',
};

describe('Management', () => {
  test('The handler is bound manually', () => {
    let fired = 0;

    const sh = new Shocut({
      shortcuts: [
        {
          key: 'A',
          handler() { fired += 1; },
        },
      ],
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

    const sh = new Shocut({
      shortcuts: [
        {
          key: 'A',
          handler() { fired += 1; },
        },
      ],
    });

    dispatchKeydown('a', 'KeyA');
    sh.destroy();
    dispatchKeydown('a', 'KeyA');
    expect(fired).toBe(1);
  });

  test('Initializes with a context value', () => {
    let fireCount = 0;

    const sh = new Shocut<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { fireCount += 1; }, context: 'a' },
      ],
      activeContexts: ['a'],
    });

    dispatchKeydown('a', 'KeyA');
    expect(fireCount).toBe(1);

    sh.destroy();
  });

  test('New active contexts are addded', () => {
    let a = 0;
    let b = 0;

    const sh = new Shocut<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
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

    const sh = new Shocut<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
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

    const sh = new Shocut<'a' | 'b' | 'c'>({
      shortcuts: [
        { key: 'A', handler() { a += 1; }, context: 'a' },
        { key: 'A', handler() { b += 1; }, context: 'b' },
      ],
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

    const sh = new Shocut({
      shortcuts: [],
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

    const sh = new Shocut({
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

  test('The count of removed shortcuts is returned', () => {
    const sh = new Shocut({
      shortcuts: [
        {
          key: 'A',
          handler: jest.fn,
        },
        {
          key: 'a',
          handler: jest.fn,
        },
        {
          key: 'C',
          handler: jest.fn,
        },
      ],
    });

    expect(sh.remove(() => true)).toBe(3);
    sh.destroy();
  });

  test('Shortcuts are removed by key (with the special argument)', () => {
    let a = 0;
    let b = 0;
    let c = 0;

    // Those are multiple test cases in one to avoid polution of the suite. Shortcut removal already
    // occupies a disproporionate amount of test cases.

    let sh = new Shocut({
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

    sh = new Shocut({
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

    sh = new Shocut({
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

    sh = new Shocut({
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

    let sh = new Shocut({
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

    sh = new Shocut({
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

    const sh = new Shocut({
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
    });

    // Expecting to not have an effect
    sh.remove((s) => Shocut.modifiersMatch(s, ['alt', 'ctrl']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);

    sh.remove((s) => Shocut.modifiersMatch(s, ['ctrl']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);

    sh.remove((s) => Shocut.modifiersMatch(s, ['alt']));

    dispatchKeydown('a', 'KeyA');
    dispatchKeydown('a', 'KeyA', ['ctrl']);
    dispatchKeydown('a', 'KeyA', ['alt']);
    sh.remove((s) => Shocut.modifiersMatch(s, []));

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

    const sh = new Shocut({
      shortcuts: [
        { handler, key: 'A' },
        { handler() { b += 1; }, key: 'A' },
      ],
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

    const sh = new Shocut({
      shortcuts: [
        { key: 'A', mod: ['ctrl'], handler() { a += 1; }, context: 'test' },
        { key: 'A', mod: ['ctrl'], handler() { b += 1; }, context: ['test2'] },
        { key: 'A', mod: ['ctrl'], handler() { c += 1; }, context: [] },
        { key: 'A', mod: ['ctrl'], handler() { d += 1; }, context: false },
        { key: 'A', mod: ['ctrl'], handler() { e += 1; } },
      ],
      activeContexts: ['test', 'test2'],
    });

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    sh.remove((s) => Array.isArray(s.context) && s.context.includes('test'));

    dispatchKeydown('a', 'KeyA', ['ctrl']);

    sh.remove((s) => Array.isArray(s.context) && s.context.includes('test2'));

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
        new Shocut({
          shortcuts: [
            { key: '|', mod: ['shift'], handler: jest.fn },
          ],
        });
      }
      catch {
        errorCount += 1;
      }

      try {
        new Shocut({
          shortcuts: [
            { key: '#', mod: ['shift', 'ctrl'], handler: jest.fn },
          ],
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new Shocut({
        shortcuts: [],
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
        new Shocut({
          shortcuts: [
            // @ts-expect-error For testing purposes.
            { key: 'A', mod: ['magic'], handler: jest.fn },
          ],
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new Shocut({
        shortcuts: [],
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
        new Shocut({
          shortcuts: [],
          activeContexts: ['!test'],
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new Shocut({
        shortcuts: [],
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

    test('An error is thrown when setting a context name that is empty', () => {
      let errorCount = 0;

      try {
        new Shocut({
          shortcuts: [],
          activeContexts: [''],
        });
      }
      catch {
        errorCount += 1;
      }

      const sh = new Shocut({
        shortcuts: [],
      });

      try {
        sh.activateContext('');
      }
      catch {
        errorCount += 1;
      }

      try {
        sh.activateContext('test', '');
      }
      catch {
        errorCount += 1;
      }

      try {
        sh.setActiveContexts('test', '');
      }
      catch {
        errorCount += 1;
      }

      expect(errorCount).toBe(4);

      sh.destroy();
    });
  });
});
