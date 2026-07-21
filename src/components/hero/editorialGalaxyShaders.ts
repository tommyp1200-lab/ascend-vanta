export const editorialGalaxyVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aPhase;
  attribute float aSize;
  attribute float aIntensity;

  uniform float uTime;
  uniform float uGalaxyProgress;
  uniform float uShapeProgress;
  uniform float uPixelRatio;
  uniform float uReducedMotion;
  uniform float uDetail;
  uniform float uInteriorLayer;
  uniform float uLatticeLayer;
  uniform float uFilamentLayer;
  uniform float uGlowLayer;

  varying float vAlpha;
  varying float vEnergy;
  varying float vHotNode;
  varying float vRim;
  varying float vGalaxy;
  varying float vDepth;
  varying float vSeed;
  varying float vCore;
  varying float vDust;
  varying float vShapeProgress;
  varying float vShapeRidge;
  varying float vShapeNoise;
  varying float vShapePole;
  varying float vFacing;
  varying float vMicroDetail;
  varying float vBottomLight;
  varying float vFlowCore;
  varying float vFlowRail;
  varying float vFlowChannel;
  varying float vFlowJunction;
  varying float vLatticePulse;

  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;

  mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  // Classic Perlin 3D noise by Stefan Gustavson. One coherent evaluation per
  // field keeps the surface organic without breaking the particle topology.
  vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fadeNoise(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float cnoise(vec3 p) {
    vec3 pi0 = floor(p);
    vec3 pi1 = pi0 + vec3(1.0);
    pi0 = mod(pi0, 289.0);
    pi1 = mod(pi1, 289.0);
    vec3 pf0 = fract(p);
    vec3 pf1 = pf0 - vec3(1.0);
    vec4 ix = vec4(pi0.x, pi1.x, pi0.x, pi1.x);
    vec4 iy = vec4(pi0.yy, pi1.yy);
    vec4 iz0 = pi0.zzzz;
    vec4 iz1 = pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(
      dot(g000, g000),
      dot(g010, g010),
      dot(g100, g100),
      dot(g110, g110)
    ));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(
      dot(g001, g001),
      dot(g011, g011),
      dot(g101, g101),
      dot(g111, g111)
    ));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, pf0);
    float n100 = dot(g100, vec3(pf1.x, pf0.yz));
    float n010 = dot(g010, vec3(pf0.x, pf1.y, pf0.z));
    float n110 = dot(g110, vec3(pf1.xy, pf0.z));
    float n001 = dot(g001, vec3(pf0.xy, pf1.z));
    float n101 = dot(g101, vec3(pf1.x, pf0.y, pf1.z));
    float n011 = dot(g011, vec3(pf0.x, pf1.yz));
    float n111 = dot(g111, pf1);

    vec3 fadeXYZ = fadeNoise(pf0);
    vec4 nZ = mix(
      vec4(n000, n100, n010, n110),
      vec4(n001, n101, n011, n111),
      fadeXYZ.z
    );
    vec2 nYZ = mix(nZ.xy, nZ.zw, fadeXYZ.y);
    return 2.2 * mix(nYZ.x, nYZ.y, fadeXYZ.x);
  }

  void main() {
    float progress = clamp(uGalaxyProgress, 0.0, 1.0);
    float shapeProgress = clamp(uShapeProgress, 0.0, 1.0);
    float motion = mix(1.0, 0.16, uReducedMotion);
    float expansion = smoothstep(0.035, 0.70, progress);
    float ringToCloud = smoothstep(0.70, 0.80, progress);
    float cloudToSphere = smoothstep(0.80, 0.955, progress);
    float appearance = smoothstep(0.0, 0.035, progress);

    vec3 sphereDirection = normalize(position);

    // Four logarithmic arms replace the former torus. Most particles stay close
    // to an arm spine while a smaller population forms wider dust lanes.
    float radialSeed = fract(aSeed * 37.137 + aPhase * 0.143);
    float armSeed = fract(aSeed * 91.731 + aPhase * 0.318);
    float laneSeed = fract(aSeed * 53.173 + aPhase * 0.419);
    float dustSeed = fract(aSeed * 137.113 + aPhase * 0.071);
    float heightSeed = fract(aSeed * 29.417 + aPhase * 0.537);
    float dustMask = step(0.8, dustSeed);

    float radialProgress = pow(radialSeed, 0.72);
    float armIndex = floor(armSeed * 4.0);
    float armOffset = armIndex * (TAU / 4.0);
    float differentialTurn = uTime * motion * (0.055 + (1.0 - radialProgress) * 0.055);
    float scrollCurl = expansion * (1.0 - radialProgress) * 0.62;
    float armSpine = armOffset + radialProgress * TAU * 1.28 + differentialTurn + scrollCurl;
    float tightScatter = (laneSeed - 0.5) * mix(0.2, 0.58, radialProgress);
    float dustScatter = (laneSeed - 0.5) * mix(0.68, 1.42, radialProgress);
    float scatterAngle = mix(tightScatter, dustScatter, dustMask);
    float theta = armSpine + scatterAngle;

    float galaxyRadius = mix(0.82, 4.72, expansion);
    float particleRadius = (0.045 + radialProgress * 0.955) * galaxyRadius;
    particleRadius +=
      (heightSeed - 0.5) * galaxyRadius * mix(0.018, 0.07, radialProgress) +
      sin(radialProgress * 24.0 + aPhase * 1.7 - uTime * 0.12 * motion) *
        galaxyRadius * mix(0.004, 0.018, expansion);

    float thickness =
      (heightSeed - 0.5) *
      mix(0.1, 0.58, expansion) *
      (0.28 + radialProgress * 0.72);
    float armRipple =
      sin(theta * 3.0 - radialProgress * 17.0 - uTime * 0.22 * motion) *
      mix(0.018, 0.1, expansion) *
      radialProgress;

    vec3 galaxy = vec3(
      cos(theta) * particleRadius,
      thickness + armRipple,
      sin(theta) * particleRadius
    );
    galaxy.yz = rotate2d(0.31) * galaxy.yz;
    galaxy.xy = rotate2d(-0.13) * galaxy.xy;

    // The largest ring first loses its topology into a luminous cloud. Only
    // after that interstitial stage do the points resolve onto the hero shell.
    float cloudRadius = 0.3 + pow(aSeed, 0.64) * 1.5;
    vec3 cloud = sphereDirection * cloudRadius;
    cloud += vec3(
      sin(aPhase * 2.2 + uTime * 0.12 * motion),
      cos(aPhase * 1.7 - uTime * 0.1 * motion),
      sin(aPhase * 2.8 + aSeed * 8.0)
    ) * (0.12 + aIntensity * 0.24);
    cloud.xy = rotate2d(-0.12) * cloud.xy;

    float longitude = atan(sphereDirection.z, sphereDirection.x);
    float waveA = sin(sphereDirection.y * 8.0 + longitude * 2.0 + uTime * 1.02 * motion + aPhase * 0.18);
    float waveB = sin(
      dot(sphereDirection, normalize(vec3(0.72, 0.38, -0.58))) * 11.0 -
      uTime * 0.78 * motion + aSeed * 5.0
    );
    float broadWave = sin(
      dot(sphereDirection, normalize(vec3(-0.32, 0.88, 0.36))) * 4.2 +
      uTime * 0.62 * motion
    );
    float crest = pow(
      0.5 + 0.5 * sin(longitude * 3.0 + sphereDirection.y * 5.0 - uTime * 1.1 * motion),
      6.0
    );
    float radialMotion = (waveA * 0.034 + waveB * 0.021 + broadWave * 0.025 + crest * 0.074) * motion;
    vec3 energySphere = position + sphereDirection * radialMotion;

    // The post-galaxy chapter applies pose-to-pose spatial animation to the
    // same shell: a small anticipation, a stretch, a squash, then a living
    // displaced form. X/Z compensate Y so the orb retains believable volume.
    float shapeAppearance = smoothstep(0.02, 0.18, shapeProgress);
    float anticipation =
      smoothstep(0.0, 0.12, shapeProgress) - smoothstep(0.14, 0.26, shapeProgress);
    float stretchPose =
      smoothstep(0.10, 0.30, shapeProgress) - smoothstep(0.42, 0.60, shapeProgress);
    float squashPose =
      smoothstep(0.38, 0.56, shapeProgress) - smoothstep(0.68, 0.86, shapeProgress);
    float resolvedPose = smoothstep(0.64, 1.0, shapeProgress);
    vec3 shapedSphere = energySphere;
    vec3 shapedDirection = sphereDirection;
    float shapeNoise = 0.0;
    float shapeRidge = 0.0;
    float shapePole = 0.0;
    float microDetail = 0.0;
    float bottomLight = 0.0;
    float flowCore = 0.0;
    float flowRail = 0.0;
    float flowChannel = 0.0;
    float flowJunction = 0.0;
    float latticePulse = 0.0;

    // shapeAppearance is a uniform value, so this branch is coherent across
    // every point and entirely skips the expensive noise work before reveal.
    if (shapeAppearance > 0.0001) {
      float verticalScale =
        1.0 - anticipation * 0.045 + stretchPose * 0.17 - squashPose * 0.15 +
        resolvedPose * 0.03;
      float horizontalScale = inversesqrt(max(verticalScale, 0.55));
      vec3 shapedBase = energySphere * vec3(horizontalScale, verticalScale, horizontalScale);
      shapedDirection = normalize(shapedBase);

      vec3 primaryDomain =
        shapedDirection * 2.25 +
        vec3(0.0, uTime * 0.10 * motion, -uTime * 0.06 * motion);
      shapeNoise = cnoise(primaryDomain);
      float detailNoise = sin(
        dot(shapedDirection, normalize(vec3(0.58, -0.74, 0.34))) * 29.0 +
        uTime * 0.22 * motion
      );
      float shapedLongitude = atan(shapedDirection.z, shapedDirection.x);
      float ridgePhase =
        shapedDirection.y * 5.2 + shapedLongitude * 0.45 + shapeNoise * 0.62 -
        uTime * 0.18 * motion;
      shapeRidge = pow(0.5 + 0.5 * sin(ridgePhase * TAU), 5.0);
      float travelingLobe = pow(
        max(
          0.0,
          dot(
            shapedDirection,
            normalize(vec3(
              sin(uTime * 0.16 * motion),
              0.78,
              cos(uTime * 0.13 * motion)
            ))
          )
        ),
        7.0
      );
      float distortionStrength = shapeAppearance * mix(0.035, 0.115, resolvedPose);
      float displacement =
        (shapeNoise * 0.42 + detailNoise * 0.18) * distortionStrength +
        shapeRidge * distortionStrength * 0.78 +
        travelingLobe * distortionStrength * 0.7;
      float granularRelease =
        shapeAppearance *
        (1.0 - smoothstep(0.18, 0.58, shapeProgress)) *
        (aSeed - 0.5) *
        0.13;
      shapedSphere = shapedBase + shapedDirection * (displacement + granularRelease);
      shapePole = pow(abs(shapedDirection.y), 11.0) * shapeAppearance;
      microDetail = pow(
        0.5 + 0.5 * sin(
          shapedLongitude * 14.0 + shapedDirection.y * 27.0 + shapeNoise * 5.2 -
          uTime * 0.31 * motion + aPhase * 0.08
        ),
        7.0
      ) * shapeAppearance;
      bottomLight = pow(
        max(0.0, dot(shapedDirection, normalize(vec3(0.04, -1.0, 0.2)))),
        5.5
      ) * shapeAppearance;

      // A slowly drifting gyroid contour produces interlocking organic paths
      // across the sphere. A luminous center rail, recessed channel, and outer
      // rail create the nested dimensional structure seen in the reference.
      vec3 flowDomain =
        shapedDirection * 4.65 +
        vec3(shapeNoise * 0.72, -shapeNoise * 0.46, shapeNoise * 0.58) +
        vec3(uTime * 0.035, -uTime * 0.022, uTime * 0.028) * motion;
      float flowField = dot(sin(flowDomain), cos(flowDomain.zxy));
      float flowDistance = abs(flowField);
      flowCore =
        (1.0 - smoothstep(0.035, 0.15, flowDistance)) * shapeAppearance;
      flowChannel =
        smoothstep(0.12, 0.22, flowDistance) *
        (1.0 - smoothstep(0.32, 0.46, flowDistance)) *
        shapeAppearance;
      flowRail =
        (1.0 - smoothstep(0.055, 0.14, abs(flowDistance - 0.5))) *
        shapeAppearance;
      vec3 junctionDomain = flowDomain.yzx * 0.78 + vec3(0.84, -1.18, 0.52);
      float junctionField = dot(sin(junctionDomain), cos(junctionDomain.zxy));
      flowJunction =
        flowCore *
        (1.0 - smoothstep(0.06, 0.34, abs(junctionField))) *
        shapeAppearance;
      latticePulse =
        (0.72 + 0.28 * sin(uTime * 1.35 * motion + aPhase * 2.0)) *
        shapeAppearance;
      shapedSphere += shapedDirection *
        (latticePulse - 0.86) * 0.018 * uLatticeLayer;
      shapedSphere += shapedDirection * (
        flowCore * 0.052 + flowRail * 0.03 + flowJunction * 0.036
      ) * uFilamentLayer;
    }

    vec3 deformed = mix(galaxy, cloud, ringToCloud);
    deformed = mix(deformed, energySphere, cloudToSphere);
    deformed = mix(deformed, shapedSphere, cloudToSphere * shapeAppearance);

    vec4 modelPosition = modelMatrix * vec4(deformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec3 viewNormal = normalize(normalMatrix * shapedDirection);
    vec3 viewDirection = normalize(-viewPosition.xyz);
    float facing = abs(dot(viewNormal, viewDirection));
    float sphereRim = pow(clamp(1.0 - facing, 0.0, 1.0), 2.55);

    float armWidth = mix(0.1, 0.29, radialProgress);
    float armStrength = 1.0 - smoothstep(armWidth * 0.25, armWidth, abs(scatterAngle));
    armStrength *= mix(1.0, 0.38, dustMask);
    float coreStrength = 1.0 - smoothstep(0.035, 0.24, radialProgress);
    float laneRidge = pow(
      0.5 + 0.5 * sin(radialProgress * 31.0 - theta * 1.8 - uTime * 0.16 * motion),
      8.0
    );
    float galaxyEnergy =
      0.18 +
      armStrength * 0.92 +
      coreStrength * 1.18 +
      laneRidge * (0.22 + armStrength * 0.38) +
      aIntensity * 0.34;
    float sphereEnergy =
      0.18 + sphereRim * 1.52 + crest * 0.88 + aIntensity * 0.38 +
      shapeAppearance * (shapeRidge * 0.46 + shapePole * 1.24) +
      bottomLight * 1.18 + microDetail * 0.14 +
      flowCore * 0.16 + flowRail * 0.08 + flowJunction * 0.42 +
      latticePulse * uLatticeLayer * 0.12;

    vGalaxy = 1.0 - cloudToSphere;
    vRim = mix(armStrength, sphereRim, cloudToSphere);
    vEnergy = mix(galaxyEnergy, sphereEnergy, cloudToSphere);
    vHotNode = smoothstep(0.84, 0.99, aIntensity) * (0.52 + 0.48 * aSeed);
    vDepth = clamp((-viewPosition.z - 2.8) / 6.5, 0.0, 1.0);
    vSeed = aSeed;
    vCore = coreStrength * (1.0 - cloudToSphere);
    vDust = dustMask * (1.0 - cloudToSphere);
    vShapeProgress = shapeAppearance * cloudToSphere;
    vShapeRidge = shapeRidge;
    vShapeNoise = shapeNoise * 0.5 + 0.5;
    vShapePole = shapePole;
    vFacing = facing * cloudToSphere;
    vMicroDetail = microDetail * cloudToSphere;
    vBottomLight = bottomLight * cloudToSphere;
    vFlowCore = flowCore * cloudToSphere;
    vFlowRail = flowRail * cloudToSphere;
    vFlowChannel = flowChannel * cloudToSphere;
    vFlowJunction = flowJunction * cloudToSphere;
    vLatticePulse = latticePulse * cloudToSphere;

    float cloudPulse = 0.68 + 0.32 * sin(uTime * 0.72 * motion + aPhase * 2.0);
    float spiralOpacity = 0.34 + armStrength * 0.52 + coreStrength * 0.38 + aIntensity * 0.12;
    spiralOpacity *= mix(1.0, 0.42, dustMask);
    float stageOpacity = mix(spiralOpacity, cloudPulse, ringToCloud * (1.0 - cloudToSphere));
    stageOpacity = mix(stageOpacity, 0.72 + aIntensity * 0.28, cloudToSphere);
    stageOpacity = mix(
      stageOpacity,
      0.76 + aIntensity * 0.24 + shapePole * 0.16,
      shapeAppearance * cloudToSphere
    );
    float interiorOpacity =
      shapeAppearance * cloudToSphere *
      (0.2 + aIntensity * 0.3 + microDetail * 0.28 + bottomLight * 0.22);
    float glowOpacity =
      shapeAppearance * cloudToSphere *
      (sphereRim * 0.76 + shapePole * 0.2 + bottomLight * 0.48 + flowJunction * 0.08);
    float filamentOpacity =
      shapeAppearance * cloudToSphere *
      (flowCore * 0.76 + flowRail * 0.58 + flowJunction * 0.52 +
      flowChannel * 0.07);
    float latticeOpacity =
      shapeAppearance * cloudToSphere *
      (0.3 + aIntensity * 0.24 + sphereRim * 0.36 + latticePulse * 0.18);
    stageOpacity = mix(stageOpacity, interiorOpacity, uInteriorLayer);
    stageOpacity = mix(stageOpacity, latticeOpacity, uLatticeLayer);
    stageOpacity = mix(stageOpacity, filamentOpacity, uFilamentLayer);
    stageOpacity = mix(stageOpacity, glowOpacity, uGlowLayer);
    vAlpha = appearance * stageOpacity;

    gl_Position = projectionMatrix * viewPosition;
    float perspective = clamp(6.2 / max(-viewPosition.z, 0.1), 0.48, 2.25);
    float galaxySize = mix(0.62, 1.9, aIntensity) * aSize * (1.0 + expansion * 0.14);
    float sphereSize = mix(0.82, 3.05, sphereRim) * aSize;
    float pointSize = mix(galaxySize, sphereSize, cloudToSphere);
    pointSize *= mix(mix(1.0, 0.66, dustMask), 1.0, cloudToSphere);
    pointSize *= mix(1.0, 1.32, uDetail);
    pointSize *= mix(1.0, 0.72, uInteriorLayer);
    pointSize *= mix(1.0, 0.76 + latticePulse * 0.42, uLatticeLayer);
    pointSize *= mix(
      1.0,
      0.82 + flowCore * 0.7 + flowRail * 0.36 + flowJunction * 0.82,
      uFilamentLayer
    );
    pointSize *= mix(1.0, 1.95 + sphereRim * 0.82, uGlowLayer);
    pointSize *= mix(0.9, 1.12, vHotNode);
    pointSize *= 1.0 + vShapeProgress * (
      shapePole * 0.92 + shapeRidge * 0.26 + abs(shapeNoise) * 0.12
    );
    pointSize *= 1.0 + vBottomLight * mix(0.72, 1.25, uGlowLayer);
    gl_PointSize = pointSize * perspective * uPixelRatio;
  }
`;

export const editorialGalaxyFragmentShader = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uDepthColor;
  uniform vec3 uLimeColor;
  uniform vec3 uHighlightColor;
  uniform vec3 uPearlColor;
  uniform float uDetail;
  uniform float uInteriorLayer;
  uniform float uLatticeLayer;
  uniform float uFilamentLayer;
  uniform float uGlowLayer;

  varying float vAlpha;
  varying float vEnergy;
  varying float vHotNode;
  varying float vRim;
  varying float vGalaxy;
  varying float vDepth;
  varying float vSeed;
  varying float vCore;
  varying float vDust;
  varying float vShapeProgress;
  varying float vShapeRidge;
  varying float vShapeNoise;
  varying float vShapePole;
  varying float vFacing;
  varying float vMicroDetail;
  varying float vBottomLight;
  varying float vFlowCore;
  varying float vFlowRail;
  varying float vFlowChannel;
  varying float vFlowJunction;
  varying float vLatticePulse;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radial = length(centered);
    float disc = 1.0 - smoothstep(0.31, 0.5, radial);
    if (disc <= 0.001) discard;

    float core = 1.0 - smoothstep(0.025, 0.17, radial);
    float halo = 1.0 - smoothstep(0.08, 0.5, radial);
    float rarePearl = smoothstep(0.86, 0.99, vSeed) * (0.35 + vHotNode * 0.65);
    float frontDetail = vShapeProgress * pow(clamp(vFacing, 0.0, 1.0), 1.18);
    float centerTexture =
      frontDetail *
      (0.2 + vMicroDetail * 0.8) *
      (0.52 + vShapeNoise * 0.48);

    vec3 galaxyBase = mix(uDeepColor, uDepthColor, clamp(vEnergy * 0.38 + vRim * 0.25, 0.0, 1.0));
    galaxyBase = mix(galaxyBase, uLimeColor, clamp(vHotNode * 0.36 + vRim * 0.15, 0.0, 0.58));
    galaxyBase = mix(galaxyBase, uHighlightColor, clamp(vRim * 0.16 + vCore * 0.12, 0.0, 0.24));
    galaxyBase = mix(galaxyBase, uPearlColor, vCore * (0.34 + core * 0.28));
    vec3 sphereBase = mix(uDeepColor, uLimeColor, clamp(vRim * 0.88 + vEnergy * 0.22, 0.0, 1.0));
    sphereBase = mix(sphereBase, uDepthColor, clamp(centerTexture * 0.34, 0.0, 0.36));
    sphereBase = mix(
      sphereBase,
      uHighlightColor,
      clamp(
        vShapeProgress * (vShapeRidge * 0.24 + vShapePole * 0.62) +
        vBottomLight * 0.72,
        0.0,
        0.88
      )
    );
    vec3 color = mix(sphereBase, galaxyBase, vGalaxy);
    color = mix(color, uPearlColor, core * (rarePearl * 0.52 + uDetail * 0.3));
    color = mix(
      color,
      uPearlColor,
      clamp(vShapeProgress * vShapePole * (0.46 + core * 0.34), 0.0, 0.78)
    );
    color = mix(
      color,
      uPearlColor,
      clamp(centerTexture * rarePearl * (0.24 + core * 0.42), 0.0, 0.58)
    );

    vec3 interiorColor = mix(
      uDeepColor,
      uDepthColor,
      clamp(0.16 + vShapeNoise * 0.24 + vMicroDetail * 0.28, 0.0, 0.7)
    );
    interiorColor = mix(
      interiorColor,
      uLimeColor,
      clamp(vMicroDetail * 0.22 + vHotNode * 0.18 + vBottomLight * 0.3, 0.0, 0.52)
    );
    interiorColor = mix(
      interiorColor,
      uPearlColor,
      clamp(rarePearl * centerTexture * 0.48 + vBottomLight * 0.2, 0.0, 0.56)
    );
    color = mix(color, interiorColor, uInteriorLayer);

    vec3 latticeColor = mix(
      uDeepColor,
      uDepthColor,
      clamp(0.22 + vShapeNoise * 0.16 + vLatticePulse * 0.12, 0.0, 0.56)
    );
    latticeColor = mix(
      latticeColor,
      uLimeColor,
      clamp(vRim * 0.52 + vMicroDetail * 0.14 + vBottomLight * 0.32, 0.0, 0.78)
    );
    latticeColor = mix(
      latticeColor,
      uHighlightColor,
      clamp(vRim * 0.26 + rarePearl * 0.18 + vBottomLight * 0.44, 0.0, 0.72)
    );
    color = mix(color, latticeColor, uLatticeLayer);

    vec3 filamentColor = mix(
      uDepthColor,
      uLimeColor,
      clamp(0.28 + vFlowRail * 0.3 + vMicroDetail * 0.12, 0.0, 0.72)
    );
    filamentColor = mix(
      filamentColor,
      uHighlightColor,
      clamp(vFlowCore * 0.72 + vFlowRail * 0.18 + vBottomLight * 0.28, 0.0, 0.86)
    );
    filamentColor = mix(
      filamentColor,
      uPearlColor,
      clamp(vFlowJunction * 0.78 + rarePearl * vFlowCore * 0.22, 0.0, 0.88)
    );
    color = mix(color, filamentColor, uFilamentLayer);

    vec3 glowColor = mix(uLimeColor, uHighlightColor, clamp(vRim * 0.5 + vBottomLight * 0.38, 0.0, 1.0));
    glowColor = mix(
      glowColor,
      uPearlColor,
      clamp(vRim * 0.32 + vShapePole * 0.46 + vBottomLight * 0.72, 0.0, 0.92)
    );
    color = mix(color, glowColor, uGlowLayer);

    float brightness =
      0.28 +
      vEnergy * 0.58 +
      vRim * 0.66 +
      vCore * vGalaxy * 0.62 +
      core * (0.1 + vHotNode * 0.82) +
      vShapeProgress * (vShapeRidge * 0.32 + vShapePole * 1.25 + vShapeNoise * 0.08) +
      centerTexture * (0.18 + vMicroDetail * 0.3) +
      vBottomLight * 1.12;
    brightness *= mix(1.0, 0.7, vDepth * vGalaxy);
    brightness *= mix(1.0, 1.2, uDetail);
    float interiorBrightness =
      0.18 + vShapeNoise * 0.22 + vMicroDetail * 0.38 + vHotNode * 0.24 +
      vBottomLight * 0.56;
    float latticeBrightness =
      0.24 + vFacing * 0.24 + vRim * 0.82 + vLatticePulse * 0.24 +
      vMicroDetail * 0.16 + vBottomLight * 0.92;
    float filamentBrightness =
      0.3 + vFlowCore * 0.9 + vFlowRail * 0.52 + vFlowJunction * 1.05 +
      vBottomLight * 0.68 + vHotNode * 0.1;
    float glowBrightness =
      0.42 + vRim * 1.38 + vShapePole * 0.62 + vBottomLight * 1.42;
    float shellLayer = 1.0 - clamp(
      uInteriorLayer + uLatticeLayer + uFilamentLayer + uGlowLayer,
      0.0,
      1.0
    );
    brightness *= mix(1.0, 0.69, vFlowChannel * vShapeProgress * shellLayer);
    brightness = mix(brightness, interiorBrightness, uInteriorLayer);
    brightness = mix(brightness, latticeBrightness, uLatticeLayer);
    brightness = mix(brightness, filamentBrightness, uFilamentLayer);
    brightness = mix(brightness, glowBrightness, uGlowLayer);

    float opacity = mix(0.07, 0.48, clamp(vEnergy * 0.62 + vRim * 0.5, 0.0, 1.0));
    opacity += vHotNode * 0.08 + uDetail * 0.05;
    opacity += vShapeProgress * (vShapeRidge * 0.035 + vShapePole * 0.09) +
      centerTexture * 0.045 + vBottomLight * 0.052;
    opacity *= mix(1.0, 0.58, vDust);
    opacity *= mix(1.08, 0.82, vGalaxy);
    float interiorOpacity =
      0.055 + frontDetail * 0.042 + vMicroDetail * 0.082 + vHotNode * 0.045 +
      vBottomLight * 0.075;
    float latticeOpacity =
      0.045 + vFacing * 0.034 + vRim * 0.13 + vLatticePulse * 0.042 +
      vHotNode * 0.035 + vBottomLight * 0.075;
    float filamentOpacity =
      0.018 + vFlowCore * 0.23 + vFlowRail * 0.145 + vFlowJunction * 0.2 +
      vFlowChannel * 0.012;
    float glowOpacity =
      vRim * 0.13 + vRim * vRim * 0.19 + vShapePole * 0.045 +
      vBottomLight * 0.2;
    opacity *= mix(1.0, 0.78, vFlowChannel * vShapeProgress * shellLayer);
    opacity = mix(opacity, interiorOpacity, uInteriorLayer);
    opacity = mix(opacity, latticeOpacity, uLatticeLayer);
    opacity = mix(opacity, filamentOpacity, uFilamentLayer);
    opacity = mix(opacity, glowOpacity, uGlowLayer);
    float spriteMask = mix(disc, halo, clamp(uDetail + uGlowLayer, 0.0, 1.0));
    opacity *= vAlpha * spriteMask;

    gl_FragColor = vec4(color * brightness, opacity);
  }
`;
