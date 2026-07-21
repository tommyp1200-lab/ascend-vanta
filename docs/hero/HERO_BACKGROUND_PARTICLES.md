# Hero Background Particles

The supplied standalone Three.js particle component was adapted into the existing React Three Fiber scene rather than mounting a second renderer. The result preserves the dense cool-white fullscreen 3D field, soft point sprites, and camera-like mouse response while sharing the hero frame loop.

Particle placement is deterministic and quality tiers range from 2,500 points on low mode to 25,000 on high mode. The data-URI sprite was replaced by a shader-generated soft disc, which avoids texture decoding and extra asset memory. The particle geometry has no time-based drift, spin, depth travel, cursor cluster, or radial wake. Only cursor position changes the complete field's perspective; once the eased view reaches a stationary cursor, the layer becomes completely still. The separate original star layers and shooting stars retain their independent continuous animation.
