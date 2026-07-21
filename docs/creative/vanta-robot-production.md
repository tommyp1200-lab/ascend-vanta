# Vanta robot production asset

The web runtime asset is served from:

- `public/assets/models/vanta-robot/vanta-robot-web.glb`

The editable production master is retained at:

- `source-assets/models/vanta-robot/Vanta-Robot-production.blend`

## Runtime profile

- 3.12 MB GLB (2.98 MiB)
- 186,248 triangles
- 1,536 px WebP material atlas
- `EXT_meshopt_compression` geometry and animation compression
- Ceramic white, graphite black, and Ascend Green PBR material system

## Mechanical control hierarchy

Vanta uses a rigid transform hierarchy rather than organic skinning. This keeps
hard-surface panels from bending like rubber while preserving full articulation
for the head, neck, torso, shoulders, upper and lower arms, elbows, wrists,
hands, four digits per hand, hips, upper and lower legs, knees, ankles, and feet.

## Embedded clips

- `Vanta_Idle` — 6 seconds, looping
- `Vanta_Greeting` — 4 seconds, one-shot
- `Vanta_WalkCycle` — 1.6 seconds, looping

The editorial sphere reveal plays `Vanta_Idle`, triggers `Vanta_Greeting` once
the character has resolved, and returns to the idle loop. The walk cycle remains
embedded for the next story beat.

## Rebuild

The Blender production pipeline is in `scripts/build_vanta_robot.py`. After a
new uncompressed export is created, run:

```bash
npm run optimize:vanta-robot
npm run audit:vanta-robot
```

The runtime loader must retain Meshopt decoding and WebP support.
