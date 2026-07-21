import type { HeroQualityName, HeroQualityProfile } from "./heroTypes";

export const HERO_QUALITY_PROFILES: Record<HeroQualityName, HeroQualityProfile> = {
  high: {
    name: "high",
    model: "/assets/models/av-logo-desktop.glb",
    particleCount: 52_000,
    haloCount: 6_000,
    orbDetailCount: 2_200,
    rockCount: 18,
    backgroundParticleCount: 25_000,
    starCounts: [5_400, 3_200, 1_600],
    dpr: 1.5,
    atmosphere: true,
    narrativeViewports: 2.65,
  },
  standard: {
    name: "standard",
    model: "/assets/models/av-logo-desktop.glb",
    particleCount: 36_000,
    haloCount: 4_000,
    orbDetailCount: 1_500,
    rockCount: 14,
    backgroundParticleCount: 18_000,
    starCounts: [3_600, 2_100, 1_000],
    dpr: 1.25,
    atmosphere: true,
    narrativeViewports: 2.45,
  },
  tablet: {
    name: "tablet",
    model: "/assets/models/av-logo-tablet.glb",
    particleCount: 18_000,
    haloCount: 2_200,
    orbDetailCount: 700,
    rockCount: 10,
    backgroundParticleCount: 10_000,
    starCounts: [2_200, 1_200, 650],
    dpr: 1.15,
    atmosphere: true,
    narrativeViewports: 1.95,
  },
  mobile: {
    name: "mobile",
    model: "/assets/models/av-logo-mobile.glb",
    particleCount: 10_000,
    haloCount: 1_100,
    orbDetailCount: 360,
    rockCount: 7,
    backgroundParticleCount: 6_000,
    starCounts: [1_300, 700, 400],
    dpr: 1.15,
    atmosphere: false,
    narrativeViewports: 1.6,
  },
  low: {
    name: "low",
    model: "/assets/models/av-logo-low.glb",
    particleCount: 4_000,
    haloCount: 400,
    orbDetailCount: 120,
    rockCount: 4,
    backgroundParticleCount: 2_500,
    starCounts: [550, 280, 150],
    dpr: 1,
    atmosphere: false,
    narrativeViewports: 1.35,
  },
};

export function chooseHeroQuality(): HeroQualityProfile {
  if (typeof window === "undefined") return HERO_QUALITY_PROFILES.standard;

  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 2 || memory <= 2) return HERO_QUALITY_PROFILES.low;
  if (width < 600) return HERO_QUALITY_PROFILES.mobile;
  if (width < 1024) return HERO_QUALITY_PROFILES.tablet;
  if (width >= 1440 && cores >= 8 && memory >= 8) return HERO_QUALITY_PROFILES.high;
  return HERO_QUALITY_PROFILES.standard;
}
