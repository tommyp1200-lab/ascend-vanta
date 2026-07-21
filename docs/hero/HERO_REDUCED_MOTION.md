# Reduced Motion

`prefers-reduced-motion` is read after hydration and remains synchronized through a media-query listener. Reduced motion keeps the core composition recognizable while shortening the narrative distance and increasing scroll catch-up.

The selected quality tier still governs density. A development-only `?reduced=1&quality=low` switch supports deterministic QA. Pointer motion remains restrained, touch pointer tracking is disabled, and the WebGL fallback can be forced with `?webgl=0` during development.
