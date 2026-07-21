export const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aColorMix;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uParallax;
  uniform float uInteraction;
  uniform float uReducedMotion;
  uniform float uTravelTime;
  uniform float uScrollProgress;

  varying float vBrightness;
  varying float vColorMix;
  varying float vRush;

  void main() {
    float timeScale = mix(1.0, 0.12, uReducedMotion);
    float rushIn = smoothstep(0.48, 0.68, uScrollProgress);
    float rushOut = 1.0 - smoothstep(0.8, 0.94, uScrollProgress);
    float rush = rushIn * rushOut;
    float travel = mod(position.z + 18.0 + uTravelTime * aSpeed * 0.46 * timeScale, 16.0) - 18.0;
    vec3 animated = vec3(
      position.x + uPointer.x * uParallax * uInteraction * (1.0 + abs(travel) * 0.018),
      position.y + uPointer.y * uParallax * uInteraction + sin(uTime * 0.22 + aPhase) * 0.028 * timeScale,
      travel
    );
    vec4 viewPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = aSize * 1.72 * uPixelRatio * clamp(7.0 / max(-viewPosition.z, 0.1), 0.48, 1.72) * (1.0 + rush * 0.62);
    float twinkle = 0.92 + sin(uTime * (0.34 + aSpeed * 0.16) * timeScale + aPhase) * 0.2;
    float sparkle = pow(max(0.0, sin(uTime * 0.62 * timeScale + aPhase * 1.7)), 12.0) * 0.55;
    vBrightness = aBrightness * (twinkle + sparkle + rush * 0.55);
    vColorMix = aColorMix;
    vRush = rush;
  }
`;

export const starFragmentShader = /* glsl */ `
  varying float vBrightness;
  varying float vColorMix;
  varying float vRush;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radius = length(centered);
    float circle = 1.0 - smoothstep(0.16, 0.5, radius);
    if (circle <= 0.001) discard;
    float core = 1.0 - smoothstep(0.035, 0.16, radius);
    float flareX = exp(-abs(centered.x) * 34.0) * (1.0 - smoothstep(0.12, 0.5, abs(centered.y)));
    float flareY = exp(-abs(centered.y) * 34.0) * (1.0 - smoothstep(0.12, 0.5, abs(centered.x)));
    float flare = (flareX + flareY) * (0.16 + vRush * 0.22);
    vec3 pearlWhite = vec3(0.957, 0.969, 0.949);
    vec3 ascendHighlight = vec3(0.851, 1.0, 0.353);
    vec3 color = mix(pearlWhite, ascendHighlight, vColorMix);
    float luminousShape = circle * 0.76 + core * 0.5 + flare;
    gl_FragColor = vec4(color * vBrightness * (0.9 + core * 0.6), min(luminousShape * vBrightness, 1.0));
  }
`;
