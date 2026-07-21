# Hero Skills Map

Reviewed on 2026-07-13 before implementation. Only installed skills whose instructions were read in full are marked as used.

| Installed skill | Intended use | Hero application | Important restrictions | Verification | Priority |
| --- | --- | --- | --- | --- | --- |
| `3d-web-experience` | Three.js, React Three Fiber, WebGL, GLSL, glTF, and 3D optimization | Persistent Canvas, GPU point systems, shader architecture, optimized AV GLBs, WebGL fallback | Keep models compressed, cap DPR, lazy-load 3D, provide loading and fallback states | GLB transfer sizes, renderer stats, browser screenshots, no-WebGL fallback | Essential |
| `vercel:nextjs` | Next.js App Router and Vercel-compatible architecture | Single `/` App Router route, static server shell with a client-only hero boundary | App Router; keep client boundary low; use patched stable Next/React releases; Node 20.9+ | Strict production build and browser load | Essential |
| `vercel:react-best-practices` | React component, hook, TypeScript, accessibility, and performance review | Small named components, strict refs, effect cleanup, no per-frame React state | One primary component per file; explicit React 19 ref initializers; semantic HTML | ESLint, TypeScript build, manual TSX checklist | Essential |
| `tailwind-css-development` | Maintainable Tailwind v4 styling and responsive variants | Semantic brand tokens, layout utilities, focus/motion variants | Avoid class soup; prefer tokens; explicitly test responsive and focus states | Mobile/desktop screenshots and CSS review | Essential |
| `gsap-core` | GSAP transforms, opacity, responsive match media, and reduced motion | DOM copy transforms and centralized responsive behavior | Prefer transform/opacity; scope selectors; use `matchMedia` for motion preferences | Reversible DOM state at timeline checkpoints | Essential |
| `gsap-react` | React-safe GSAP setup and cleanup | Scoped `useGSAP()` lifecycle for the hero ScrollTrigger | Run client-side only; always scope and clean up | Unmount/reload without duplicate triggers | Essential |
| `gsap-scrolltrigger` | Scroll pinning, scrubbed progress, refresh, and cleanup | One normalized pinned hero narrative using normal document scroll | Do not animate the pinned element; no nested triggers; no markers in production | Down/up scroll screenshots, clean pin release | Essential |
| `gsap-timeline` | Maintainable multi-phase sequencing | Labels and centralized phase ranges for HTML and Scene 2 handoff | Put ScrollTrigger on the top-level timeline; use labels and shared defaults | Timeline checkpoint capture in both directions | Essential |
| `gsap-performance` | Compositor-friendly animation and jank prevention | Transform/opacity-only DOM animation, offscreen throttling, cleanup | No layout-property animation; no per-frame timeline creation; use `will-change` selectively | Performance trace and no duplicate RAF loops | Essential |
| `blender-toolkit` | Blender/glTF production and optimization workflow | Consume and verify the already generated AV desktop/tablet/mobile/low GLBs | Do not alter the preserved source; use the optimized tiers and verify in-browser decode | Source hash, GLB sizes, browser render | Essential |
| `frontend-accessibility-wcag` | Semantic HTML, keyboard access, focus, contrast, and reduced motion | Decorative canvas, real heading/copy/CTA, visible focus, intentional fallback | Native semantics first; pointer effects cannot carry essential meaning | Keyboard traversal, reduced-motion and fallback checks | Essential |
| `responsive-web-design` | Mobile-first layout and viewport adaptation | Quality profiles, `100svh`, touch-specific behavior, no overflow | Start with mobile constraints; verify overlap and target sizes | 390×844, 768×1024, 1280×800, 1440×900 | Essential |
| `performance-budgeting` | Measurable performance guardrails | Draw-call, model-size, particle-count, DPR, JS, LCP, and frame-time budgets | Budgets must be realistic and tied to user impact | Build sizes, renderer stats, browser metrics | Essential |
| `vercel:agent-browser-verify` | Browser validation of a running development server | Required live check at `http://localhost:3005`, overlays, content, console, screenshots | A server start is not proof; capture browser evidence and retry failures | Automated browser checks and screenshots | Essential |

## No dedicated installed skill

- Lenis: integrated from its official API contract and kept to one instance.
- Motion for React: unnecessary for this scope because the only DOM narrative animation is already owned by GSAP; adding it would overlap ownership.
- Vercel deployment: optional and not authorized by this task. The application remains Vercel-compatible, but no deployment will be created.

