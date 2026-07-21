import type { StarGeometryData } from "./heroTypes";

function hash(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

export function createStarGeometry(count: number, layer: number): StarGeometryData {
  const position = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const brightness = new Float32Array(count);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);
  const colorMix = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const sizeSeed = hash(index, 4 + layer);
    const brightnessSeed = hash(index, 5 + layer);
    position[offset] = (hash(index, 1 + layer) - 0.5) * (18 + layer * 2);
    position[offset + 1] = (hash(index, 2 + layer) - 0.5) * (12 + layer);
    position[offset + 2] = -2 - hash(index, 3 + layer) * 15;
    size[index] =
      0.62 +
      sizeSeed * (0.86 + layer * 0.2) +
      (sizeSeed > 0.965 ? 0.9 + sizeSeed * 0.55 : 0);
    brightness[index] =
      0.52 +
      Math.pow(brightnessSeed, 2) * 0.88 +
      (brightnessSeed > 0.972 ? 0.72 : 0);
    phase[index] = hash(index, 6 + layer) * Math.PI * 2;
    speed[index] = 0.55 + hash(index, 7 + layer) * 0.9;
    colorMix[index] = hash(index, 8 + layer) > 0.975 ? 0.18 : 0;
  }

  return { position, size, brightness, phase, speed, colorMix };
}
