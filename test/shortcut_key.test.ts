import { getShortcutKey } from 'src/shortcut_key';

describe('getting the shortcut key from the KeyboardEvent', () => {
  it('gets a Latin letter', () => {
    expect(getShortcutKey('A', 'irrelevant')).toBe('A');
  });

  it('gets a digit', () => {
    expect(getShortcutKey('0', 'irrelevant')).toBe('0');
  });

  it('transforms letters to uppercase', () => {
    expect(getShortcutKey('a', 'irrelevant')).toBe('A');
  });

  it('converts non-Latin letters to code values if available', () => {
    expect(getShortcutKey('β', 'KeyB')).toBe('B');
    expect(getShortcutKey('я', 'KeyZ')).toBe('Z');

    // Not a real-world example, but tests retrieving digits.
    expect(getShortcutKey('я', 'Digit1')).toBe('1');
  });

  it('does not convert non-Latin letters on special keys', () => {
    expect(getShortcutKey('ё', 'Backquote')).toBe('Ё');
  });

  it('does not convert extended Latin characters', () => {
    expect(getShortcutKey('ś', 'KeyS')).toBe('Ś');
    expect(getShortcutKey('ü', 'KeyU')).toBe('Ü');
    expect(getShortcutKey('ž', 'KeyZ')).toBe('Ž');
  });
});
