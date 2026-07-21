# Scroll Timeline

One pinned GSAP ScrollTrigger writes normalized progress to a mutable ref. Lenis supplies smoothed native wheel input; R3F remains the sole visual frame loop.

| Progress | Phase |
| --- | --- |
| `0.00–0.10` | Established centered logo and living orb |
| `0.10–0.24` | Activation |
| `0.24–0.42` | Living response |
| `0.42–0.60` | Camera pullback and logo reduction |
| `0.60–0.76` | Orb destabilization |
| `0.76–0.90` | Dissipation into field positions |
| `0.90–1.00` | Stable final field state and pin release |

The same progress drives camera distance, logo transforms, particle morph, dissolve, and interaction fade. No scene remount occurs.
