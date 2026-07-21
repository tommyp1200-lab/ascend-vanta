# AVFINALLOGO Audit

Audit date: 2026-07-13  
Blender: 5.1.2  
Source: `source-assets/models/AVFINALLOGO.glb`

## Preservation

The supplied desktop file was copied without modification to both the working source location and the required archive location. All three files share SHA-256:

`a0ff0f262e2e92b69107ad5cee040867203fb3f506ea93beaed00621541ab427`

Archive: `source-assets/models/originals/AVFINALLOGO_original.glb`

## Source statistics

| Metric | Actual |
| --- | ---: |
| File size | 73,260,236 bytes (69.87 MiB) |
| Objects | 3 |
| Mesh objects | 1 |
| Vertices | 998,961 |
| Edges | 2,952,873 |
| Faces | 1,953,990 |
| Triangles | 1,953,990 |
| Materials | 1 |
| Embedded textures | 2 |
| UV maps | 1 (`UVMap`) |
| Animation clips | 0 |
| Shape keys | 0 |

## Bounds and transforms

- Bounds: X `-0.5 → 0.5`, Y `-0.019236 → 0.019236`, Z `-0.306836 → 0.306836`.
- Dimensions: `1.0 × 0.038472 × 0.613672` Blender units.
- Physical depth is the Y dimension: `0.038472`.
- Imported hierarchy: `Node_0 → world → tmpgt9mrtzhobj`.
- `Node_0` carries location `[-0.009654, 0.005628, -0.019615]` and uniform scale `0.565963`.
- Mesh local transform is identity; its world origin inherits the source parent transform.
- No negative scale was present.

## Materials and textures

The source has one material, `pbr_material`.

- `Image_1`: embedded PNG, 4096 × 4096, linked to Principled BSDF Base Color.
- `Image_0`: embedded PNG, 4096 × 4096, routed through a Separate Color node for packed material channels.

Both images use the single `UVMap`. The two uncompressed 4K PNGs are the primary reason the file remains approximately 70 MiB after geometry storage.

## Geometry condition

- Non-manifold edges: 43,776.
- Loose vertices: 0.
- Degenerate faces: 3.
- Hidden viewport/render objects: 0.
- Duplicate objects with the same topology-count signature: 0.
- Separating by loose parts produces 78 connected components. These appear to be scan/conversion fragments within the A and V, not 78 meaningful animation pieces.
- No animation, armature, morph targets, or source-authored logo layers are present.
- Visual inspection shows scan-level micro-faceting and surface noise. The outline itself reads clearly as the Ascend Vanta A/V monogram.

Hidden internal faces cannot be proven absent using topology counts alone. No hidden object-level duplicate exists, and no invented internal cleanup is performed in the archived source.

## Web-performance risks

1. The model is approximately 61 times denser than the final desktop tier.
2. The two embedded 4096² PNGs dominate transfer and decode memory.
3. The source hierarchy has non-semantic names and a scaled parent.
4. The mesh is non-manifold and contains three degenerate faces.
5. One million vertices and nearly two million triangles are excessive for a persistent hero object, especially beside particles and post-processing.
6. The scan topology would make wireframe and point conversion visually noisy if used directly at runtime.

Machine-readable audit data: `docs/assets/AVFINALLOGO_AUDIT_DATA.json`.

