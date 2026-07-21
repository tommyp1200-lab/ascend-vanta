import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

const COMPONENT_BYTE = 5120;
const COMPONENT_UNSIGNED_BYTE = 5121;
const COMPONENT_SHORT = 5122;
const COMPONENT_UNSIGNED_SHORT = 5123;
const COMPONENT_UNSIGNED_INT = 5125;
const COMPONENT_FLOAT = 5126;

const TARGET_ARRAY_BUFFER = 34962;
const TARGET_ELEMENT_ARRAY_BUFFER = 34963;
const TRIANGLES = 4;

const TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const COMPONENT_SIZES = {
  [COMPONENT_BYTE]: 1,
  [COMPONENT_UNSIGNED_BYTE]: 1,
  [COMPONENT_SHORT]: 2,
  [COMPONENT_UNSIGNED_SHORT]: 2,
  [COMPONENT_UNSIGNED_INT]: 4,
  [COMPONENT_FLOAT]: 4,
};

const [, , inputPath, outputPath, qualityArg = 'balanced'] = process.argv;

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/optimize-vanta-robot-glb.mjs input.glb output.glb [safe|balanced|aggressive|web|fast|runtime]');
}

const QUALITY = {
  safe: {
    Head: { ratio: 0.62, error: 0.008 },
    Torso: { ratio: 0.52, error: 0.01 },
    default: { ratio: 0.48, error: 0.012 },
  },
  balanced: {
    Head: { ratio: 0.48, error: 0.012 },
    Torso: { ratio: 0.42, error: 0.014 },
    default: { ratio: 0.38, error: 0.016 },
  },
  aggressive: {
    Head: { ratio: 0.38, error: 0.018 },
    Torso: { ratio: 0.34, error: 0.02 },
    default: { ratio: 0.3, error: 0.024 },
  },
  web: {
    Head: { ratio: 0.26, error: 0.024 },
    Torso: { ratio: 0.22, error: 0.026 },
    default: { ratio: 0.18, error: 0.03 },
  },
  fast: {
    Head: { ratio: 0.18, error: 0.032 },
    Torso: { ratio: 0.14, error: 0.036 },
    default: { ratio: 0.12, error: 0.04 },
  },
  runtime: {
    Head: { ratio: 0.14, error: 0.034 },
    HeadShell: { ratio: 0.12, error: 0.032 },
    Torso: { ratio: 0.095, error: 0.04 },
    TorsoShell: { ratio: 0.095, error: 0.038 },
    default: { ratio: 0.075, error: 0.046 },
  },
};

const quality = QUALITY[qualityArg];

if (!quality) {
  throw new Error(`Unknown quality "${qualityArg}". Use safe, balanced, aggressive, web, fast, or runtime.`);
}

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);

function align4(value) {
  return (value + 3) & ~3;
}

function padBuffer(buffer, padByte = 0) {
  const aligned = align4(buffer.length);

  if (aligned === buffer.length) {
    return buffer;
  }

  return Buffer.concat([buffer, Buffer.alloc(aligned - buffer.length, padByte)]);
}

function parseGlb(fileBuffer) {
  if (fileBuffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error('Input is not a GLB file.');
  }

  const version = fileBuffer.readUInt32LE(4);
  const totalLength = fileBuffer.readUInt32LE(8);

  if (version !== 2 || totalLength !== fileBuffer.length) {
    throw new Error(`Unsupported or invalid GLB header. Version ${version}.`);
  }

  let offset = 12;
  let json = null;
  let bin = null;

  while (offset < fileBuffer.length) {
    const chunkLength = fileBuffer.readUInt32LE(offset);
    const chunkType = fileBuffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunk = fileBuffer.subarray(chunkStart, chunkStart + chunkLength);

    if (chunkType === JSON_CHUNK_TYPE) {
      json = JSON.parse(chunk.toString('utf8').trimEnd());
    } else if (chunkType === BIN_CHUNK_TYPE) {
      bin = chunk;
    }

    offset = chunkStart + chunkLength;
  }

  if (!json || !bin) {
    throw new Error('GLB is missing a JSON or BIN chunk.');
  }

  return { json, bin };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeBufferViews(json, bin) {
  return json.bufferViews.map((view, index) => {
    const extension = view.extensions?.EXT_meshopt_compression;

    if (!extension) {
      const byteOffset = view.byteOffset ?? 0;
      const byteLength = view.byteLength ?? 0;

      return {
        index,
        bytes: Buffer.from(bin.subarray(byteOffset, byteOffset + byteLength)),
        byteStride: view.byteStride,
        target: view.target,
        compressed: false,
      };
    }

    const byteStride = extension.byteStride;
    const target = Buffer.alloc(extension.count * byteStride);
    const source = bin.subarray(
      extension.byteOffset ?? 0,
      (extension.byteOffset ?? 0) + extension.byteLength,
    );

    MeshoptDecoder.decodeGltfBuffer(
      target,
      extension.count,
      byteStride,
      source,
      extension.mode,
      extension.filter,
    );

    return {
      index,
      bytes: target,
      byteStride,
      target: view.target,
      compressed: true,
    };
  });
}

function accessorElementSize(accessor) {
  return TYPE_SIZES[accessor.type] * COMPONENT_SIZES[accessor.componentType];
}

function accessorItemSize(accessor) {
  return TYPE_SIZES[accessor.type];
}

function getAccessorDataView(decodedViews, json, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const view = decodedViews[accessor.bufferView];

  return {
    accessor,
    dataView: new DataView(view.bytes.buffer, view.bytes.byteOffset, view.bytes.byteLength),
    byteOffset: accessor.byteOffset ?? 0,
    byteStride: view.byteStride ?? json.bufferViews[accessor.bufferView].byteStride ?? accessorElementSize(accessor),
  };
}

function readFloatAttribute(decodedViews, json, accessorIndex, itemSize) {
  const { accessor, dataView, byteOffset, byteStride } = getAccessorDataView(
    decodedViews,
    json,
    accessorIndex,
  );

  if (accessor.componentType !== COMPONENT_FLOAT) {
    throw new Error(`Accessor ${accessorIndex} must be FLOAT for this optimizer.`);
  }

  const values = new Float32Array(accessor.count * itemSize);

  for (let index = 0; index < accessor.count; index += 1) {
    const base = byteOffset + index * byteStride;

    for (let item = 0; item < itemSize; item += 1) {
      values[index * itemSize + item] = dataView.getFloat32(base + item * 4, true);
    }
  }

  return values;
}

function readIndices(decodedViews, json, accessorIndex) {
  const { accessor, dataView, byteOffset } = getAccessorDataView(decodedViews, json, accessorIndex);
  const indices = new Uint32Array(accessor.count);

  if (accessor.componentType === COMPONENT_UNSIGNED_SHORT) {
    for (let index = 0; index < accessor.count; index += 1) {
      indices[index] = dataView.getUint16(byteOffset + index * 2, true);
    }

    return indices;
  }

  if (accessor.componentType === COMPONENT_UNSIGNED_INT) {
    for (let index = 0; index < accessor.count; index += 1) {
      indices[index] = dataView.getUint32(byteOffset + index * 4, true);
    }

    return indices;
  }

  throw new Error(`Accessor ${accessorIndex} uses unsupported index type ${accessor.componentType}.`);
}

function readAccessorTightly(decodedViews, json, accessorIndex) {
  const { accessor, dataView, byteOffset, byteStride } = getAccessorDataView(
    decodedViews,
    json,
    accessorIndex,
  );
  const elementSize = accessorElementSize(accessor);
  const values = Buffer.alloc(accessor.count * elementSize);

  for (let index = 0; index < accessor.count; index += 1) {
    const sourceOffset = byteOffset + index * byteStride;

    for (let byte = 0; byte < elementSize; byte += 1) {
      values[index * elementSize + byte] = dataView.getUint8(sourceOffset + byte);
    }
  }

  return values;
}

function boundsForPositions(positions) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

  for (let index = 0; index < positions.length; index += 3) {
    min[0] = Math.min(min[0], positions[index]);
    min[1] = Math.min(min[1], positions[index + 1]);
    min[2] = Math.min(min[2], positions[index + 2]);
    max[0] = Math.max(max[0], positions[index]);
    max[1] = Math.max(max[1], positions[index + 1]);
    max[2] = Math.max(max[2], positions[index + 2]);
  }

  return { min, max };
}

function minMaxForFloatAttribute(values, itemSize) {
  const min = Array.from({ length: itemSize }, () => Number.POSITIVE_INFINITY);
  const max = Array.from({ length: itemSize }, () => Number.NEGATIVE_INFINITY);

  for (let index = 0; index < values.length; index += itemSize) {
    for (let item = 0; item < itemSize; item += 1) {
      min[item] = Math.min(min[item], values[index + item]);
      max[item] = Math.max(max[item], values[index + item]);
    }
  }

  return { min, max };
}

function compactSimplifiedMesh(indices, positions, normals, uvs) {
  const [remap, vertexCount] = MeshoptSimplifier.compactMesh(indices);
  const oldIndexByNewIndex = new Uint32Array(vertexCount);

  oldIndexByNewIndex.fill(0xffffffff);

  for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
    const newIndex = remap[oldIndex];

    if (newIndex < vertexCount && oldIndexByNewIndex[newIndex] === 0xffffffff) {
      oldIndexByNewIndex[newIndex] = oldIndex;
    }
  }

  const compactPositions = new Float32Array(vertexCount * 3);
  const compactNormals = new Float32Array(vertexCount * 3);
  const compactUvs = new Float32Array(vertexCount * 2);

  for (let newIndex = 0; newIndex < vertexCount; newIndex += 1) {
    const oldIndex =
      oldIndexByNewIndex[newIndex] === 0xffffffff ? 0 : oldIndexByNewIndex[newIndex];

    compactPositions.set(positions.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactNormals.set(normals.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactUvs.set(uvs.subarray(oldIndex * 2, oldIndex * 2 + 2), newIndex * 2);
  }

  return {
    indices,
    normals: compactNormals,
    positions: compactPositions,
    uvs: compactUvs,
    vertexCount,
  };
}

function bytesFromTypedArray(values) {
  return Buffer.from(values.buffer, values.byteOffset, values.byteLength);
}

function addPart(parts, buffer) {
  const offset = parts.reduce((sum, part) => sum + part.length, 0);
  const byteOffset = align4(offset);
  const padding = byteOffset - offset;

  if (padding > 0) {
    parts.push(Buffer.alloc(padding));
  }

  parts.push(padBuffer(buffer));

  return byteOffset;
}

function pushRawView(parts, json, buffer, target) {
  const byteOffset = addPart(parts, buffer);
  const viewIndex = json.bufferViews.length;

  json.bufferViews.push({
    buffer: 0,
    byteOffset,
    byteLength: buffer.length,
    ...(target ? { target } : {}),
  });

  return viewIndex;
}

function pushMeshoptView(parts, json, rawBuffer, count, byteStride, mode, target) {
  const compressed = Buffer.from(
    MeshoptEncoder.encodeGltfBuffer(rawBuffer, count, byteStride, mode),
  );
  const byteOffset = addPart(parts, compressed);
  const viewIndex = json.bufferViews.length;

  json.bufferViews.push({
    buffer: 0,
    byteLength: rawBuffer.length,
    ...(target ? { target } : {}),
    extensions: {
      EXT_meshopt_compression: {
        buffer: 0,
        byteOffset,
        byteLength: compressed.length,
        byteStride,
        count,
        mode,
      },
    },
  });

  return viewIndex;
}

function writeFloatAccessor(parts, json, accessorIndex, values, itemSize, target) {
  const accessor = json.accessors[accessorIndex];
  const raw = bytesFromTypedArray(values);
  const viewIndex = pushMeshoptView(parts, json, raw, values.length / itemSize, itemSize * 4, 'ATTRIBUTES', target);
  const { min, max } = minMaxForFloatAttribute(values, itemSize);

  accessor.bufferView = viewIndex;
  accessor.byteOffset = 0;
  accessor.componentType = COMPONENT_FLOAT;
  accessor.count = values.length / itemSize;
  accessor.normalized = false;
  accessor.min = min;
  accessor.max = max;
  delete accessor.sparse;
}

function writeIndexAccessor(parts, json, accessorIndex, indices, vertexCount) {
  const accessor = json.accessors[accessorIndex];
  const useShort = vertexCount <= 65535;
  const raw = Buffer.alloc(indices.length * (useShort ? 2 : 4));

  for (let index = 0; index < indices.length; index += 1) {
    if (useShort) {
      raw.writeUInt16LE(indices[index], index * 2);
    } else {
      raw.writeUInt32LE(indices[index], index * 4);
    }
  }

  const viewIndex = pushMeshoptView(
    parts,
    json,
    raw,
    indices.length,
    useShort ? 2 : 4,
    'TRIANGLES',
    TARGET_ELEMENT_ARRAY_BUFFER,
  );

  accessor.bufferView = viewIndex;
  accessor.byteOffset = 0;
  accessor.componentType = useShort ? COMPONENT_UNSIGNED_SHORT : COMPONENT_UNSIGNED_INT;
  accessor.count = indices.length;
  accessor.min = [0];
  accessor.max = [vertexCount - 1];
  delete accessor.sparse;
}

function copyAccessor(parts, sourceJson, outputJson, decodedViews, accessorIndex, handledAccessors) {
  if (handledAccessors.has(accessorIndex)) {
    return;
  }

  const accessor = outputJson.accessors[accessorIndex];
  const sourceAccessor = sourceJson.accessors[accessorIndex];
  const sourceView = sourceJson.bufferViews[sourceAccessor.bufferView];
  const raw = readAccessorTightly(decodedViews, sourceJson, accessorIndex);
  const target = sourceView.target;
  const viewIndex = pushRawView(parts, outputJson, raw, target);

  accessor.bufferView = viewIndex;
  accessor.byteOffset = 0;
  delete accessor.sparse;
  handledAccessors.add(accessorIndex);
}

function meshNameForPrimitive(json, meshIndex) {
  const node = json.nodes?.find((candidate) => candidate.mesh === meshIndex);

  return node?.name ?? json.meshes?.[meshIndex]?.name ?? `mesh-${meshIndex}`;
}

function simplifyPrimitive(parts, sourceJson, outputJson, decodedViews, meshIndex, primitive, handledAccessors) {
  const outputPrimitive = outputJson.meshes[meshIndex].primitives[0];
  const meshName = meshNameForPrimitive(sourceJson, meshIndex);
  const positionIndex = primitive.attributes.POSITION;
  const normalIndex = primitive.attributes.NORMAL;
  const uvIndex = primitive.attributes.TEXCOORD_0;
  const indexIndex = primitive.indices;

  const primitiveMode = primitive.mode ?? TRIANGLES;

  if (
    primitiveMode !== TRIANGLES ||
    indexIndex === undefined ||
    positionIndex === undefined ||
    normalIndex === undefined ||
    uvIndex === undefined
  ) {
    for (const accessorIndex of Object.values(primitive.attributes)) {
      copyAccessor(parts, sourceJson, outputJson, decodedViews, accessorIndex, handledAccessors);
    }

    return {
      mesh: meshName,
      simplified: false,
      reason: 'non-indexed or missing core attributes',
      triangles: 0,
    };
  }

  const positions = readFloatAttribute(decodedViews, sourceJson, positionIndex, 3);
  const normals = readFloatAttribute(decodedViews, sourceJson, normalIndex, 3);
  const uvs = readFloatAttribute(decodedViews, sourceJson, uvIndex, 2);
  const indices = readIndices(decodedViews, sourceJson, indexIndex);
  const vertexCount = positions.length / 3;
  const originalTriangles = indices.length / 3;
  const settings = quality[meshName] ?? quality.default;
  let targetIndexCount = Math.max(3, Math.round(indices.length * settings.ratio));

  targetIndexCount -= targetIndexCount % 3;
  targetIndexCount = Math.min(indices.length, targetIndexCount);

  const attributes = new Float32Array(vertexCount * 5);

  for (let index = 0; index < vertexCount; index += 1) {
    attributes[index * 5] = normals[index * 3];
    attributes[index * 5 + 1] = normals[index * 3 + 1];
    attributes[index * 5 + 2] = normals[index * 3 + 2];
    attributes[index * 5 + 3] = uvs[index * 2];
    attributes[index * 5 + 4] = uvs[index * 2 + 1];
  }

  const [simplifiedIndices, error] = MeshoptSimplifier.simplifyWithAttributes(
    indices,
    positions,
    3,
    attributes,
    5,
    [0.65, 0.65, 0.65, 0.12, 0.12],
    null,
    targetIndexCount,
    settings.error,
    ['Prune', 'Regularize', 'Permissive'],
  );

  const compacted = compactSimplifiedMesh(simplifiedIndices, positions, normals, uvs);
  const { min, max } = boundsForPositions(compacted.positions);

  writeFloatAccessor(parts, outputJson, positionIndex, compacted.positions, 3, TARGET_ARRAY_BUFFER);
  outputJson.accessors[positionIndex].min = min;
  outputJson.accessors[positionIndex].max = max;
  writeFloatAccessor(parts, outputJson, normalIndex, compacted.normals, 3, TARGET_ARRAY_BUFFER);
  writeFloatAccessor(parts, outputJson, uvIndex, compacted.uvs, 2, TARGET_ARRAY_BUFFER);
  writeIndexAccessor(parts, outputJson, indexIndex, compacted.indices, compacted.vertexCount);

  outputPrimitive.attributes.POSITION = positionIndex;
  outputPrimitive.attributes.NORMAL = normalIndex;
  outputPrimitive.attributes.TEXCOORD_0 = uvIndex;
  outputPrimitive.indices = indexIndex;

  handledAccessors.add(positionIndex);
  handledAccessors.add(normalIndex);
  handledAccessors.add(uvIndex);
  handledAccessors.add(indexIndex);

  return {
    mesh: meshName,
    simplified: true,
    originalTriangles,
    outputTriangles: compacted.indices.length / 3,
    originalVertices: vertexCount,
    outputVertices: compacted.vertexCount,
    error,
  };
}

function copyImages(parts, sourceJson, outputJson, bin) {
  outputJson.images?.forEach((image, index) => {
    if (image.uri || image.bufferView === undefined) {
      return;
    }

    const sourceImage = sourceJson.images[index];
    const sourceView = sourceJson.bufferViews[sourceImage.bufferView];
    const byteOffset = sourceView.byteOffset ?? 0;
    const raw = Buffer.from(bin.subarray(byteOffset, byteOffset + sourceView.byteLength));

    image.bufferView = pushRawView(parts, outputJson, raw);
  });
}

function buildGlb(json, parts) {
  const binChunk = Buffer.concat(parts);

  json.buffers = [{ byteLength: binChunk.length }];
  json.extensionsUsed = Array.from(
    new Set([...(json.extensionsUsed ?? []), 'EXT_meshopt_compression']),
  );
  json.extensionsRequired = Array.from(
    new Set([...(json.extensionsRequired ?? []), 'EXT_meshopt_compression']),
  );

  const jsonChunk = padBuffer(Buffer.from(JSON.stringify(json)), 0x20);
  const outputLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  const jsonHeader = Buffer.alloc(8);
  const binHeader = Buffer.alloc(8);

  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(outputLength, 8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(JSON_CHUNK_TYPE, 4);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(BIN_CHUNK_TYPE, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

async function optimizeRobotGlb(inputBuffer, output) {
  const { json: sourceJson, bin } = parseGlb(inputBuffer);
  const outputJson = cloneJson(sourceJson);
  const decodedViews = decodeBufferViews(sourceJson, bin);
  const handledAccessors = new Set();
  const parts = [];

  outputJson.bufferViews = [];

  const primitiveSummaries = [];

  sourceJson.meshes.forEach((mesh, meshIndex) => {
    mesh.primitives.forEach((primitive, primitiveIndex) => {
      if (primitiveIndex !== 0) {
        throw new Error(`Unexpected extra primitive on mesh ${meshIndex}.`);
      }

      primitiveSummaries.push(
        simplifyPrimitive(
          parts,
          sourceJson,
          outputJson,
          decodedViews,
          meshIndex,
          primitive,
          handledAccessors,
        ),
      );
    });
  });

  outputJson.accessors.forEach((_, accessorIndex) => {
    copyAccessor(parts, sourceJson, outputJson, decodedViews, accessorIndex, handledAccessors);
  });

  copyImages(parts, sourceJson, outputJson, bin);

  const optimized = buildGlb(outputJson, parts);

  writeFileSync(output, optimized);

  return {
    input: basename(inputPath),
    output: basename(outputPath),
    quality: qualityArg,
    originalSize: inputBuffer.length,
    optimizedSize: optimized.length,
    originalTriangles: primitiveSummaries.reduce(
      (sum, item) => sum + (item.originalTriangles ?? item.triangles ?? 0),
      0,
    ),
    optimizedTriangles: primitiveSummaries.reduce(
      (sum, item) => sum + (item.outputTriangles ?? item.triangles ?? 0),
      0,
    ),
    meshes: primitiveSummaries,
  };
}

const summary = await optimizeRobotGlb(readFileSync(inputPath), outputPath);

console.log(JSON.stringify(summary, null, 2));
