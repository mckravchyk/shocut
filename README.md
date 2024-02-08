# Shocut

Shocut is a very fast keyboard shortcut library for web based renderers (web apps and Electron apps). 

Key features:
- Multi-context support: set any number of contexts that can be active and define shortcuts that can only fire in certain contexts or never fire fire in certain contexts.
- Fast: Shocut is not only lightweight but ensures that minimal resources are used while typing. If all shortcuts are bound with modifier keys (except special keys like Escape or F-keys), Shocut will immediately skip processing regular typing keystrokes.
- i18n friendly - supports non-Latin alphabet layouts well by falling back to QWERTY code value when a non-Latin alphabet letter is pressed

There's only 1 dependency (recursively), `keyboard-shortcuts-18n` and it comes from the same maintainer :)
