export const HERO_INTERACTION = {
  pointerDamping: 6.4,
  downwardDamping: 7.6,
  lightDamping: 4.2,
  maxYaw: (16 * Math.PI) / 180,
  maxPitchUp: (15 * Math.PI) / 180,
  maxPitchDown: (21 * Math.PI) / 180,
  maxX: 0.12,
  maxYUp: 0.055,
  maxYDown: 0.025,
  idleFloat: 0.035,
  idleRotation: (0.8 * Math.PI) / 180,
  pointerFadeStart: 0.35,
  pointerFadeEnd: 0.74,
} as const;

export const HERO_ORB = {
  radius: 1.88,
  rimPower: 2.65,
  rimBrightness: 1.32,
  centerOpacity: 0.006,
  edgeOpacity: 0.62,
  centerPointSize: 1.1,
  edgePointSize: 3.8,
  waveStrength: 0.092,
  expansion: 1.58,
  survivorPercentage: 0.18,
} as const;
