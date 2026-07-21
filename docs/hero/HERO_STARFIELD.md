# Starfield

Three deterministic point layers create depth without image textures:

- Deep: smallest, slowest, lowest parallax.
- Mid: moderate scale and movement.
- Near: largest, fastest, strongest restrained parallax.

Each layer loops along depth, twinkles from seeded phase values, and fades its pointer response during the later scroll phases. Quality profiles reduce the combined star count from 10,200 on high to 980 on low.

Star contrast and point scale are tuned to remain clearly visible behind the orb. Rare sparkle peaks add depth without turning the field into uniform noise.

The ambient layers use brisk depth travel, now tuned 21% faster than the previous pass, while preserving the established vertical drift and modest cumulative point-size increase. A separate GPU-driven shooting-star layer adds one to four deterministic diagonal paths by device tier. Each event uses a tapered point trail, staggered phase, brief active window, and long quiet interval so the effect stays cinematic rather than constant.
