import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "../node_modules/three/examples/jsm/libs/opentype.module.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const fontPath = process.argv[2] ?? "/tmp/ethnocentric-font/Ethnocentric-Regular.otf";
const outputDirectory = process.argv[3] ?? path.join(projectRoot, "output", "wordmark");

const WORDMARK = "ASCEND VANTA";
const WIDTH = 2400;
const HEIGHT = 520;
const PREVIEW_HEIGHT = 720;
const FONT_SIZE = 220;
const TRACKING = -15;
const BASELINE = 280;

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function fontArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function buildLetterLayout(font) {
  const scale = FONT_SIZE / font.unitsPerEm;
  const chars = Array.from(WORDMARK);
  const raw = [];
  let cursor = 0;
  let previousGlyph = null;

  for (let index = 0; index < chars.length; index += 1) {
    const character = chars[index];
    const glyph = font.charToGlyph(character);
    if (previousGlyph) cursor += font.getKerningValue(previousGlyph, glyph) * scale;

    if (character === " ") {
      cursor += glyph.advanceWidth * scale + 25;
      previousGlyph = glyph;
      continue;
    }

    const bounds = glyph.getBoundingBox();
    raw.push({
      character,
      glyph,
      index,
      x: cursor,
      bounds: {
        x1: cursor + bounds.x1 * scale,
        x2: cursor + bounds.x2 * scale,
        y1: BASELINE - bounds.y2 * scale,
        y2: BASELINE - bounds.y1 * scale,
      },
    });
    cursor += glyph.advanceWidth * scale + TRACKING;
    previousGlyph = glyph;
  }

  const minX = Math.min(...raw.map((item) => item.bounds.x1));
  const maxX = Math.max(...raw.map((item) => item.bounds.x2));
  const offsetX = (WIDTH - (maxX - minX)) / 2 - minX;

  return raw.map((item, ordinal) => {
    const pathData = item.glyph.getPath(item.x + offsetX, BASELINE, FONT_SIZE).toPathData(2);
    const occurrence = raw.slice(0, ordinal + 1).filter((candidate) => candidate.character === item.character).length;
    return {
      ...item,
      x: item.x + offsetX,
      bounds: {
        ...item.bounds,
        x1: item.bounds.x1 + offsetX,
        x2: item.bounds.x2 + offsetX,
      },
      id: `letter-${item.character}-${occurrence}`,
      pathData,
    };
  });
}

function points(values) {
  return values.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function buildSvg(font) {
  const letters = buildLetterLayout(font);
  const firstA = letters.find((letter) => letter.character === "A");
  const finalA = letters.findLast((letter) => letter.character === "A");
  const eLetter = letters.find((letter) => letter.character === "E");
  if (!firstA || !finalA || !eLetter) throw new Error("Required wordmark glyphs were not found.");

  const left = firstA.bounds.x1 - 12;
  const right = finalA.bounds.x2 + 12;
  const wordGapCenter = (letters[5].bounds.x2 + letters[6].bounds.x1) / 2;
  const railTop = 306;
  const railBottom = 330;
  const notchBottom = 370;
  const railPath = [
    `M ${left.toFixed(1)} ${railTop}`,
    `L ${(firstA.bounds.x1 + 51).toFixed(1)} ${railTop}`,
    `L ${(firstA.bounds.x1 + 78).toFixed(1)} ${railBottom}`,
    `L ${(wordGapCenter - 105).toFixed(1)} ${railBottom}`,
    `L ${(wordGapCenter - 42).toFixed(1)} ${railBottom + 4}`,
    `L ${wordGapCenter.toFixed(1)} ${notchBottom}`,
    `L ${(wordGapCenter + 42).toFixed(1)} ${railBottom + 4}`,
    `L ${(finalA.bounds.x2 - 78).toFixed(1)} ${railBottom}`,
    `L ${(finalA.bounds.x2 - 51).toFixed(1)} ${railTop}`,
    `L ${right.toFixed(1)} ${railTop}`,
    `L ${(finalA.bounds.x2 - 37).toFixed(1)} ${railBottom + 20}`,
    `L ${(wordGapCenter + 53).toFixed(1)} ${railBottom + 20}`,
    `L ${wordGapCenter.toFixed(1)} ${notchBottom + 24}`,
    `L ${(wordGapCenter - 53).toFixed(1)} ${railBottom + 20}`,
    `L ${(firstA.bounds.x1 + 37).toFixed(1)} ${railBottom + 20}`,
    "Z",
  ].join(" ");

  const firstAMiddle = (firstA.bounds.x1 + firstA.bounds.x2) / 2;
  const finalAMiddle = (finalA.bounds.x1 + finalA.bounds.x2) / 2;
  const firstAAccent = points([
    [firstAMiddle, BASELINE - 68],
    [firstAMiddle + 39, BASELINE - 20],
    [firstAMiddle + 24, BASELINE - 20],
    [firstAMiddle + 17, railTop + 15],
    [firstAMiddle - 17, railTop + 15],
    [firstAMiddle - 24, BASELINE - 20],
    [firstAMiddle - 39, BASELINE - 20],
  ]);
  const finalAAccent = points([
    [finalAMiddle, BASELINE - 68],
    [finalAMiddle + 39, BASELINE - 20],
    [finalAMiddle + 24, BASELINE - 20],
    [finalAMiddle + 17, railTop + 15],
    [finalAMiddle - 17, railTop + 15],
    [finalAMiddle - 24, BASELINE - 20],
    [finalAMiddle - 39, BASELINE - 20],
  ]);
  const eAccent = points([
    [eLetter.bounds.x1 + 103, BASELINE - 103],
    [eLetter.bounds.x1 + 153, BASELINE - 103],
    [eLetter.bounds.x1 + 137, BASELINE - 89],
    [eLetter.bounds.x1 + 87, BASELINE - 89],
  ]);

  const letterPaths = letters
    .map((letter) => `      <path id="${letter.id}" data-character="${letter.character}" d="${letter.pathData}"/>`)
    .join("\n");
  const extrusionLayers = Array.from({ length: 12 }, (_, index) => {
    const amount = 16 - index * 1.15;
    const opacity = 0.82 + index * 0.012;
    return `    <use href="#wordmark-geometry" transform="translate(${amount.toFixed(2)} ${amount.toFixed(2)})" fill="url(#extrusion-${index % 2})" stroke="#080b0f" stroke-width="2" opacity="${opacity.toFixed(2)}"/>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="wordmark-title" data-wordmark="${escapeXml(WORDMARK)}">
  <title id="wordmark-title">${escapeXml(WORDMARK)}</title>
  <defs>
    <linearGradient id="chrome-face" x1="0" y1="104" x2="0" y2="298" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.15" stop-color="#d8dce0"/>
      <stop offset="0.34" stop-color="#777e85"/>
      <stop offset="0.48" stop-color="#f8fafb"/>
      <stop offset="0.68" stop-color="#9aa1a7"/>
      <stop offset="0.84" stop-color="#eef1f3"/>
      <stop offset="1" stop-color="#737b82"/>
    </linearGradient>
    <linearGradient id="chrome-edge" x1="0" y1="110" x2="0" y2="305" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.42" stop-color="#b5bcc2"/>
      <stop offset="0.7" stop-color="#4c555d"/>
      <stop offset="1" stop-color="#f2f5f6"/>
    </linearGradient>
    <linearGradient id="rail-face" x1="0" y1="320" x2="0" y2="416" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#f8fafb"/>
      <stop offset="0.28" stop-color="#92999f"/>
      <stop offset="0.55" stop-color="#f0f2f3"/>
      <stop offset="1" stop-color="#545d64"/>
    </linearGradient>
    <linearGradient id="ascend-green" x1="0" y1="220" x2="0" y2="416" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#eaff8f"/>
      <stop offset="0.35" stop-color="#cfff04"/>
      <stop offset="1" stop-color="#a8d900"/>
    </linearGradient>
    <linearGradient id="extrusion-0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5e676d"/>
      <stop offset="0.42" stop-color="#20272c"/>
      <stop offset="1" stop-color="#080b0f"/>
    </linearGradient>
    <linearGradient id="extrusion-1" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#11171b"/>
      <stop offset="0.5" stop-color="#485159"/>
      <stop offset="1" stop-color="#0a0d11"/>
    </linearGradient>
    <filter id="green-glow" x="-30%" y="-80%" width="160%" height="260%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur"/>
      <feColorMatrix in="blur" values="1 0 0 0 0.68  0 1 0 0 1  0 0 1 0 0.02  0 0 0 0.9 0" result="greenBlur"/>
      <feMerge><feMergeNode in="greenBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="wordmark-shadow" x="-10%" y="-30%" width="130%" height="190%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
      <feOffset in="blur" dx="8" dy="13" result="offset"/>
      <feColorMatrix in="offset" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.75 0" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <g id="letterforms" fill-rule="nonzero">
${letterPaths}
    </g>
    <path id="underline-rail" d="${railPath}"/>
    <g id="wordmark-geometry">
      <use href="#letterforms"/>
      <use href="#underline-rail"/>
    </g>
    <clipPath id="letter-clip"><use href="#letterforms"/></clipPath>
  </defs>

  <g id="ascend-vanta-wordmark" filter="url(#wordmark-shadow)">
    <g id="green-underglow" filter="url(#green-glow)" opacity="0.55">
      <path d="M ${left.toFixed(1)} ${railBottom + 15} L ${(wordGapCenter - 55).toFixed(1)} ${railBottom + 15} L ${wordGapCenter.toFixed(1)} ${notchBottom + 26} L ${(wordGapCenter + 55).toFixed(1)} ${railBottom + 15} L ${right.toFixed(1)} ${railBottom + 15}" fill="none" stroke="#cfff04" stroke-width="7" stroke-linejoin="miter"/>
    </g>

${extrusionLayers}

    <use href="#wordmark-geometry" fill="url(#chrome-face)" stroke="#222a30" stroke-width="7" stroke-linejoin="miter"/>
    <use href="#underline-rail" fill="url(#rail-face)" stroke="url(#chrome-edge)" stroke-width="3" stroke-linejoin="miter"/>

    <g id="ascend-green-accents" fill="url(#ascend-green)" stroke="#d9ff5a" stroke-width="1.5" filter="url(#green-glow)">
      <polygon id="opening-a-connection" points="${firstAAccent}"/>
      <polygon id="terminal-a-connection" points="${finalAAccent}"/>
      <polygon id="e-speed-cut" points="${eAccent}"/>
      <path id="center-rail-lock" d="M ${(wordGapCenter - 42).toFixed(1)} ${railBottom + 4} L ${wordGapCenter.toFixed(1)} ${notchBottom} L ${(wordGapCenter + 42).toFixed(1)} ${railBottom + 4} L ${(wordGapCenter + 24).toFixed(1)} ${railBottom + 4} L ${wordGapCenter.toFixed(1)} ${notchBottom - 17} L ${(wordGapCenter - 24).toFixed(1)} ${railBottom + 4} Z"/>
    </g>

    <use href="#letterforms" fill="url(#chrome-face)" stroke="url(#chrome-edge)" stroke-width="3.2" stroke-linejoin="miter"/>
    <use href="#letterforms" fill="none" stroke="#ffffff" stroke-opacity="0.48" stroke-width="1.2" stroke-linejoin="miter"/>
    <path d="M 90 119 H 2310" clip-path="url(#letter-clip)" stroke="#ffffff" stroke-opacity="0.72" stroke-width="18" filter="blur(10px)"/>
  </g>
</svg>`;
}

function buildPreviewBackground() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PREVIEW_HEIGHT}" viewBox="0 0 ${WIDTH} ${PREVIEW_HEIGHT}">
      <defs>
        <radialGradient id="bg" cx="50%" cy="48%" r="65%">
          <stop offset="0" stop-color="#11171a"/>
          <stop offset="0.46" stop-color="#05090d"/>
          <stop offset="1" stop-color="#010204"/>
        </radialGradient>
        <radialGradient id="aura" cx="50%" cy="55%" r="42%">
          <stop offset="0" stop-color="#cfff04" stop-opacity="0.08"/>
          <stop offset="0.52" stop-color="#a8d900" stop-opacity="0.025"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${WIDTH}" height="${PREVIEW_HEIGHT}" fill="url(#bg)"/>
      <rect width="${WIDTH}" height="${PREVIEW_HEIGHT}" fill="url(#aura)"/>
    </svg>
  `);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const fontBuffer = await readFile(fontPath);
  const font = opentype.parse(fontArrayBuffer(fontBuffer));
  const svg = buildSvg(font);

  const svgPath = path.join(outputDirectory, "ascend-vanta-wordmark.svg");
  const transparentPath = path.join(outputDirectory, "ascend-vanta-wordmark-transparent.png");
  const previewPath = path.join(outputDirectory, "ascend-vanta-wordmark-preview.png");

  await writeFile(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(transparentPath);

  await sharp(buildPreviewBackground())
    .composite([{ input: Buffer.from(svg), top: 100, left: 0 }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(previewPath);

  const transparentMetadata = await sharp(transparentPath).metadata();
  const previewMetadata = await sharp(previewPath).metadata();

  process.stdout.write(JSON.stringify({
    text: WORDMARK,
    font: font.names.fullName?.en ?? "Ethnocentric Regular",
    files: { previewPath, transparentPath, svgPath },
    transparent: {
      width: transparentMetadata.width,
      height: transparentMetadata.height,
      hasAlpha: transparentMetadata.hasAlpha,
      channels: transparentMetadata.channels,
    },
    preview: {
      width: previewMetadata.width,
      height: previewMetadata.height,
      hasAlpha: previewMetadata.hasAlpha,
    },
  }, null, 2));
}

await main();
