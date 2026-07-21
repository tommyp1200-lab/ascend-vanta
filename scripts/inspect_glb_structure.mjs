import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: node scripts/inspect_glb_structure.mjs file.glb [...]");
  process.exit(1);
}

function inspectGlb(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${file} is not a binary glTF file`);
  }

  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.toString("utf8", 16, 20);
  if (jsonChunkType !== "JSON") {
    throw new Error(`${file} has no leading JSON chunk`);
  }

  const json = JSON.parse(buffer.toString("utf8", 20, 20 + jsonChunkLength));
  const accessors = json.accessors ?? [];
  const meshes = json.meshes ?? [];
  const nodes = json.nodes ?? [];
  const skins = json.skins ?? [];
  const animations = json.animations ?? [];
  const images = json.images ?? [];
  const textures = json.textures ?? [];
  const materials = json.materials ?? [];

  let estimatedTriangles = 0;
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives ?? []) {
      const indexAccessor = primitive.indices == null ? null : accessors[primitive.indices];
      const positionAccessor = accessors[primitive.attributes?.POSITION];
      const vertexOrIndexCount = indexAccessor?.count ?? positionAccessor?.count ?? 0;
      const mode = primitive.mode ?? 4;
      if (mode === 4) estimatedTriangles += Math.floor(vertexOrIndexCount / 3);
      else if (mode === 5 || mode === 6) estimatedTriangles += Math.max(0, vertexOrIndexCount - 2);
    }
  }

  const report = {
    file: path.resolve(file),
    bytes: buffer.length,
    version,
    declaredLength,
    asset: json.asset,
    extensionsUsed: json.extensionsUsed ?? [],
    extensionsRequired: json.extensionsRequired ?? [],
    counts: {
      scenes: json.scenes?.length ?? 0,
      nodes: nodes.length,
      meshes: meshes.length,
      accessors: accessors.length,
      bufferViews: json.bufferViews?.length ?? 0,
      materials: materials.length,
      textures: textures.length,
      images: images.length,
      skins: skins.length,
      animations: animations.length,
      estimatedTriangles,
    },
    sceneNames: (json.scenes ?? []).map((scene) => scene.name ?? null),
    nodeNames: nodes.map((node) => node.name ?? null),
    meshNames: meshes.map((mesh) => mesh.name ?? null),
    materialNames: materials.map((material) => material.name ?? null),
    skins: skins.map((skin) => ({
      name: skin.name ?? null,
      joints: skin.joints?.length ?? 0,
      skeleton: skin.skeleton == null ? null : nodes[skin.skeleton]?.name ?? skin.skeleton,
    })),
    animations: animations.map((animation) => ({
      name: animation.name ?? null,
      channels: animation.channels?.length ?? 0,
      targets: [...new Set((animation.channels ?? []).map((channel) => {
        const target = channel.target ?? {};
        return `${nodes[target.node]?.name ?? target.node ?? "unknown"}.${target.path ?? "unknown"}`;
      }))],
    })),
    images: images.map((image) => ({
      name: image.name ?? null,
      mimeType: image.mimeType ?? null,
      bufferView: image.bufferView ?? null,
      uri: image.uri ?? null,
    })),
  };

  return report;
}

for (const file of files) {
  console.log(JSON.stringify(inspectGlb(file), null, 2));
}
