"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Color, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Material, Object3D } from "three";
import { ASCEND_COLORS } from "./heroPalette";

interface AscendLogoProps {
  model: string;
}

interface MicroSurfaceConfig {
  grainScale: number;
  colorVariation: number;
  roughnessVariation: number;
  brushStrength: number;
}

function addMicroSurface(material: MeshPhysicalMaterial, config: MicroSurfaceConfig) {
  const grainScale = config.grainScale.toFixed(1);
  const colorVariation = config.colorVariation.toFixed(3);
  const roughnessVariation = config.roughnessVariation.toFixed(3);
  const brushStrength = config.brushStrength.toFixed(3);

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vAvObjectPosition;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vAvObjectPosition = position;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vAvObjectPosition;

        `,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float avFineGrain = sin(dot(vAvObjectPosition, vec3(0.83, 1.17, 0.61)) * ${grainScale});
        avFineGrain *= sin(dot(vAvObjectPosition, vec3(-0.47, 0.72, 1.29)) * ${grainScale} * 0.73);
        avFineGrain *= 0.5;
        float avBrush = sin(dot(vAvObjectPosition, vec3(0.73, 1.31, 0.47)) * ${grainScale} * 0.24 + avFineGrain * 1.2) * 0.5;
        float avSurfaceDetail = avFineGrain * (1.0 - ${brushStrength}) + avBrush * ${brushStrength};
        diffuseColor.rgb *= 1.0 + avSurfaceDetail * ${colorVariation};`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + avSurfaceDetail * ${roughnessVariation}, 0.045, 0.96);`,
      );
  };
  material.customProgramCacheKey = () =>
    `av-micro-${material.name}-${grainScale}-${colorVariation}-${roughnessVariation}-${brushStrength}`;
}

function createLogoMaterial(source: Material, faceTint: Color): Material {
  const base = {
    name: source.name,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    depthTest: source.depthTest,
    depthWrite: source.depthWrite,
    blending: source.blending,
  };

  if (source.name.includes("FaceDetail") && source instanceof MeshStandardMaterial) {
    const material = new MeshPhysicalMaterial({
      ...base,
      color: faceTint,
      map: source.map,
      metalnessMap: source.metalnessMap,
      roughnessMap: source.roughnessMap,
      aoMap: source.aoMap,
      aoMapIntensity: source.aoMapIntensity,
      normalMap: source.normalMap,
      normalScale: source.normalScale.clone(),
      metalness: 0.18,
      roughness: 0.4,
      clearcoat: 0.26,
      clearcoatRoughness: 0.28,
      sheen: 0.09,
      sheenColor: new Color(ASCEND_COLORS.pearl),
      sheenRoughness: 0.46,
      envMapIntensity: 1.02,
    });
    addMicroSurface(material, {
      grainScale: 210,
      colorVariation: 0.012,
      roughnessVariation: 0.055,
      brushStrength: 0.46,
    });
    return material;
  }

  if (source.name.includes("Graphite")) {
    const material = new MeshPhysicalMaterial({
      ...base,
      color: new Color(ASCEND_COLORS.graphiteRaised),
      emissive: new Color(ASCEND_COLORS.vanta),
      emissiveIntensity: 0.34,
      metalness: 0.48,
      roughness: 0.38,
      clearcoat: 0.32,
      clearcoatRoughness: 0.34,
      anisotropy: 0.34,
      anisotropyRotation: Math.PI * 0.18,
      envMapIntensity: 1.58,
    });
    addMicroSurface(material, {
      grainScale: 185,
      colorVariation: 0.045,
      roughnessVariation: 0.2,
      brushStrength: 0.64,
    });
    return material;
  }

  if (source.name.includes("AscendLime")) {
    const material = new MeshPhysicalMaterial({
      ...base,
      color: new Color(ASCEND_COLORS.lime),
      emissive: new Color(ASCEND_COLORS.shadowGreenRaised),
      emissiveIntensity: 0.14,
      metalness: 0.12,
      roughness: 0.28,
      clearcoat: 0.58,
      clearcoatRoughness: 0.2,
      sheen: 0.1,
      sheenColor: new Color(ASCEND_COLORS.limeHighlight),
      sheenRoughness: 0.42,
      envMapIntensity: 1.18,
    });
    addMicroSurface(material, {
      grainScale: 150,
      colorVariation: 0.026,
      roughnessVariation: 0.12,
      brushStrength: 0.28,
    });
    return material;
  }

  if (source.name.includes("PearlWhite")) {
    const material = new MeshPhysicalMaterial({
      ...base,
      color: new Color(ASCEND_COLORS.pearl),
      emissive: new Color(ASCEND_COLORS.vanta),
      emissiveIntensity: 0.04,
      metalness: 0.04,
      roughness: 0.22,
      clearcoat: 0.78,
      clearcoatRoughness: 0.14,
      iridescence: 0.12,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [90, 270],
      sheen: 0.16,
      sheenColor: new Color(ASCEND_COLORS.silver),
      sheenRoughness: 0.36,
      envMapIntensity: 1.28,
    });
    addMicroSurface(material, {
      grainScale: 220,
      colorVariation: 0.018,
      roughnessVariation: 0.095,
      brushStrength: 0.2,
    });
    return material;
  }

  return source.clone();
}

export function AscendLogo({ model }: AscendLogoProps) {
  const gltf = useGLTF(model);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object: Object3D) => {
      if (!(object instanceof Mesh)) return;
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      object.geometry = object.geometry.clone();
      object.geometry.computeVertexNormals();
      const lineage = [object.name];
      let ancestor = object.parent;
      while (ancestor) {
        lineage.push(ancestor.name);
        ancestor = ancestor.parent;
      }
      const faceTint = new Color(
        lineage.some((name) => name.includes("A_Primary") || name === "A_Root")
          ? ASCEND_COLORS.lime
          : ASCEND_COLORS.pearl,
      );
      const materials = sourceMaterials.map((material) => createLogoMaterial(material, faceTint));
      object.material = Array.isArray(object.material) ? materials : materials[0];
      object.frustumCulled = false;
    });
    return clone;
  }, [gltf.scene]);

  useEffect(() => {
    window.dispatchEvent(new Event("hero-assets-ready"));
    return () => {
      scene.traverse((object: Object3D) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const materials: Material[] = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [scene]);

  return <primitive object={scene} />;
}
