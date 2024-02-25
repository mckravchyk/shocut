/* eslint-disable object-curly-newline, no-new */

import { Shocut } from 'src';
import { dispatchKeydown } from './util';

type NavigatorUaData = Navigator & { userAgentData: { platform: string } };

// This ensures that the default platform to determine the system key is Linux. This is the primary
// method so overriding navigator.platform is not required.
(window.navigator as NavigatorUaData).userAgentData = {
  platform: 'Linux',
};

describe('Input', () => {
  describe('General', () => {
    test('A shortcut fires with no modifiers', () => {
      let a = 0;
      let b = 0;

      const sh = new Shocut({
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
      });

      dispatchKeydown('a', 'KeyA');
      expect(a).toBe(1);
      expect(b).toBe(1);

      sh.destroy();
    });

    test('A shortcut handler does not block other keydown handlers', () => {
      let a = 0;
      let b = 0;

      const sh1 = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler() { a += 1; },
          },
        ],
      });

      const sh2 = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler() { b += 1; },
            mod: [],
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');
      expect(a).toBe(1);
      expect(b).toBe(1);

      sh1.destroy();
      sh2.destroy();
    });

    test('A shortcut fires for each modifier', () => {
      let ctrl = 0;
      let meta = 0;
      let alt = 0;
      let shift = 0;
      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
          { key: 'A', mod: ['alt'], handler() { alt += 1; } },
          { key: 'A', mod: ['meta'], handler() { meta += 1; } },
          { key: 'A', mod: ['shift'], handler() { shift += 1; } },
        ],
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

    test('A shortcut modifier value is case insensitive', () => {
      let ctrl = 0;
      let meta = 0;
      let alt = 0;
      let shift = 0;
      const sh = new Shocut({
        shortcuts: [
          // @ts-expect-error Case insensitive modifier name
          { key: 'A', mod: ['ctrL'], handler() { ctrl += 1; } },
          // @ts-expect-error Case insensitive modifier name
          { key: 'A', mod: ['Alt'], handler() { alt += 1; } },
          // @ts-expect-error Case insensitive modifier name
          { key: 'A', mod: ['mEta'], handler() { meta += 1; } },
          // @ts-expect-error Case insensitive modifier name
          { key: 'A', mod: ['SHIFT'], handler() { shift += 1; } },
        ],
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

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'shift'], handler() { fireCount += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['shift', 'ctrl']);
      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('2 identical key handlers fire in the order they were added', () => {
      const result: number[] = [];

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['shift'], handler() { result.push(0); } },
          { key: 'A', mod: ['shift'], handler() { result.push(1); } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['shift']);
      expect(result).toEqual([0, 1]);

      sh.destroy();
    });

    test("A shortcut bound with 'code:' prefix' binds to the code value of the event", () => {
      let fired = 0;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'code:KeyA',
            handler() { fired += 1; },
          },
        ],
      });

      dispatchKeydown('m', 'KeyA');
      expect(fired).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for the QWERTY equivalent (code value) of a non-Latin key', () => {
      let fired = 0;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'W',
            handler() { fired += 1; },
          },
        ],
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

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'N',
            handler() { fired += 1; },
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');
      expect(fired).toBe(0);

      sh.destroy();
    });

    test('A shortcut does not fire if its modifier is not present', () => {
      let ctrl = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['alt']);

      expect(ctrl).toBe(0);

      sh.destroy();
    });

    test('A shortcut does not fire for a superfluous modifier', () => {
      let ctrl = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { ctrl += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'alt']);

      expect(ctrl).toBe(0);

      sh.destroy();
    });

    test('A shortcut bound to no modifier does not fire if a modifier is present', () => {
      let fired = 0;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler() { fired += 1; },
          },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);
      expect(fired).toBe(0);

      sh.destroy();
    });
  });

  describe('Context', () => {
    test('A shortcut fires in any context', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; } },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: false },
          { key: 'A', mod: ['ctrl'], handler() { fireCount += 1; }, context: [] },
        ],
        activeContexts: ['test'],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);

      expect(fireCount).toBe(3);

      sh.destroy();
    });

    test('a shortcut fires only in specific contexts', () => {
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      let e = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { a += 1; }, context: 'test' },
          { key: 'A', mod: ['ctrl'], handler() { b += 1; }, context: ['test2'] },
          { key: 'A', mod: ['ctrl'], handler() { c += 1; }, context: ['test', 'test2'] },
          { key: 'A', mod: ['ctrl'], handler() { d += 1; }, context: [['test', 'test2']] },
          { key: 'A', mod: ['ctrl'], handler() { e += 1; }, context: (c) => c.includes('test') && c.includes('test2') },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']); // 0

      sh.activateContext('test');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 1

      sh.activateContext('test2');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 2

      expect(a).toBe(2);
      expect(b).toBe(1);
      expect(c).toBe(2);
      expect(d).toBe(1);
      expect(e).toBe(1);

      sh.destroy();
    });

    test('a shortcut never fires in specific contexts', () => {
      let a = 0;
      let b = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl'], handler() { a += 1; }, context: '!test' },
          { key: 'A', mod: ['ctrl'], handler() { b += 1; }, context: [['test', '!test2']] },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']); // #1

      sh.activateContext('test');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // #2

      sh.activateContext('test2');
      dispatchKeydown('a', 'KeyA', ['ctrl']); // 0

      expect(a).toBe(1);
      expect(b).toBe(1);

      sh.destroy();
    });
  });

  describe('The system modifier', () => {
    test('A shortcut fires for the system modifier', () => {
      let ctrl = 0;
      let meta = 0;

      const sh1 = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { ctrl += 1; } },
        ],
      });

      const sh2 = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { meta += 1; } },
        ],
        systemMod: 'meta',
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['meta']);

      expect(ctrl).toBe(1);
      expect(meta).toBe(1);

      sh1.destroy();
      sh2.destroy();
    });

    test('The system modifier is retrieved from navigator.userAgentData.platform if not set', () => {
      const originalUaData = (window.navigator as NavigatorUaData).userAgentData;

      (window.navigator as NavigatorUaData).userAgentData = {
        platform: 'macOS',
      };

      let meta = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { meta += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['meta']);

      expect(meta).toBe(1);

      sh.destroy();
      (window.navigator as NavigatorUaData).userAgentData = originalUaData;
    });

    test('The system modifier is retrieved from navigator.platform if not set', () => {
      const originalUaData = (window.navigator as NavigatorUaData).userAgentData;

      // The default platform must be suppressed in order to test the navigator.platform fallback.
      // @ts-expect-error platform property missing
      (window.navigator as NavigatorUaData).userAgentData = { };

      const navigatorSpy = jest.spyOn(window.navigator, 'platform', 'get');
      navigatorSpy.mockImplementation(() => 'MacIntel');

      let meta = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['system'], handler() { meta += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['meta']);
      expect(meta).toBe(1);
      sh.destroy();

      navigatorSpy.mockRestore();
      (window.navigator as NavigatorUaData).userAgentData = originalUaData;
    });

    test('ctrl + system = ctrl on systems other than Mac OS', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'system'], handler() { fireCount += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('meta + system = meta on Mac OS', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['meta', 'system'], handler() { fireCount += 1; } },
        ],
        systemMod: 'meta',
      });

      dispatchKeydown('a', 'KeyA', ['meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('meta + system = meta + ctrl on systems other than Mac OS', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['meta', 'system'], handler() { fireCount += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });

    test('ctrl + system = ctrl + meta on Mac OS', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['ctrl', 'system'], handler() { fireCount += 1; } },
        ],
        systemMod: 'meta',
      });

      dispatchKeydown('a', 'KeyA', ['ctrl', 'meta']);

      expect(fireCount).toBe(1);

      sh.destroy();
    });
  });

  describe('Shortcut combos', () => {
    test('A combination of 2 shortcuts fires by leveraging the context mechanism', () => {
      let a = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'K', mod: ['ctrl'], handler() { sh.activateContext('Ctrl+K'); } },
          { key: 'A', mod: ['ctrl'], context: ['Ctrl+K'], handler() { a += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['ctrl']);

      dispatchKeydown('k', 'KeyK', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      // In a real world case setTimeout can be used to deactivate it
      sh.deactivateContext('Ctrl+K');

      expect(a).toBe(1);

      sh.destroy();
    });

    test('Combo shortcut fires only in specific contexts', () => {
      let a = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'K', mod: ['ctrl'], handler() { this.activateContext('Ctrl+K'); } },
          { key: 'A', mod: ['ctrl'], context: [['Ctrl+K', 'a'], ['Ctrl+K', 'b']], handler() { a += 1; } },
        ],
      });

      dispatchKeydown('k', 'KeyK', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      sh.deactivateContext('Ctrl+K');

      sh.activateContext('a');

      dispatchKeydown('k', 'KeyK', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      sh.deactivateContext('Ctrl+K');

      sh.deactivateContext('a');
      sh.activateContext('b');

      dispatchKeydown('k', 'KeyK', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      sh.deactivateContext('Ctrl+K');

      sh.activateContext('a');

      dispatchKeydown('k', 'KeyK', ['ctrl']);
      dispatchKeydown('a', 'KeyA', ['ctrl']);
      sh.deactivateContext('Ctrl+K');

      expect(a).toBe(3);

      sh.destroy();
    });
  });

  describe('Misc', () => {
    test('The instance is the this context of the handler', () => {
      let t: Shocut<string> | null = null;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            handler() { t = this; },
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');
      expect(t).toBe(sh);

      sh.destroy();
    });

    test('The default action is prevented', () => {
      let spy: jest.SpyInstance | null = null;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler(e) { spy = jest.spyOn(e, 'preventDefault'); },
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');

      expect(spy).not.toBe(null);
      expect(spy!).toHaveBeenCalled();

      sh.destroy();
    });

    test('The default action is not prevented if opted out', () => {
      let spy: jest.SpyInstance | null = null;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler(e) { spy = jest.spyOn(e, 'preventDefault'); },
            noDefaultPrevent: true,
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');

      expect(spy).not.toBe(null);
      expect(spy!).not.toHaveBeenCalled();

      sh.destroy();
    });

    test('Propagation is stopped', () => {
      let spy: jest.SpyInstance | null = null;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler(e) { spy = jest.spyOn(e, 'stopPropagation'); },
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');

      expect(spy).not.toBe(null);
      expect(spy!).toHaveBeenCalled();

      sh.destroy();
    });

    test('Propagation is not stopped if opted out', () => {
      let spy: jest.SpyInstance | null = null;

      const sh = new Shocut({
        shortcuts: [
          {
            key: 'A',
            handler(e) { spy = jest.spyOn(e, 'stopPropagation'); },
            noPropagationStop: true,
          },
        ],
      });

      dispatchKeydown('a', 'KeyA');

      expect(spy).not.toBe(null);
      expect(spy!).not.toHaveBeenCalled();

      sh.destroy();
    });
  });

  describe('Typing optimization', () => {
    test('Shortcuts are not processed while typing if there are no shortcuts without modifiers', () => {
      let fired = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', handler() { fired += 1; }, mod: ['ctrl'] },
        ],
      });

      // @ts-expect-error Accessing private method
      const originalProcessShortcut = sh.processShortcut_;

      const processShortcut = jest.fn(
        (...args: Parameters<Shocut<string>['processShortcut_']>) => originalProcessShortcut.call(sh, ...args),
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

    test('Shortcuts are not processed while typing if there are no shortcuts without modifiers for the active contexts', () => {
      let fired = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', handler() { fired += 1; }, mod: ['ctrl'] },
          { key: 'A', handler() { fired += 1; }, context: 'test' },
        ],
        activeContexts: ['test'],
      });

      // @ts-expect-error Accessing private method
      const originalProcessShortcut = sh.processShortcut_;

      const processShortcut = jest.fn(
        (...args: Parameters<Shocut<'test'>['processShortcut_']>) => originalProcessShortcut.call(sh, ...args),
      );

      // @ts-expect-error Overriding private method with the mock.
      sh.processShortcut_ = processShortcut;

      sh.deactivateContext('test');

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

      const sh = new Shocut({
        shortcuts: [
          { key: 'A', mod: ['shift'], handler() { shift += 1; } },
        ],
      });

      dispatchKeydown('a', 'KeyA', ['shift']);
      expect(shift).toBe(1);

      sh.destroy();
    });

    test('A shortcut fires for non-typing keys', () => {
      let fireCount = 0;

      const sh = new Shocut({
        shortcuts: [
          { key: 'Escape', handler() { fireCount += 1; } },
          { key: 'F1', handler() { fireCount += 1; } },
          { key: 'F12', handler() { fireCount += 1; } },
          { key: 'PrintScreen', handler() { fireCount += 1; } },
          { key: 'Insert', handler() { fireCount += 1; } },
        ],
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
