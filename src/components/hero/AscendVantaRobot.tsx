"use client";

/* eslint-disable react-hooks/immutability -- R3F animation and reveal state intentionally mutate Three.js objects per frame. */

import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Euler,
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Material,
} from "three";
import { ASCEND_COLORS } from "./heroPalette";
import type { HeroRuntimeRefs } from "./heroTypes";

// Version the URL whenever the binary rig changes. Browsers otherwise reuse the
// previous GLB at the same path and can keep displaying a superseded greeting
// even after the corrected asset has been deployed by the dev server.
const VANTA_MODEL =
  "/assets/models/vanta-robot/vanta-robot-web.glb?v=20260715-detailed-wave-v1";
const VANTA_IDLE = "Vanta_Idle";
const VANTA_WALK = "Vanta_WalkCycle";
const VANTA_GREETING = "Vanta_Greeting";
// Three full gait cycles carry Vanta across the same camera-depth journey that
// previously used four. Fewer cycles over the same travel distance reads as a
// longer, more powerful stride, while the authored walk clip still supplies
// the actual hip, knee, ankle, and counter-swing motion.
const WALK_CYCLES = 3;
const WALK_START = 0.015;
const WALK_END = 0.5;
const GREETING_START = 0.62;
const GREETING_END = 0.985;
const VANTA_MORPH_START = 0.42;
const VANTA_MORPH_END = 0.57;
const VANTA_PREROLL_WALK_START = 0.575;
const VANTA_PREROLL_SHARE = 0.28;
const HORIZONTAL_STAGE_CYCLES = 2;
const HORIZONTAL_CROSS_CYCLES = 2;
const HORIZONTAL_REVEAL_CYCLES = 2;

type RevealMaterial = Material & {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
};

function cloneRobot(gltf: { scene: Group; animations: AnimationClip[] }): {
  scene: Group;
  materials: RevealMaterial[];
} {
  const scene = gltf.scene.clone(true) as Group;
  const materialSet = new Set<RevealMaterial>();

  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;

    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const clonedMaterials = sourceMaterials.map((source) => {
      const material = source.clone() as RevealMaterial;
      material.opacity = 0;
      material.transparent = true;
      material.depthWrite = false;
      materialSet.add(material);
      return material;
    });

    object.material = Array.isArray(object.material)
      ? clonedMaterials
      : clonedMaterials[0];
    object.castShadow = false;
    object.receiveShadow = false;
  });

  return { scene, materials: Array.from(materialSet) };
}

function playLoop(action: AnimationAction | null | undefined) {
  if (!action) return;
  action.enabled = true;
  action.paused = false;
  action
    .reset()
    .setLoop(LoopRepeat, Infinity)
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(0.35)
    .play();
}

type GaitSample = {
  travel: number;
  clipCycles: number;
};

/**
 * Drive authored foot motion and world travel from one gait clock. Each full
 * clip cycle contains a right and a left step. The body eases through each
 * half-cycle, arriving at the next contact at the exact frame on which the
 * authored foot changes stance. Keeping `clipCycles` and `travel` together
 * prevents scroll restoration or chapter transitions from advancing one
 * without the other.
 */
function sampleGait(progress: number, cycles: number): GaitSample {
  const clamped = MathUtils.clamp(progress, 0, 1);
  const steps = cycles * 2;
  const scaledSteps = clamped * steps;
  const stepIndex =
    clamped >= 1 ? steps - 1 : Math.min(Math.floor(scaledSteps), steps - 1);
  const stepPhase = clamped >= 1 ? 1 : scaledSteps - stepIndex;
  // Use the whole authored step for travel. The previous broad dead zones
  // froze the body while its planted foot was already moving, which produced
  // the exact sliding/off-beat appearance this curve is meant to avoid.
  const plantedTravel = MathUtils.smoothstep(stepPhase, 0, 1);

  return {
    travel: (stepIndex + plantedTravel) / steps,
    clipCycles: clamped * cycles,
  };
}

export function AscendVantaRobot({ runtime }: { runtime: HeroRuntimeRefs }) {
  const anchorRef = useRef<Group>(null);
  const orientationRef = useRef<Group>(null);
  const gltf = useGLTF(VANTA_MODEL, false, true);
  const robot = useMemo(() => cloneRobot(gltf), [gltf]);
  const presenterRig = useMemo(
    () => ({
      head: robot.scene.getObjectByName("Head_CTRL"),
      shoulder: robot.scene.getObjectByName("LeftShoulder_CTRL"),
      upperArm: robot.scene.getObjectByName("LeftUpperArm_CTRL"),
      elbow: robot.scene.getObjectByName("LeftElbow_CTRL"),
      wrist: robot.scene.getObjectByName("LeftWrist_CTRL"),
      hand: robot.scene.getObjectByName("LeftHand_CTRL"),
      fingers: [1, 2, 3, 4].map((index) =>
        robot.scene.getObjectByName(`LeftFinger${index}_CTRL`),
      ),
    }),
    [robot.scene],
  );
  const presenterRestPose = useMemo(() => {
    const entries: Array<[Object3D | undefined, Quaternion]> = [
      [presenterRig.head, presenterRig.head?.quaternion.clone() ?? new Quaternion()],
      [presenterRig.shoulder, presenterRig.shoulder?.quaternion.clone() ?? new Quaternion()],
      [presenterRig.upperArm, presenterRig.upperArm?.quaternion.clone() ?? new Quaternion()],
      [presenterRig.elbow, presenterRig.elbow?.quaternion.clone() ?? new Quaternion()],
      [presenterRig.wrist, presenterRig.wrist?.quaternion.clone() ?? new Quaternion()],
      [presenterRig.hand, presenterRig.hand?.quaternion.clone() ?? new Quaternion()],
      ...presenterRig.fingers.map(
        (finger) => [finger, finger?.quaternion.clone() ?? new Quaternion()] as [
          Object3D | undefined,
          Quaternion,
        ],
      ),
    ];

    return new Map(
      entries.filter(
        (entry): entry is [Object3D, Quaternion] => entry[0] !== undefined,
      ),
    );
  }, [presenterRig]);
  const { actions, mixer } = useAnimations(gltf.animations, robot.scene);
  const reveal = useRef(0);
  const greetingPlayed = useRef(false);
  const greetingComplete = useRef(false);
  const horizontalTurn = useRef(0);
  const materialOpaque = useRef(false);
  const centeredPosition = useRef(new Vector3());
  const inverseParentRotation = useRef(new Quaternion());
  const presenterOffset = useRef(new Quaternion());
  const presenterEuler = useRef(new Euler());

  useEffect(() => {
    const idle = actions[VANTA_IDLE];
    const walk = actions[VANTA_WALK];
    const greeting = actions[VANTA_GREETING];
    runtime.vantaGreetingComplete.current = false;
    playLoop(idle);
    if (walk) {
      walk
        .reset()
        .setLoop(LoopRepeat, Infinity)
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(0)
        .play();
      walk.paused = true;
    }
    if (greeting) {
      greeting.reset().setLoop(LoopOnce, 1).setEffectiveWeight(0).play();
      greeting.clampWhenFinished = true;
      greeting.paused = true;
    }

    return () => {
      runtime.vantaGreetingComplete.current = false;
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions, mixer, runtime]);

  useEffect(
    () => () => {
      robot.materials.forEach((material) => material.dispose());
    },
    [robot.materials],
  );

  useFrame(({ clock, size }, delta) => {
    const anchor = anchorRef.current;
    const orientation = orientationRef.current;
    if (!anchor || !orientation) return;

    const shapeProgress = runtime.shapeProgress.current;
    const galaxyProgress = runtime.galaxyProgress.current;
    const horizontalProgress = runtime.horizontalProgress.current;
    const greetingProgress = MathUtils.smootherstep(
      shapeProgress,
      GREETING_START,
      GREETING_END,
    );
    const greetingFinished =
      greetingProgress >= 0.999 ||
      horizontalProgress > 0.0005 ||
      (runtime.reducedMotion.current && shapeProgress >= GREETING_START);
    greetingComplete.current = greetingFinished;
    runtime.vantaGreetingComplete.current = greetingFinished;
    const horizontalPresence = MathUtils.smoothstep(horizontalProgress, 0, 0.012);
    // Form Vanta before the values chapter finishes. At the Presence ->
    // Strategy hand-off he is already fully resolved inside the orb, and his
    // first planted step begins immediately instead of waiting for the next
    // section's ScrollTrigger to start.
    const preMorphProgress = MathUtils.smootherstep(
      galaxyProgress,
      VANTA_MORPH_START,
      VANTA_MORPH_END,
    );
    const preRollWalkProgress =
      MathUtils.smootherstep(
        galaxyProgress,
        VANTA_PREROLL_WALK_START,
        1,
      ) * VANTA_PREROLL_SHARE;
    const revealTarget = Math.max(
      preMorphProgress,
      MathUtils.smoothstep(shapeProgress, WALK_START, 0.17),
      horizontalPresence,
    );
    reveal.current = MathUtils.damp(
      reveal.current,
      revealTarget,
      runtime.reducedMotion.current ? 20 : 10,
      delta,
    );

    if (revealTarget === 0 && reveal.current < 0.0005) reveal.current = 0;
    if (revealTarget === 1 && reveal.current > 0.9995) reveal.current = 1;

    anchor.visible = reveal.current > 0.001;
    if (!anchor.visible) return;

    const easedReveal = MathUtils.smootherstep(reveal.current, 0, 1);
    const shapeWalkProgress = MathUtils.smootherstep(
      shapeProgress,
      WALK_START,
      WALK_END,
    );
    // Continue from the pre-roll instead of restarting at zero when the orb
    // evolution section takes control. This keeps the feet, body translation,
    // and animation clip on one uninterrupted gait phase across the boundary.
    const continuedShapeWalk =
      shapeProgress > 0
        ? VANTA_PREROLL_SHARE +
          shapeWalkProgress * (1 - VANTA_PREROLL_SHARE)
        : 0;
    const walkProgress = Math.max(
      preRollWalkProgress,
      continuedShapeWalk,
      horizontalPresence,
    );
    const pointer = runtime.pointer.current.current;
    const motion = runtime.reducedMotion.current ? 0 : 1;
    const aspect = size.width / Math.max(size.height, 1);
    const finalScale = aspect < 0.7 ? 1.9 : aspect < 1 ? 1.58 : 1.34;
    const shapeArc = Math.sin(shapeProgress * Math.PI);
    const entryGait = sampleGait(walkProgress, WALK_CYCLES);
    const locomotionProgress = entryGait.travel;
    const stepPhase = entryGait.clipCycles * Math.PI * 2;
    const entryMotionBlend =
      MathUtils.smoothstep(walkProgress, 0, 0.025) *
      (1 - MathUtils.smoothstep(walkProgress, 0.92, 0.995));
    const contactPulse = runtime.reducedMotion.current
      ? 0
      : Math.pow(Math.abs(Math.cos(stepPhase)), 14) *
        MathUtils.smoothstep(walkProgress, 0, 0.045) *
        (1 - MathUtils.smoothstep(walkProgress, 0.9, 0.97));
    const focusBlend = 1 - MathUtils.smoothstep(walkProgress, 0.54, 0.88);
    const midStepLift = runtime.reducedMotion.current
      ? 0
      : Math.pow(Math.sin(stepPhase), 2) * 0.032;
    // The authored clip starts on a right-foot contact and reaches the
    // left-foot contact half a cycle later. Cosine therefore moves the torso
    // over the actual stance leg; sine incorrectly peaked between contacts.
    const entryWeightShift = runtime.reducedMotion.current
      ? 0
      : Math.cos(stepPhase) * 0.026 * entryMotionBlend;
    // The horizontal chapter follows the scroll-scrubbed greeting, so a
    // non-zero horizontal progress is also a valid hand-off signal. This keeps
    // Vanta staged correctly when the page is refreshed or restored directly
    // inside the pinned sequence.
    const canTurn =
      greetingComplete.current ||
      horizontalProgress > 0.0005 ||
      runtime.reducedMotion.current;
    const turnIn = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.015, 0.15)
      : 0;
    const turnBackToCamera = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.56, 0.68)
      : 0;
    const turnTowardReveal = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.715, 0.75)
      : 0;
    const turnTarget = Math.max(
      turnIn * (1 - turnBackToCamera),
      turnTowardReveal,
    );
    horizontalTurn.current = MathUtils.damp(
      horizontalTurn.current,
      turnTarget,
      runtime.reducedMotion.current ? 18 : 6.5,
      delta,
    );
    // Three separate walks create three deliberate stage pictures. Vanta first
    // plants at camera-left while the orb exits, waits beside the question,
    // crosses to present the answers, then clears them toward camera-right.
    const stageWalkRaw = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.015, 0.22)
      : 0;
    const crossWalkRaw = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.47, 0.64)
      : 0;
    const revealWalkRaw = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.75, 0.855)
      : 0;
    const stageGait = sampleGait(stageWalkRaw, HORIZONTAL_STAGE_CYCLES);
    const crossGait = sampleGait(crossWalkRaw, HORIZONTAL_CROSS_CYCLES);
    const revealGait = sampleGait(revealWalkRaw, HORIZONTAL_REVEAL_CYCLES);
    const stageWalk = stageGait.travel;
    const crossWalk = crossGait.travel;
    const revealWalk = revealGait.travel;
    const stageWalkBlend =
      MathUtils.smoothstep(horizontalProgress, 0.01, 0.045) *
      (1 - MathUtils.smoothstep(horizontalProgress, 0.22, 0.26));
    const crossWalkBlend =
      MathUtils.smoothstep(horizontalProgress, 0.455, 0.49) *
      (1 - MathUtils.smoothstep(horizontalProgress, 0.64, 0.69));
    const revealWalkBlend =
      MathUtils.smoothstep(horizontalProgress, 0.735, 0.765) *
      (1 - MathUtils.smoothstep(horizontalProgress, 0.855, 0.885));
    const horizontalCycleProgress =
      stageGait.clipCycles + crossGait.clipCycles + revealGait.clipCycles;
    const horizontalMotionBlend = runtime.reducedMotion.current
      ? 0
      : Math.max(stageWalkBlend, crossWalkBlend, revealWalkBlend);
    const horizontalStepPhase = horizontalCycleProgress * Math.PI * 2;
    const horizontalContactPulse =
      Math.pow(Math.abs(Math.cos(horizontalStepPhase)), 14) *
      horizontalMotionBlend;
    const horizontalStepLift =
      Math.pow(Math.sin(horizontalStepPhase), 2) *
      0.021 *
      horizontalMotionBlend;
    const horizontalWeightShift = runtime.reducedMotion.current
      ? 0
      : Math.cos(horizontalStepPhase) * 0.022 * horizontalMotionBlend;
    const weightShift = entryWeightShift + horizontalWeightShift;
    const questionStageX = aspect < 0.7 ? -0.62 : aspect < 1 ? -1.02 : -1.48;
    // Keep the same camera depth and model scale for both editorial beats.
    // Only world-space X changes, giving Vanta a readable walk past the
    // question before he plants at camera-left to present the answer.
    const presenterStageX = aspect < 0.7 ? -0.24 : aspect < 1 ? -0.5 : -0.78;
    const revealStageX = aspect < 0.7 ? 1.55 : aspect < 1 ? 2.15 : 2.9;
    const stagedWorldX = MathUtils.lerp(0, questionStageX, stageWalk);
    const presenterWorldX = MathUtils.lerp(
      stagedWorldX,
      presenterStageX,
      crossWalk,
    );
    const horizontalWorldX = MathUtils.lerp(
      presenterWorldX,
      revealStageX,
      revealWalk,
    );
    // A slightly stronger distant silhouette makes the completed morph
    // readable before the first long stride without changing the final scale.
    const robotScale = MathUtils.lerp(0.34, finalScale, locomotionProgress);
    const parentScaleX = Math.max(anchor.parent?.scale.x ?? 1, 0.001);
    const entryContactPulse = horizontalProgress > 0.0005 ? 0 : contactPulse;

    // The parent orb now uses one fixed camera-matched scale throughout the
    // horizontal chapter, so Vanta can keep one exact model scale as he crosses
    // between the question and answer panels.
    anchor.scale.set(
      robotScale * (1 + entryContactPulse * 0.004),
      robotScale * (1 - entryContactPulse * 0.01),
      robotScale * (1 + entryContactPulse * 0.004),
    );
    const robotDepth = MathUtils.lerp(-1.18, 2.08, locomotionProgress);
    const robotHeight =
      MathUtils.lerp(-0.36, -0.1, locomotionProgress) +
      midStepLift -
      contactPulse * 0.064 +
      horizontalStepLift -
      horizontalContactPulse * 0.044;
    // Counter the editorial orb's full parent rotation, not just its yaw. This
    // keeps Vanta's world-space position exactly on the orb centerline even while
    // the orb responds to pointer movement and scroll-driven presentation tilt.
    const parentPositionX = anchor.parent?.position.x ?? 0;
    const horizontalLocalX =
      (horizontalWorldX - parentPositionX) / parentScaleX;
    const localCenter = centeredPosition.current.set(
      weightShift + horizontalLocalX,
      robotHeight,
      robotDepth,
    );
    if (anchor.parent) {
      inverseParentRotation.current.copy(anchor.parent.quaternion).invert();
      localCenter.applyQuaternion(inverseParentRotation.current);
    }
    anchor.position.copy(localCenter);

    // Counter the parent orb's presentation rotation so Vanta stays focused on
    // the camera while retaining a small amount of responsive dimensionality.
    anchor.rotation.x =
      shapeArc * 0.035 * motion - pointer.y * 0.028 * motion * focusBlend;
    anchor.rotation.y =
      -shapeProgress * 0.16 * motion - pointer.x * 0.05 * motion * focusBlend;
    anchor.rotation.z =
      -shapeArc * 0.025 * motion +
      pointer.x * 0.012 * motion * focusBlend -
      weightShift * 0.34;

    // The horizontal chapter begins after the greeting reaches its terminal
    // scroll pose. A damped quarter-turn leads the translation so Vanta plants,
    // turns, and then moves toward screen-right instead of sliding.
    orientation.rotation.x = MathUtils.damp(
      orientation.rotation.x,
      -Math.sin(horizontalTurn.current * Math.PI) * 0.035 * motion,
      7,
      delta,
    );
    orientation.rotation.y = MathUtils.damp(
      orientation.rotation.y,
      horizontalTurn.current * Math.PI * 0.5,
      6.5,
      delta,
    );
    orientation.rotation.z = MathUtils.damp(
      orientation.rotation.z,
      -Math.sin(horizontalTurn.current * Math.PI) * 0.025 * motion,
      7,
      delta,
    );

    const nextOpaque = reveal.current > 0.96;
    if (materialOpaque.current !== nextOpaque) {
      materialOpaque.current = nextOpaque;
      robot.materials.forEach((material) => {
        material.depthWrite = nextOpaque;
        material.needsUpdate = true;
      });
    }
    robot.materials.forEach((material) => {
      material.opacity = easedReveal;
    });

    const greeting = actions[VANTA_GREETING];
    const idle = actions[VANTA_IDLE];
    const walk = actions[VANTA_WALK];
    const greetingPresence =
      MathUtils.smoothstep(
        shapeProgress,
        GREETING_START,
        GREETING_START + 0.04,
      ) *
      (1 - MathUtils.smoothstep(horizontalProgress, 0, 0.055));

    if (greeting && shapeProgress >= GREETING_START) {
      const greetingDuration = Math.max(greeting.getClip().duration, 0.001);
      greetingPlayed.current = true;
      greeting.enabled = true;
      greeting.paused = true;
      greeting.setEffectiveWeight(greetingPresence);
      greeting.time = greetingProgress * greetingDuration;
      walk?.setEffectiveWeight(0);
      idle?.setEffectiveWeight(1 - greetingPresence);
      mixer.update(0);
    } else if (shapeProgress < GREETING_START && greetingPlayed.current) {
      greetingPlayed.current = false;
      greeting?.setEffectiveWeight(0);
      greeting?.reset();
      playLoop(idle);
      if (walk) {
        walk.enabled = true;
        walk.paused = true;
        walk.setEffectiveWeight(0);
      }
    }

    if (walk && !greetingPlayed.current) {
      const walkDuration = Math.max(walk.getClip().duration, 0.001);
      // The gait must be active whenever entry translation is active. Using
      // only `preRollWalkProgress` left the robot in its idle pose when the
      // shape chapter or a restored scroll position moved it directly.
      const entryWalkBlend = MathUtils.smoothstep(walkProgress, 0, 0.025);
      const walkBlend = runtime.reducedMotion.current
        ? 0
        : entryWalkBlend *
          (1 -
            MathUtils.smoothstep(
              shapeProgress,
              GREETING_START - 0.08,
              GREETING_START,
            ));

      walk.enabled = true;
      walk.paused = true;
      walk.setEffectiveWeight(walkBlend);
      walk.time = (entryGait.clipCycles % 1) * walkDuration;
      idle?.setEffectiveWeight(1 - walkBlend);
      mixer.update(0);
    }

    if (walk && canTurn && horizontalProgress > 0.0005) {
      const walkDuration = Math.max(walk.getClip().duration, 0.001);
      const horizontalWalkBlend = horizontalMotionBlend;

      // Re-enable the authored full-body gait after the greeting. The clip is
      // scrubbed from horizontal progress rather than wall-clock time, keeping
      // thighs, knees, ankles, feet, hips, torso, and counter-swinging arms in
      // the same phase as the scroll-locked body translation.
      walk.stopFading();
      walk.enabled = true;
      walk.paused = true;
      walk.setEffectiveWeight(horizontalWalkBlend * (1 - greetingPresence));
      walk.time = (horizontalCycleProgress % 1) * walkDuration;
      idle?.stopFading();
      idle?.setEffectiveWeight((1 - horizontalWalkBlend) * (1 - greetingPresence));
      mixer.update(0);
    }

    // Once the answer panel begins, the side-on gait is complete. Vanta faces
    // the camera and opens his left arm toward the list on screen-right. Apply
    // every joint from a cached local-space rest pose. Incremental `rotate*`
    // calls accumulate on controls that are not keyed by the idle clip, which
    // made the shoulder and forearm spin continuously after the reveal.
    const presenterBlend = canTurn
      ? MathUtils.smootherstep(horizontalProgress, 0.61, 0.71) *
        (1 - MathUtils.smootherstep(horizontalProgress, 0.715, 0.75))
      : 0;

    // Keep action state deterministic in both scroll directions. The greeting
    // remains paused because its playhead is always controlled by scroll. In
    // the final presenter frame no animation clip may keep advancing the arm.
    if (idle) idle.paused = presenterBlend > 0.999;
    if (greeting) greeting.paused = true;
    if (presenterBlend > 0.0001) {
      // The idle clip also keys the presenting arm. Fade all authored arm
      // motion out before writing this fixed pose, otherwise the mixer and the
      // presenter rig fight each other and the shoulder appears to spin.
      idle?.setEffectiveWeight(1 - presenterBlend);
      walk?.setEffectiveWeight(0);
      greeting?.setEffectiveWeight(0);

      const livingMotion = runtime.reducedMotion.current
        ? 0
        : Math.sin(clock.elapsedTime * 1.25) * 0.018 * presenterBlend;

      const applyPresenterPose = (
        control: Object3D | undefined,
        x: number,
        y: number,
        z: number,
      ) => {
        if (!control) return;
        const rest = presenterRestPose.get(control);
        if (!rest) return;

        presenterEuler.current.set(x, y, z, "XYZ");
        presenterOffset.current.setFromEuler(presenterEuler.current);
        control.quaternion.copy(rest).multiply(presenterOffset.current);
      };

      applyPresenterPose(
        presenterRig.head,
        0,
        0,
        -0.035 * presenterBlend + livingMotion * 0.35,
      );
      // A restrained, open-arm presentation reads clearly without forcing the
      // mechanical joints past their natural range. Every value is multiplied
      // from the cached rest pose, so it can never accumulate into a spin.
      applyPresenterPose(presenterRig.shoulder, 0, 0, -0.055 * presenterBlend);
      applyPresenterPose(
        presenterRig.upperArm,
        0,
        -0.46 * presenterBlend,
        -0.075 * presenterBlend,
      );
      applyPresenterPose(
        presenterRig.elbow,
        0,
        -0.2 * presenterBlend,
        -0.07 * presenterBlend,
      );
      applyPresenterPose(
        presenterRig.wrist,
        0,
        -0.16 * presenterBlend,
        0,
      );
      applyPresenterPose(presenterRig.hand, 0, 0, -0.06 * presenterBlend);
      presenterRig.fingers.forEach((finger, index) => {
        applyPresenterPose(
          finger,
          (0.025 + index * 0.006) * presenterBlend,
          0,
          0,
        );
      });
    }

  });

  return (
    <group ref={anchorRef} visible={false}>
      <pointLight
        color={ASCEND_COLORS.lime}
        intensity={0.65}
        distance={3.6}
        decay={2}
        position={[0, -0.72, 1.1]}
      />
      <group ref={orientationRef}>
        <primitive object={robot.scene} />
      </group>
    </group>
  );
}
