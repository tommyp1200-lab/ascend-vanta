"use client";

import { AscendStarLayer } from "./AscendStarLayer";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";

export function AscendStarfield({
  quality,
  runtime,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
}) {
  return (
    <group>
      <AscendStarLayer count={quality.starCounts[0]} layer={0} parallax={0.045} runtime={runtime} />
      <AscendStarLayer count={quality.starCounts[1]} layer={1} parallax={0.12} runtime={runtime} />
      <AscendStarLayer count={quality.starCounts[2]} layer={2} parallax={0.22} runtime={runtime} />
    </group>
  );
}
