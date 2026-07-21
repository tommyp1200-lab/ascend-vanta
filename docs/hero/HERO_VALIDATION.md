# Hero Validation

Validated locally at `http://localhost:3005`:

- Desktop 1280×800: one 1280×800 Canvas, standard tier, no horizontal overflow, and one visible SVG wordmark.
- Mobile 390×844: one 390×844 Canvas, low/reduced test mode, no horizontal overflow, and one responsive SVG wordmark.
- WebGL fallback: zero canvases, one optimized fallback image, and the same standalone SVG wordmark.
- Full forward scroll: Canvas remains mounted and visible at the final field state.
- Cursor tracking: upper, lower, left, and right movement produces damped pitch/yaw, translation, and lagged lighting across the extruded logo.
- DOM scope: no navigation, body copy, buttons, taglines, or secondary logos render; the sole heading is the `ASCEND VANTA` wordmark.
- Production checks: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Dependency audit: 0 critical, 0 high, 2 moderate transitive PostCSS/Next.js advisories; npm offers no safe compatible automatic fix.

The Next.js development indicator is development tooling and is not included in the production output.
