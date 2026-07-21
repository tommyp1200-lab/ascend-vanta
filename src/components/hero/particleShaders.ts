import { HERO_PHASES } from "./heroTimelineConfig";

export const particleVertexShader = /* glsl */ `
  attribute vec3 aFieldPosition;
  attribute float aSeed;
  attribute float aPhase;
  attribute float aSize;
  attribute float aIntensity;
  attribute float aSurvivor;

  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uGalaxyProgress;
  uniform float uPixelRatio;
  uniform float uRimPower;
  uniform float uWaveStrength;
  uniform float uReducedMotion;
  uniform float uHalo;
  uniform float uDetail;

  varying float vRim;
  varying float vAlpha;
  varying float vIntensity;
  varying float vSeed;
  varying float vVertical;
  varying float vPulse;
  varying float vTransit;

  float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / max(high1 - low1, 0.0001);
  }

  void main() {
    vec3 direction = normalize(position);
    float motionScale = mix(1.0, 0.18, uReducedMotion);
    float orbit = uTime * 0.46;
    mat2 turn = mat2(cos(orbit), -sin(orbit), sin(orbit), cos(orbit));
    vec2 rotatedXZ = turn * direction.xz;
    vec3 flowDirection = normalize(vec3(rotatedXZ.x, direction.y, rotatedXZ.y));

    float longitude = atan(flowDirection.z, flowDirection.x);
    float waveA = sin(flowDirection.y * 8.0 + longitude * 2.0 + uTime * 1.08 + aPhase * 0.18);
    float waveB = sin(dot(flowDirection, normalize(vec3(0.72, 0.38, -0.58))) * 11.0 - uTime * 0.84 + aSeed * 5.0);
    float broadWave = sin(dot(flowDirection, normalize(vec3(-0.32, 0.88, 0.36))) * 4.2 + uTime * 0.68);
    float crest = pow(0.5 + 0.5 * sin(longitude * 3.0 + flowDirection.y * 5.0 - uTime * 1.22), 6.0);
    float ridge = pow(0.5 + 0.5 * sin(flowDirection.y * 12.0 + flowDirection.x * 7.0 + uTime * 1.35 + aPhase), 6.0);
    float breathing = sin(uTime * 0.72 + aPhase * 0.12) * 0.018;

    vec3 tangent = normalize(cross(direction, vec3(0.0, 1.0, 0.001)));
    vec3 bitangent = normalize(cross(direction, tangent));
    vec3 surfaceDrift = (
      tangent * sin(longitude * 4.0 - uTime * 0.92 + aPhase) +
      bitangent * cos(flowDirection.y * 8.0 + uTime * 0.76 + aSeed * 6.283)
    ) * 0.024 * motionScale;
    float radialMotion = (
      waveA * 0.36 + waveB * 0.22 + broadWave * 0.26 + crest * 0.78
    ) * uWaveStrength * motionScale + breathing;
    vec3 aliveSphere = position + direction * radialMotion + surfaceDrift;

    float aperture = smoothstep(0.34, 0.54, uScrollProgress);
    float transit = smoothstep(0.52, 0.78, uScrollProgress);
    float settle = smoothstep(0.77, 0.95, uScrollProgress);
    float apertureAngle = aPhase + aSeed * 1.9;
    float apertureRadius = 2.0 + (aSeed - 0.5) * 0.32;
    vec3 aperturePosition = vec3(
      cos(apertureAngle) * apertureRadius,
      sin(apertureAngle) * apertureRadius * mix(1.0, 0.16, aperture),
      (aSeed - 0.5) * 0.42
    );
    vec3 apertureShape = mix(aliveSphere, aperturePosition, aperture);

    float tunnelDepth = -0.6 - aSeed * 8.4;
    float tunnelRadius = mix(2.25, 4.8, aSeed);
    vec3 tunnelPosition = vec3(
      cos(apertureAngle + transit * 1.25) * tunnelRadius,
      sin(apertureAngle + transit * 1.25) * tunnelRadius * 0.58,
      tunnelDepth
    );
    vec3 transitShape = mix(apertureShape, tunnelPosition, transit);
    vec3 fieldDrift = aFieldPosition + vec3(
      sin(uTime * 0.17 + aPhase),
      cos(uTime * 0.13 + aPhase * 1.7),
      sin(uTime * 0.11 + aSeed * 9.0)
    ) * 0.032 * motionScale;
    vec3 deformed = mix(transitShape, fieldDrift, settle);

    vec4 modelPosition = modelMatrix * vec4(deformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec3 viewNormal = normalize(normalMatrix * direction);
    vec3 viewDirection = normalize(-viewPosition.xyz);
    float facing = abs(dot(viewNormal, viewDirection));
    vRim = pow(clamp(1.0 - facing, 0.0, 1.0), uRimPower);

    float dissolve = smoothstep(${HERO_PHASES.particleDissolveStart.toFixed(2)}, 0.98, uScrollProgress);
    float survivor = step(aSurvivor, 0.18);
    float dissolveThreshold = smoothstep(aSeed - 0.12, aSeed + 0.12, 1.0 - dissolve);
    vAlpha = mix(1.0, max(survivor * 0.26, dissolveThreshold), dissolve);
    vAlpha *= 1.0 - smoothstep(0.0, 0.09, uGalaxyProgress);
    vIntensity = aIntensity + ridge * (0.9 + vRim * 1.4) + crest * (0.55 + vRim * 1.8);
    vSeed = aSeed;
    vVertical = direction.y;
    vPulse = 0.76 + 0.24 * sin(uTime * (0.58 + aSeed * 1.12) + aPhase * 2.4);
    vTransit = transit * (1.0 - settle);

    gl_Position = projectionMatrix * viewPosition;
    float perspective = clamp(7.0 / max(-viewPosition.z, 0.1), 0.55, 2.2);
    float pointSize = mix(1.1, 4.0, vRim) * aSize * perspective * uPixelRatio;
    pointSize *= mix(1.0, 1.28, uHalo);
    float signalSize = mix(1.65, 4.6, smoothstep(0.72, 2.07, aSize));
    signalSize *= mix(0.92, 1.55, step(0.84, aSeed));
    signalSize *= perspective * uPixelRatio;
    gl_PointSize = mix(pointSize, signalSize, uDetail) * (1.0 + vTransit * 0.7);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uDarkColor;
  uniform vec3 uLimeColor;
  uniform float uRimBrightness;
  uniform float uCenterOpacity;
  uniform float uEdgeOpacity;
  uniform float uHalo;
  uniform float uDetail;

  varying float vRim;
  varying float vAlpha;
  varying float vIntensity;
  varying float vSeed;
  varying float vVertical;
  varying float vPulse;
  varying float vTransit;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float distanceToCenter = length(centered);
    float circle = 1.0 - smoothstep(0.34, 0.5, distanceToCenter);
    if (circle <= 0.001) discard;

    float hotCore = 1.0 - smoothstep(0.04, 0.17, distanceToCenter);
    float softHalo = 1.0 - smoothstep(0.08, 0.5, distanceToCenter);

    if (uDetail > 0.5) {
      float signal = smoothstep(0.46, 1.52, vIntensity);
      float rareNode = smoothstep(0.78, 0.98, vSeed);
      float topBalance = mix(1.0, 0.72, smoothstep(0.58, 0.96, vVertical));
      vec3 pearlLime = vec3(0.851, 1.0, 0.353);
      vec3 signalColor = mix(uLimeColor, pearlLime, hotCore * (0.42 + rareNode * 0.48));
      float signalBrightness = 0.7 + vRim * uRimBrightness + signal * 0.82 + hotCore * 1.7 + vTransit * 0.82;
      float signalOpacity = 0.1 + vRim * 0.58 + signal * 0.24 + rareNode * 0.1;
      signalOpacity *= vAlpha * softHalo * vPulse * topBalance;
      gl_FragColor = vec4(signalColor * signalBrightness, signalOpacity);
      return;
    }

    float ridge = smoothstep(0.72, 1.55, vIntensity);
    vec3 color = mix(uDarkColor, uLimeColor, clamp(vRim * 0.84 + ridge * 0.62, 0.0, 1.0));
    float brightness = 0.42 + vRim * uRimBrightness + ridge * 1.15 + hotCore * (0.08 + vRim * 0.18) + vTransit * 0.72;
    float topSuppression = mix(1.0, 0.36, smoothstep(0.5, 0.94, vVertical));
    brightness *= topSuppression;
    float opacity = mix(uCenterOpacity, uEdgeOpacity, vRim);
    opacity *= mix(1.0, 0.32, uHalo) * vAlpha * circle * (0.55 + vSeed * 0.45);
    vec3 microHighlight = uLimeColor * hotCore * (0.035 + vRim * 0.07);
    gl_FragColor = vec4(color * brightness + microHighlight, opacity);
  }
`;
