# Hero Shader System

The hero uses two small custom shader families: particles and stars. Shared runtime inputs are elapsed time, normalized scroll progress, pointer position, and an interaction fade.

- Particle vertex deformation combines low-amplitude breathing and traveling waves, then blends deterministic sphere positions toward deterministic field positions.
- Particle fragments calculate lime rim strength and near-transparent center density so the logo remains legible inside the orb. A dedicated signal-node branch adds sparse pearl-lime cores, soft additive falloff, seeded size hierarchy, and asynchronous low-frequency twinkle without a sprite texture or post-processing pass.
- Star vertices apply looping depth travel, twinkle, and subtle pointer parallax.

The renderer uses a near-black `#02040A` clear color, restrained atmosphere, and additive particle/halo glow. The logo combines tiered embedded WebP face maps with physical lime/pearl tinting, restrained clearcoat, reconstructed smooth normals, procedural micro-roughness, and anisotropic graphite sidewalls. A generated PMREM studio environment, controlled cursor-following cool key, and fixed lime rear light expose the model's real extrusion without relying on drop shadows. Full-frame bloom is omitted; localized additive glow is more reliable and less expensive.

All animation values are mutated through GPU uniforms inside the single R3F frame loop. Shader time never depends on scroll position, so reversing scroll reconstructs geometry without reversing ambient motion.
