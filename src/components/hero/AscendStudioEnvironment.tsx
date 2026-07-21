"use client";

/* eslint-disable react-hooks/immutability -- Three.js scene environment state is intentionally configured in an effect. */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function AscendStudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    const previousRotation = scene.environmentRotation.clone();
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(gl);
    const environment = pmrem.fromScene(room, 0.032).texture;

    scene.environment = environment;
    scene.environmentIntensity = 0.68;
    scene.environmentRotation.set(0.08, -0.62, 0.04);
    room.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      scene.environmentRotation.copy(previousRotation);
      environment.dispose();
    };
  }, [gl, scene]);

  return null;
}
