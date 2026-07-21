"use client";

import { AscendParticleOrb } from "./AscendParticleOrb";
import type { HeroRuntimeRefs } from "./heroTypes";

interface AscendOuterHaloProps {
  count: number;
  runtime: HeroRuntimeRefs;
}

export function AscendOuterHalo({ count, runtime }: AscendOuterHaloProps) {
  return <AscendParticleOrb count={count} runtime={runtime} layer="halo" />;
}
