// This is also the entrypoint of a separate bundle for subpath export 'shocut/shortcut_key' so it's
// possible to use the function without requiring the library.

/**
 * Gets the key associated with a Keyboard event with a fallback to use absolute code value for
 * non-Latin keyboard layouts.
 *
 * @returns if `key` is a non-Latin letter (unicode >= 880) and `code` represents a letter or a
 * digit on a QWERTY layout, it will return the corresponding letter (uppercase) or digit on a
 * QWERTY layout. Otherwise it will return `key` (transformed to uppercase if it's a letter).
 * Key values that contain more than one character are ignored.
 *
 * Most commonly non-Latin keyboards have 2 sets of alphabets printed and 2 modes to switch
 * between. The Latin mode usually follows the standard QWERTY layout so by falling back to
 * use key codes (which correspond to QWERTY regardless of layout used) upon detection of a
 * non-Latin script letter, a keyboard shortcut can work even though the layout is in non-Latin
 * mode.
 *
 * Limitations:
 * - This does not consider custom layouts such as using Dvorak instead of QWERTY for Latin-mode
 * on a non-Latin layout. In that case the shortcut would be mapped per QWERTY in non-Latin mode
 * while a different layout is used for Latin alphabet input.
 * - Some non-Latin layouts (i.e. Greek) have a symbol on KeyQ which makes it impossible to
 * distinguish them from custom Latin layouts without further feature detection. KeyQ will not
 * work for those.
 */
export function getShortcutKey(key: KeyboardEvent['key'], code: KeyboardEvent['code']): string {
  if (key.length !== 1) {
    return key;
  }

  const capitalHetaCode = 880;
  const isNonLatin = key.charCodeAt(0) >= capitalHetaCode;

  if (isNonLatin) {
    if (code.indexOf('Key') === 0 && code.length === 4) { // i.e. 'KeyW'
      return code.charAt(3);
    }

    if (code.indexOf('Digit') === 0 && code.length === 6) { // i.e. 'Digit7'
      return code.charAt(5);
    }
  }

  return key.toUpperCase();
}
