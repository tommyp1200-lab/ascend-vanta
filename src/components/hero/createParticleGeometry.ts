import type { ParticleGeometryData } from "./heroTypes";

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createParticleGeometry(
  count: number,
  radius: number,
  seedValue = 0x41564345,
): ParticleGeometryData {
  const random = mulberry32(seedValue);
  const sphere = new Float32Array(count * 3);
  const field = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const phase = new Float32Array(count);
  const size = new Float32Array(count);
  const intensity = new Float32Array(count);
  const survivor = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const gridColumns = Math.max(12, Math.ceil(Math.sqrt(count * 1.7)));
  const gridRows = Math.max(8, Math.ceil(count / gridColumns));

  for (let index = 0; index < count; index += 1) {
    const normalized = (index + 0.5) / count;
    const y = 1 - normalized * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    const jitter = (random() - 0.5) * 0.018;
    const particleRadius = radius * (1 + jitter);
    const offset = index * 3;

    sphere[offset] = Math.cos(angle) * radial * particleRadius;
    sphere[offset + 1] = y * particleRadius;
    sphere[offset + 2] = Math.sin(angle) * radial * particleRadius;

    const gridX = index % gridColumns;
    const gridY = Math.floor(index / gridColumns);
    const normalizedX = gridX / Math.max(gridColumns - 1, 1) - 0.5;
    const normalizedY = gridY / Math.max(gridRows - 1, 1) - 0.5;
    const gridJitter = (random() - 0.5) * 0.018;
    field[offset] = normalizedX * 12.4 + gridJitter;
    field[offset + 1] = normalizedY * 7.2 + gridJitter;
    field[offset + 2] = -3.8 - Math.abs(normalizedX) * 1.4 + Math.sin(normalizedX * Math.PI) * 0.18;

    seed[index] = random();
    phase[index] = random() * Math.PI * 2;
    size[index] = 0.72 + random() * 1.35;
    intensity[index] = Math.pow(random(), 1.7);
    survivor[index] = random();
  }

  return { sphere, field, seed, phase, size, intensity, survivor };
}
