"""Build, animate, and web-optimize the articulated Ascend Vanta robot.

The source is a rigid hard-surface character. Instead of deforming its panels with
an organic auto-rig, this script converts its shells into a named mechanical pivot
hierarchy, creates independently animated digits, authors three merged glTF clips,
and exports a gltfpack-compressed WebP GLB.
"""

from __future__ import annotations

import math
import sys
from collections import defaultdict
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector


BODY_SOURCES = ("Head", "LeftArm", "RightArm", "LeftLeg", "RightLeg", "Torso")
FACE_OBJECTS = (
    "AscendFaceCleanScreen",
    "AscendFaceGlowRing",
    "AscendFaceGlowEyeL",
    "AscendFaceGlowEyeR",
)


def cli_args() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def world_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector([min(point[axis] for point in corners) for axis in range(3)])
    maximum = Vector([max(point[axis] for point in corners) for axis in range(3)])
    return minimum, maximum


def world_center(obj: bpy.types.Object) -> Vector:
    minimum, maximum = world_bounds(obj)
    return (minimum + maximum) * 0.5


def triangle_count(obj: bpy.types.Object) -> int:
    return sum(max(0, len(poly.vertices) - 2) for poly in obj.data.polygons)


def reparent_keep_world(obj: bpy.types.Object, parent: bpy.types.Object | None) -> None:
    matrix = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = matrix


def create_control(
    name: str,
    location: tuple[float, float, float],
    parent: bpy.types.Object | None = None,
    role: str | None = None,
) -> bpy.types.Object:
    control = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(control)
    control.empty_display_type = "PLAIN_AXES"
    control.empty_display_size = 0.045
    control.matrix_world = Matrix.Translation(Vector(location))
    reparent_keep_world(control, parent)
    control["vantaControl"] = True
    if role:
        control["vantaRole"] = role
    return control


def separate_loose(obj: bpy.types.Object) -> list[bpy.types.Object]:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    return [candidate for candidate in bpy.context.selected_objects if candidate.type == "MESH"]


def join_objects(objects: list[bpy.types.Object], name: str, parent: bpy.types.Object) -> bpy.types.Object | None:
    objects = [obj for obj in objects if obj and obj.name in bpy.data.objects]
    if not objects:
        return None

    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    active = max(objects, key=triangle_count)
    bpy.context.view_layer.objects.active = active
    if len(objects) > 1:
        bpy.ops.object.join()
    active.name = name
    active.data.name = f"{name}Mesh"
    reparent_keep_world(active, parent)

    bpy.context.view_layer.objects.active = active
    active.select_set(True)
    try:
        bpy.ops.object.material_slot_remove_unused()
    except RuntimeError:
        pass
    active.select_set(False)
    return active


def polygon_world_center(obj: bpy.types.Object, polygon: bpy.types.MeshPolygon) -> Vector:
    return obj.matrix_world @ polygon.center


def separate_selected_faces(obj: bpy.types.Object, name: str) -> bpy.types.Object | None:
    if not any(polygon.select for polygon in obj.data.polygons):
        return None

    before = {candidate.name for candidate in bpy.data.objects}
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.separate(type="SELECTED")
    bpy.ops.object.mode_set(mode="OBJECT")
    created = [candidate for candidate in bpy.context.selected_objects if candidate.name not in before]
    if not created:
        return None
    digit = max(created, key=triangle_count)
    digit.name = name
    digit.data.name = f"{name}Mesh"
    return digit


def split_hand_digits(
    hand: bpy.types.Object,
    side: str,
    hand_control: bpy.types.Object,
    digit_controls: list[bpy.types.Object],
) -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    """Cut the lower hand into four narrow rigid digit zones.

    The donor hand is a single connected scan mesh. The cuts are hidden inside the
    black wrist/palm region, and the resulting rigid pieces animate without skinning.
    """

    minimum, maximum = world_bounds(hand)
    size = maximum - minimum
    digit_top = minimum.z + size.z * 0.50
    y_edges = [minimum.y + size.y * index / 4 for index in range(5)]
    digits: list[bpy.types.Object] = []

    # Split narrow slices from back to front. Recomputing centers after each cut is
    # important because Blender replaces the source mesh datablock on separation.
    for index in range(4):
        for polygon in hand.data.polygons:
            center = polygon_world_center(hand, polygon)
            polygon.select = (
                center.z <= digit_top
                and y_edges[index] - 1e-5 <= center.y <= y_edges[index + 1] + 1e-5
            )
        digit = separate_selected_faces(hand, f"{side}Finger{index + 1}")
        if digit and triangle_count(digit) >= 24:
            reparent_keep_world(digit, digit_controls[index])
            digit["vantaPart"] = f"{side.lower()}_finger_{index + 1}"
            digits.append(digit)
        elif digit:
            # Preserve tiny fragments by returning them to the palm bucket.
            reparent_keep_world(digit, hand_control)

    hand.name = f"{side}Hand"
    hand.data.name = f"{side}HandMesh"
    reparent_keep_world(hand, hand_control)
    hand["vantaPart"] = f"{side.lower()}_hand"
    return hand, digits


def reset_imported_animation() -> None:
    for obj in bpy.context.scene.objects:
        obj.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)


def build_controls() -> dict[str, bpy.types.Object]:
    controls: dict[str, bpy.types.Object] = {}
    controls["root"] = create_control("VantaRobotRoot", (0.0, 0.0, -0.24), role="root")
    controls["pelvis"] = create_control("Pelvis_CTRL", (0.0, 0.0, -0.24), controls["root"], "pelvis")
    controls["torso"] = create_control("Torso_CTRL", (0.0, 0.0, 0.02), controls["pelvis"], "torso")
    controls["neck"] = create_control("Neck_CTRL", (0.0, 0.0, 0.215), controls["torso"], "neck")
    controls["head"] = create_control("Head_CTRL", (0.0, 0.0, 0.245), controls["neck"], "head")

    for side, sign in (("Left", 1.0), ("Right", -1.0)):
        shoulder = create_control(
            f"{side}Shoulder_CTRL", (0.292 * sign, 0.0, 0.115), controls["torso"], f"{side.lower()}_shoulder"
        )
        upper = create_control(
            f"{side}UpperArm_CTRL", (0.352 * sign, 0.0, 0.095), shoulder, f"{side.lower()}_upper_arm"
        )
        elbow = create_control(
            f"{side}Elbow_CTRL", (0.405 * sign, 0.0, -0.175), upper, f"{side.lower()}_elbow"
        )
        wrist = create_control(
            f"{side}Wrist_CTRL", (0.432 * sign, 0.0, -0.405), elbow, f"{side.lower()}_wrist"
        )
        hand = create_control(
            f"{side}Hand_CTRL", (0.432 * sign, 0.0, -0.425), wrist, f"{side.lower()}_hand"
        )
        hand_visual = create_control(
            f"{side}HandVisual_CTRL",
            (0.432 * sign, 0.0, -0.425),
            hand,
            f"{side.lower()}_hand_visual",
        )
        controls[f"{side.lower()}_shoulder"] = shoulder
        controls[f"{side.lower()}_upper_arm"] = upper
        controls[f"{side.lower()}_elbow"] = elbow
        controls[f"{side.lower()}_wrist"] = wrist
        controls[f"{side.lower()}_hand"] = hand
        controls[f"{side.lower()}_hand_visual"] = hand_visual
        for index, y in enumerate((-0.095, -0.035, 0.025, 0.085), start=1):
            controls[f"{side.lower()}_finger_{index}"] = create_control(
                f"{side}Finger{index}_CTRL",
                (0.432 * sign, y, -0.505),
                hand_visual,
                f"{side.lower()}_finger_{index}",
            )

        hip = create_control(
            f"{side}Hip_CTRL", (0.14 * sign, 0.0, -0.235), controls["pelvis"], f"{side.lower()}_hip"
        )
        thigh = create_control(
            f"{side}UpperLeg_CTRL", (0.14 * sign, 0.0, -0.255), hip, f"{side.lower()}_upper_leg"
        )
        knee = create_control(
            f"{side}Knee_CTRL", (0.148 * sign, 0.0, -0.405), thigh, f"{side.lower()}_knee"
        )
        ankle = create_control(
            f"{side}Ankle_CTRL", (0.152 * sign, 0.02, -0.648), knee, f"{side.lower()}_ankle"
        )
        foot = create_control(
            f"{side}Foot_CTRL", (0.152 * sign, 0.02, -0.69), ankle, f"{side.lower()}_foot"
        )
        controls[f"{side.lower()}_hip"] = hip
        controls[f"{side.lower()}_upper_leg"] = thigh
        controls[f"{side.lower()}_knee"] = knee
        controls[f"{side.lower()}_ankle"] = ankle
        controls[f"{side.lower()}_foot"] = foot

    controls["root"]["assetName"] = "Vanta"
    controls["root"]["brand"] = "Ascend Vanta"
    controls["root"]["rigType"] = "rigid-mechanical-hierarchy"
    controls["root"]["clips"] = "Vanta_Idle,Vanta_Greeting,Vanta_WalkCycle"
    controls["root"]["accentColor"] = "#CFFF04"
    return controls


def decompose_and_parent(controls: dict[str, bpy.types.Object]) -> dict[str, bpy.types.Object]:
    buckets: dict[str, list[bpy.types.Object]] = defaultdict(list)

    # Face layers must follow the head pivot directly before the donor head is split.
    for name in FACE_OBJECTS:
        face = bpy.data.objects.get(name)
        if face:
            reparent_keep_world(face, controls["head"])
            face["vantaPart"] = name

    for source_name in BODY_SOURCES:
        source = bpy.data.objects.get(source_name)
        if not source:
            continue
        pieces = separate_loose(source)
        for piece in pieces:
            triangles = triangle_count(piece)
            if triangles < 8:
                bpy.data.objects.remove(piece, do_unlink=True)
                continue
            center = world_center(piece)

            if source_name == "Head":
                target = "neck" if center.z < 0.27 else "head"
            elif source_name == "Torso":
                if center.z < -0.165:
                    target = "pelvis"
                elif abs(center.x) > 0.265 and -0.11 < center.z < 0.12:
                    target = "left_shoulder" if center.x > 0 else "right_shoulder"
                else:
                    target = "torso"
            elif source_name in {"LeftArm", "RightArm"}:
                side = "left" if source_name.startswith("Left") else "right"
                if center.z > -0.18:
                    target = f"{side}_upper_arm"
                elif center.z > -0.40:
                    target = f"{side}_elbow"
                else:
                    target = f"{side}_hand_raw"
            else:
                side = "left" if source_name.startswith("Left") else "right"
                if center.z > -0.42:
                    target = f"{side}_upper_leg"
                elif center.z > -0.66:
                    target = f"{side}_knee"
                else:
                    target = f"{side}_foot"
            buckets[target].append(piece)

    rendered_parts: dict[str, bpy.types.Object] = {}
    names = {
        "head": "HeadShell",
        "neck": "NeckShell",
        "torso": "TorsoShell",
        "pelvis": "PelvisShell",
        "left_shoulder": "LeftShoulderShell",
        "right_shoulder": "RightShoulderShell",
        "left_upper_arm": "LeftUpperArm",
        "right_upper_arm": "RightUpperArm",
        "left_elbow": "LeftLowerArm",
        "right_elbow": "RightLowerArm",
        "left_upper_leg": "LeftUpperLeg",
        "right_upper_leg": "RightUpperLeg",
        "left_knee": "LeftLowerLeg",
        "right_knee": "RightLowerLeg",
        "left_foot": "LeftFoot",
        "right_foot": "RightFoot",
    }
    for bucket, name in names.items():
        obj = join_objects(buckets.get(bucket, []), name, controls[bucket])
        if obj:
            obj["vantaPart"] = bucket
            rendered_parts[bucket] = obj

    for side in ("left", "right"):
        hand_pieces = buckets.get(f"{side}_hand_raw", [])
        hand_obj = join_objects(
            hand_pieces,
            f"{side.title()}HandSource",
            controls[f"{side}_hand_visual"],
        )
        if not hand_obj:
            continue
        digit_controls = [controls[f"{side}_finger_{index}"] for index in range(1, 5)]
        hand, digits = split_hand_digits(
            hand_obj,
            side.title(),
            controls[f"{side}_hand_visual"],
            digit_controls,
        )
        rendered_parts[f"{side}_hand"] = hand
        for index, digit in enumerate(digits, start=1):
            rendered_parts[f"{side}_finger_{index}"] = digit

    return rendered_parts


def tune_materials() -> None:
    body = bpy.data.materials.get("Ascend Vanta Reference Robot PBR")
    if body:
        body["surfaceFinish"] = "premium ceramic white / graphite / Ascend green"
        body.diffuse_color = (0.92, 0.94, 0.94, 1.0)
        if body.node_tree:
            principled = next((node for node in body.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
            if principled:
                principled.inputs["Metallic"].default_value = 0.04
                principled.inputs["Roughness"].default_value = 0.31
                if "Coat Weight" in principled.inputs:
                    principled.inputs["Coat Weight"].default_value = 0.24
                if "Coat Roughness" in principled.inputs:
                    principled.inputs["Coat Roughness"].default_value = 0.16

    glow = bpy.data.materials.get("Ascend Vanta Lime Face Glow")
    if glow:
        glow.diffuse_color = (0.81, 1.0, 0.0157, 1.0)
        glow["ascendGreen"] = "#CFFF04"
        glow["emissiveIntensity"] = 3.2
        if glow.node_tree:
            principled = next((node for node in glow.node_tree.nodes if node.type == "BSDF_PRINCIPLED"), None)
            if principled:
                if "Emission Color" in principled.inputs:
                    principled.inputs["Emission Color"].default_value = (0.81, 1.0, 0.0157, 1.0)
                if "Emission Strength" in principled.inputs:
                    principled.inputs["Emission Strength"].default_value = 3.2
                principled.inputs["Roughness"].default_value = 0.17


def create_salute_material(
    name: str,
    color: tuple[float, float, float, float],
    metallic: float,
    roughness: float,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    principled = next(
        (node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
        None,
    )
    if principled:
        principled.inputs["Base Color"].default_value = color
        principled.inputs["Metallic"].default_value = metallic
        principled.inputs["Roughness"].default_value = roughness
        if "Coat Weight" in principled.inputs:
            principled.inputs["Coat Weight"].default_value = 0.22
        if emission_strength and "Emission Color" in principled.inputs:
            principled.inputs["Emission Color"].default_value = color
            principled.inputs["Emission Strength"].default_value = emission_strength
    return material


def create_beveled_box(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    rotation: tuple[float, float, float],
    bevel: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.0))
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}Mesh"
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    modifier = obj.modifiers.new("Precision edge radius", "BEVEL")
    modifier.width = min(bevel, min(size) * 0.45)
    modifier.segments = 3
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)

    local_matrix = (
        Matrix.Translation(Vector(location))
        @ Euler(rotation, "XYZ").to_matrix().to_4x4()
    )
    obj.matrix_world = parent.matrix_world @ local_matrix
    reparent_keep_world(obj, parent)
    obj.data.materials.append(material)
    obj["vantaPart"] = "right_salute_hand"
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def build_salute_hand(controls: dict[str, bpy.types.Object]) -> None:
    """Build a dedicated, anatomically readable blade-hand salute.

    The donor scan has permanently curled fingers. Rotating that mesh exposes the
    underside of the palm and creates the backwards claw visible in the browser.
    A pose-specific mechanical hand preserves the same ceramic/graphite language
    while giving the salute straight joined fingers, a tucked thumb, and a palm
    rolled down and slightly away from the camera.
    """

    scene = bpy.context.scene
    previous_frame = scene.frame_current
    track_mutes: list[tuple[bpy.types.NlaTrack, bool]] = []
    for obj in scene.objects:
        if not obj.animation_data:
            continue
        for track in obj.animation_data.nla_tracks:
            track_mutes.append((track, track.mute))
            track.mute = track.name != "Vanta_Greeting"

    scene.frame_set(32)
    salute = controls["right_salute_hand"]
    hand_pivot = controls["right_hand"].matrix_world.translation.copy()
    salute.matrix_world = (
        # Mount the straight blade-hand directly on the animated donor wrist.
        # Its orientation is solved at the salute hold, but its position is the
        # real wrist pivot—not an independently animated forehead coordinate.
        # Sit just in front of the visor glass. The connected arm solve places
        # the wrist at the brow; this small depth offset prevents z-fighting
        # without detaching the hand from the real wrist.
        Matrix.Translation(hand_pivot + Vector((0.0, -0.12, 0.0)))
        @ Euler(
            (math.radians(8), math.radians(-8), math.radians(3)),
            "XYZ",
        ).to_matrix().to_4x4()
    )

    ceramic = create_salute_material(
        "Ascend Vanta Salute Ceramic",
        (0.92, 0.94, 0.94, 1.0),
        metallic=0.06,
        roughness=0.27,
    )
    graphite = create_salute_material(
        "Ascend Vanta Salute Graphite",
        (0.018, 0.023, 0.028, 1.0),
        metallic=0.68,
        roughness=0.23,
    )
    accent = create_salute_material(
        "Ascend Vanta Salute Green",
        (0.81, 1.0, 0.0157, 1.0),
        metallic=0.24,
        roughness=0.2,
        emission_strength=1.7,
    )

    # The donor scan has an uncapped elbow shell that becomes visible when the
    # arm bends past ninety degrees. A compact graphite bearing closes that real
    # joint during the salute; it follows the elbow control and never acts as a
    # replacement limb.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1.0)
    elbow_bearing = bpy.context.object
    elbow_bearing.name = "RightSaluteElbowJointCover"
    elbow_bearing.data.name = "RightSaluteElbowJointCoverMesh"
    elbow_bearing.dimensions = (0.132, 0.096, 0.132)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    elbow_bearing.matrix_world = Matrix.Translation(
        controls["right_elbow"].matrix_world.translation
    )
    reparent_keep_world(elbow_bearing, controls["right_elbow"])
    elbow_bearing.data.materials.append(graphite)
    elbow_bearing["vantaPart"] = "right_elbow_joint_cover"
    for polygon in elbow_bearing.data.polygons:
        polygon.use_smooth = True

    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1.0)
    upper_arm_bearing = bpy.context.object
    upper_arm_bearing.name = "RightSaluteUpperArmJointCover"
    upper_arm_bearing.data.name = "RightSaluteUpperArmJointCoverMesh"
    upper_arm_bearing.dimensions = (0.152, 0.11, 0.152)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    upper_arm_bearing.matrix_world = Matrix.Translation(
        controls["right_upper_arm"].matrix_world.translation
    )
    reparent_keep_world(upper_arm_bearing, controls["right_upper_arm"])
    # Use the ceramic finish here so the scanned shell reads as a closed joint,
    # not a dark empty opening when it faces the camera.
    upper_arm_bearing.data.materials.append(ceramic)
    upper_arm_bearing["vantaPart"] = "right_upper_arm_joint_cover"
    for polygon in upper_arm_bearing.data.polygons:
        polygon.use_smooth = True

    # Wrist coupler and palm: a dark mechanical core wrapped in a ceramic shell.
    create_beveled_box(
        "RightSaluteWristCore",
        (0.078, 0.064, 0.082),
        (-0.036, 0.0, 0.0),
        (0.0, 0.0, 0.0),
        0.018,
        graphite,
        salute,
    )
    create_beveled_box(
        "RightSaluteWristAccent",
        (0.012, 0.068, 0.078),
        (-0.001, 0.0, 0.0),
        (0.0, 0.0, 0.0),
        0.005,
        accent,
        salute,
    )
    create_beveled_box(
        "RightSalutePalmCore",
        (0.142, 0.062, 0.136),
        (0.052, 0.0, 0.0),
        (0.0, 0.0, 0.0),
        0.024,
        graphite,
        salute,
    )
    create_beveled_box(
        "RightSalutePalmShell",
        (0.132, 0.04, 0.126),
        (0.056, -0.019, 0.0),
        (0.0, 0.0, 0.0),
        0.022,
        ceramic,
        salute,
    )

    # Four parallel fingers form one clean blade. Graphite knuckle seams retain
    # Vanta's articulated construction without letting the digits fan or curl.
    finger_z = (-0.036, -0.012, 0.012, 0.036)
    for index, z in enumerate(finger_z, start=1):
        create_beveled_box(
            f"RightSaluteFinger{index}",
            (0.148, 0.036, 0.022),
            (0.151, -0.021, z),
            (0.0, 0.0, 0.0),
            0.012,
            ceramic,
            salute,
        )
        create_beveled_box(
            f"RightSaluteFinger{index}Joint",
            (0.012, 0.041, 0.023),
            (0.096, -0.017, z),
            (0.0, 0.0, 0.0),
            0.004,
            graphite,
            salute,
        )

    # The thumb folds tightly against the lower palm instead of pointing at the
    # viewer, completing the military-salute silhouette from the supplied reference.
    create_beveled_box(
        "RightSaluteThumbCore",
        (0.074, 0.038, 0.028),
        (0.041, 0.002, -0.073),
        (0.0, math.radians(-24), 0.0),
        0.012,
        graphite,
        salute,
    )
    create_beveled_box(
        "RightSaluteThumbShell",
        (0.066, 0.029, 0.024),
        (0.049, -0.015, -0.075),
        (0.0, math.radians(-24), 0.0),
        0.011,
        ceramic,
        salute,
    )

    # Hide the curled donor hand only while the straight salute hand is active.
    author_object_clip(
        controls["right_hand_visual"],
        "Vanta_Greeting",
        [
            f(1),
            f(12),
            f(15, scale=(0.001, 0.001, 0.001)),
            f(45, scale=(0.001, 0.001, 0.001)),
            f(46),
            f(76),
        ],
    )

    salute.scale = Vector((0.001, 0.001, 0.001))
    author_object_clip(
        salute,
        "Vanta_Greeting",
        [
            f(1),
            f(12),
            f(15, scale=(1000.0, 1000.0, 1000.0)),
            f(45, scale=(1000.0, 1000.0, 1000.0)),
            f(46),
            f(76),
        ],
    )

    elbow_bearing.scale = Vector((0.001, 0.001, 0.001))
    author_object_clip(
        elbow_bearing,
        "Vanta_Greeting",
        [
            f(1),
            f(12),
            f(15, scale=(1000.0, 1000.0, 1000.0)),
            f(67, scale=(1000.0, 1000.0, 1000.0)),
            f(68),
            f(76),
        ],
    )

    upper_arm_bearing.scale = Vector((0.001, 0.001, 0.001))
    author_object_clip(
        upper_arm_bearing,
        "Vanta_Greeting",
        [
            f(1),
            f(12),
            f(15, scale=(1000.0, 1000.0, 1000.0)),
            f(67, scale=(1000.0, 1000.0, 1000.0)),
            f(68),
            f(76),
        ],
    )

    scene.frame_set(previous_frame)
    for track, muted in track_mutes:
        track.mute = muted


def base_transform(obj: bpy.types.Object) -> dict[str, Vector]:
    return {
        "location": obj.location.copy(),
        "rotation": obj.rotation_euler.copy(),
        "scale": obj.scale.copy(),
    }


def author_object_clip(
    obj: bpy.types.Object,
    clip_name: str,
    frames: list[tuple[int, tuple[float, float, float], tuple[float, float, float], tuple[float, float, float]]],
) -> None:
    base = base_transform(obj)
    obj.rotation_mode = "XYZ"
    if obj.animation_data is None:
        obj.animation_data_create()
    obj.animation_data.action = None

    for frame, rotation, location, scale in frames:
        obj.rotation_euler = tuple(
            base["rotation"][axis] + rotation[axis] for axis in range(3)
        )
        obj.location = base["location"] + Vector(location)
        obj.scale = Vector(
            [base["scale"][axis] * scale[axis] for axis in range(3)]
        )
        obj.keyframe_insert(data_path="rotation_euler", frame=frame, group=obj.name)
        obj.keyframe_insert(data_path="location", frame=frame, group=obj.name)
        obj.keyframe_insert(data_path="scale", frame=frame, group=obj.name)

    action = obj.animation_data.action
    if action is None:
        raise RuntimeError(f"Failed to create {clip_name} action for {obj.name}")
    action.name = f"{clip_name}__{obj.name}"
    action.use_frame_range = True
    action.frame_start = min(frame[0] for frame in frames)
    action.frame_end = max(frame[0] for frame in frames)

    track = obj.animation_data.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(action.name, int(action.frame_start), action)
    strip.name = clip_name
    obj.animation_data.action = None

    obj.location = base["location"]
    obj.rotation_euler = base["rotation"]
    obj.scale = base["scale"]


def f(
    frame: int,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    location: tuple[float, float, float] = (0.0, 0.0, 0.0),
    scale: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> tuple[int, tuple[float, float, float], tuple[float, float, float], tuple[float, float, float]]:
    return frame, rotation, location, scale


def author_animations(controls: dict[str, bpy.types.Object]) -> None:
    # IDLE / SCAN — a seamless six-second breathing loop. The motion is deliberately
    # offset across the pelvis, torso, neck, shoulders, wrists, knees, and fingers so
    # Vanta feels alert and friendly instead of frozen or mechanically synchronized.
    author_object_clip(
        controls["root"],
        "Vanta_Idle",
        [
            f(1),
            f(46, location=(0.006, 0, 0.012)),
            f(91, location=(0, 0, 0.002)),
            f(136, location=(-0.006, 0, 0.01)),
            f(181),
        ],
    )
    author_object_clip(
        controls["pelvis"],
        "Vanta_Idle",
        [
            f(1),
            f(46, rotation=(0.004, 0.018, 0.008)),
            f(91),
            f(136, rotation=(-0.004, -0.016, -0.007)),
            f(181),
        ],
    )
    author_object_clip(
        controls["torso"],
        "Vanta_Idle",
        [
            f(1, scale=(1.0, 1.0, 1.0)),
            f(46, rotation=(0.012, -0.012, 0.012), scale=(1.006, 1.006, 1.012)),
            f(91, scale=(1.0, 1.0, 1.002)),
            f(136, rotation=(-0.009, 0.011, -0.01), scale=(1.005, 1.005, 1.01)),
            f(181, scale=(1.0, 1.0, 1.0)),
        ],
    )
    author_object_clip(
        controls["neck"],
        "Vanta_Idle",
        [
            f(1),
            f(54, rotation=(0.026, -0.018, 0.06)),
            f(103, rotation=(-0.018, 0.014, -0.055)),
            f(143, rotation=(0.012, -0.01, 0.024)),
            f(181),
        ],
    )
    author_object_clip(
        controls["head"],
        "Vanta_Idle",
        [
            f(1),
            f(42, rotation=(-0.028, -0.025, 0.12)),
            f(92, rotation=(0.022, 0.022, -0.105)),
            f(140, rotation=(-0.015, -0.012, 0.045)),
            f(181),
        ],
    )
    for side, phase in (("left", 1.0), ("right", -1.0)):
        author_object_clip(
            controls[f"{side}_shoulder"],
            "Vanta_Idle",
            [
                f(1),
                f(50, rotation=(0.008 * phase, 0.012 * phase, 0)),
                f(100),
                f(145, rotation=(-0.007 * phase, -0.01 * phase, 0)),
                f(181),
            ],
        )
        author_object_clip(
            controls[f"{side}_upper_arm"],
            "Vanta_Idle",
            [
                f(1),
                f(61, rotation=(0.034 * phase, 0.012 * phase, 0.01 * phase)),
                f(121, rotation=(-0.026 * phase, -0.01 * phase, -0.008 * phase)),
                f(181),
            ],
        )
        author_object_clip(
            controls[f"{side}_elbow"],
            "Vanta_Idle",
            [
                f(1),
                f(61, rotation=(-0.045, 0.012 * phase, 0.01 * phase)),
                f(121, rotation=(0.034, -0.01 * phase, -0.008 * phase)),
                f(181),
            ],
        )
        author_object_clip(
            controls[f"{side}_wrist"],
            "Vanta_Idle",
            [
                f(1),
                f(68, rotation=(0.018, 0, 0.025 * phase)),
                f(132, rotation=(-0.014, 0, -0.02 * phase)),
                f(181),
            ],
        )
        author_object_clip(
            controls[f"{side}_knee"],
            "Vanta_Idle",
            [f(1), f(61, rotation=(0.024, 0, 0)), f(121, rotation=(0.009, 0, 0)), f(181)],
        )
        for index in range(1, 5):
            curl = 0.045 + index * 0.008
            author_object_clip(
                controls[f"{side}_finger_{index}"],
                "Vanta_Idle",
                [f(1), f(70, rotation=(curl, 0, 0)), f(135, rotation=(0.012, 0, 0)), f(181)],
            )

    # GREETING — a clear, full-body-readable wave using Vanta's original right
    # arm and hand. The complete arm rises from rest to head height, the forearm,
    # wrist, palm, and fingers perform two broad side-to-side waves, and the
    # complete articulated chain returns to the exact neutral pose.
    greeting_end = 108
    author_object_clip(
        controls["root"],
        "Vanta_Greeting",
        [
            f(1),
            f(12, location=(0, 0, 0.003)),
            f(28, location=(0, 0, 0.008), scale=(1, 1, 1.003)),
            f(76, location=(0, 0, 0.008), scale=(1, 1, 1.003)),
            f(94, location=(0, 0, 0.003)),
            f(greeting_end),
        ],
    )
    author_object_clip(
        controls["pelvis"],
        "Vanta_Greeting",
        [f(1), f(12, rotation=(0.005, 0, 0)), f(28, rotation=(-0.004, 0, 0.006)), f(76, rotation=(-0.004, 0, 0.006)), f(94, rotation=(0.003, 0, 0)), f(greeting_end)],
    )
    author_object_clip(
        controls["torso"],
        "Vanta_Greeting",
        [f(1), f(12, rotation=(-0.004, 0, 0.008)), f(28, rotation=(-0.01, -0.006, 0.018), scale=(1.003, 1.003, 1.006)), f(52, rotation=(-0.008, -0.004, 0.014), scale=(1.003, 1.003, 1.006)), f(76, rotation=(-0.01, -0.006, 0.018), scale=(1.003, 1.003, 1.006)), f(94, rotation=(-0.003, 0, 0.005)), f(greeting_end)],
    )
    author_object_clip(
        controls["neck"],
        "Vanta_Greeting",
        [f(1), f(14, rotation=(-0.005, 0, -0.006)), f(28, rotation=(-0.012, -0.005, -0.018)), f(52, rotation=(-0.008, -0.003, -0.012)), f(76, rotation=(-0.012, -0.005, -0.018)), f(94, rotation=(-0.003, 0, -0.004)), f(greeting_end)],
    )
    author_object_clip(
        controls["head"],
        "Vanta_Greeting",
        [f(1), f(14, rotation=(-0.006, 0, -0.008)), f(28, rotation=(-0.014, -0.006, -0.022)), f(52, rotation=(-0.009, -0.004, -0.015)), f(76, rotation=(-0.014, -0.006, -0.022)), f(94, rotation=(-0.004, 0, -0.005)), f(greeting_end)],
    )
    author_object_clip(
        controls["right_shoulder"],
        "Vanta_Greeting",
        [f(1), f(8), f(18, rotation=(-0.012, 0.016, 0.01)), f(28, rotation=(-0.02, 0.02, 0.015)), f(76, rotation=(-0.02, 0.02, 0.015)), f(90, rotation=(-0.012, 0.016, 0.01)), f(100), f(greeting_end)],
    )
    author_object_clip(
        controls["right_upper_arm"],
        "Vanta_Greeting",
        [
            f(1),
            f(8),
            f(18, rotation=(0.54265, 1.12867, 0.27569)),
            f(28, rotation=(0.26905, 2.45898, 1.34006)),
            f(36, rotation=(0.245, 2.45, 1.23)),
            f(44, rotation=(0.292, 2.47, 1.45)),
            f(52, rotation=(0.245, 2.45, 1.23)),
            f(60, rotation=(0.292, 2.47, 1.45)),
            f(68, rotation=(0.26905, 2.45898, 1.34006)),
            f(76, rotation=(0.26905, 2.45898, 1.34006)),
            f(90, rotation=(0.54265, 1.12867, 0.27569)),
            f(100),
            f(greeting_end),
        ],
    )
    author_object_clip(
        controls["right_elbow"],
        "Vanta_Greeting",
        [
            f(1),
            f(8),
            f(18, rotation=(-1.85477, 0.84194, -0.87048)),
            f(28, rotation=(-0.15865, 0.12714, 0.00861)),
            f(36, rotation=(-0.22, 0.08, -0.03)),
            f(44, rotation=(-0.1, 0.18, 0.04)),
            f(52, rotation=(-0.22, 0.08, -0.03)),
            f(60, rotation=(-0.1, 0.18, 0.04)),
            f(68, rotation=(-0.15865, 0.12714, 0.00861)),
            f(76, rotation=(-0.15865, 0.12714, 0.00861)),
            f(90, rotation=(-1.85477, 0.84194, -0.87048)),
            f(100),
            f(greeting_end),
        ],
    )
    author_object_clip(
        controls["right_wrist"],
        "Vanta_Greeting",
        [
            f(1),
            f(8),
            f(18, rotation=(0.02, -0.05, -0.15)),
            f(28, rotation=(0.05, -0.12, -0.65)),
            f(36, rotation=(0.05, -0.12, -0.28)),
            f(44, rotation=(0.05, -0.12, -1.0)),
            f(52, rotation=(0.05, -0.12, -0.28)),
            f(60, rotation=(0.05, -0.12, -1.0)),
            f(68, rotation=(0.05, -0.12, -0.55)),
            f(76, rotation=(0.05, -0.12, -0.65)),
            f(90, rotation=(0.02, -0.05, -0.15)),
            f(100),
            f(greeting_end),
        ],
    )
    author_object_clip(
        controls["right_hand"],
        "Vanta_Greeting",
        [
            f(1),
            f(8),
            f(18, rotation=(0.02, -0.03, -0.05)),
            f(28, rotation=(0.04, -0.06, 0.0)),
            f(36, rotation=(0.02, -0.04, 0.14)),
            f(44, rotation=(0.08, -0.09, -0.14)),
            f(52, rotation=(0.02, -0.04, 0.14)),
            f(60, rotation=(0.08, -0.09, -0.14)),
            f(68, rotation=(0.04, -0.06, 0.05)),
            f(76, rotation=(0.04, -0.06, 0.0)),
            f(90, rotation=(0.02, -0.03, -0.05)),
            f(100),
            f(greeting_end),
        ],
    )
    for index in range(1, 5):
        spread = 0.28 + index * 0.012
        ripple = 0.20 + index * 0.01
        author_object_clip(
            controls[f"right_finger_{index}"],
            "Vanta_Greeting",
            [
                f(1),
                f(8),
                f(18, rotation=(spread * 0.45, 0, 0)),
                f(28, rotation=(spread, 0, 0)),
                f(36, rotation=(spread * 1.08, 0, 0)),
                f(44, rotation=(ripple, 0, 0)),
                f(52, rotation=(spread * 1.08, 0, 0)),
                f(60, rotation=(ripple, 0, 0)),
                f(68, rotation=(spread, 0, 0)),
                f(76, rotation=(spread, 0, 0)),
                f(90, rotation=(spread * 0.45, 0, 0)),
                f(100),
                f(greeting_end),
            ],
        )

    # WALK / SYSTEM MOTION — planted contacts at frames 1/25/49, compressed
    # impacts, a higher passing pose, weighted side transfer, and opposing upper-
    # body rotation. This makes each step read as a compact, powerful "thump"
    # without turning Vanta into a threatening heavy machine.
    author_object_clip(
        controls["root"],
        "Vanta_WalkCycle",
        [
            f(1, location=(0.018, 0, -0.012), scale=(1.006, 1.006, 0.992)),
            f(5, location=(0.016, 0, -0.004), scale=(1.003, 1.003, 0.997)),
            f(13, location=(0, 0, 0.028)),
            f(21, location=(-0.016, 0, 0.002)),
            f(25, location=(-0.018, 0, -0.012), scale=(1.006, 1.006, 0.992)),
            f(29, location=(-0.016, 0, -0.004), scale=(1.003, 1.003, 0.997)),
            f(37, location=(0, 0, 0.028)),
            f(45, location=(0.016, 0, 0.002)),
            f(49, location=(0.018, 0, -0.012), scale=(1.006, 1.006, 0.992)),
        ],
    )
    author_object_clip(
        controls["pelvis"],
        "Vanta_WalkCycle",
        [f(1, rotation=(0.015, 0.035, 0.035)), f(13, rotation=(-0.008, 0, 0)), f(25, rotation=(0.015, -0.035, -0.035)), f(37, rotation=(-0.008, 0, 0)), f(49, rotation=(0.015, 0.035, 0.035))],
    )
    author_object_clip(
        controls["torso"],
        "Vanta_WalkCycle",
        [f(1, rotation=(0.045, -0.026, -0.055)), f(13, rotation=(0.025, 0, 0)), f(25, rotation=(0.045, 0.026, 0.055)), f(37, rotation=(0.025, 0, 0)), f(49, rotation=(0.045, -0.026, -0.055))],
    )
    author_object_clip(
        controls["neck"],
        "Vanta_WalkCycle",
        [f(1, rotation=(0.02, 0.012, 0.018)), f(5, rotation=(0.042, 0.008, 0.012)), f(13, rotation=(-0.014, 0, 0)), f(25, rotation=(0.02, -0.012, -0.018)), f(29, rotation=(0.042, -0.008, -0.012)), f(37, rotation=(-0.014, 0, 0)), f(49, rotation=(0.02, 0.012, 0.018))],
    )
    author_object_clip(
        controls["head"],
        "Vanta_WalkCycle",
        [f(1, rotation=(-0.025, -0.012, 0.024)), f(5, rotation=(0.022, -0.008, 0.016)), f(13, rotation=(-0.016, 0, 0)), f(25, rotation=(-0.025, 0.012, -0.024)), f(29, rotation=(0.022, 0.008, -0.016)), f(37, rotation=(-0.016, 0, 0)), f(49, rotation=(-0.025, -0.012, 0.024))],
    )

    for side, phase in (("left", 1.0), ("right", -1.0)):
        thigh_keys = (
            [0.34, 0.25, 0.0, -0.22, -0.34, -0.18, 0.0, 0.26, 0.34]
            if phase > 0
            else [-0.34, -0.18, 0.0, 0.26, 0.34, 0.25, 0.0, -0.22, -0.34]
        )
        knee_keys = (
            [0.12, 0.18, 0.12, 0.2, 0.3, 0.5, 0.56, 0.34, 0.12]
            if phase > 0
            else [0.3, 0.5, 0.56, 0.34, 0.12, 0.18, 0.12, 0.2, 0.3]
        )
        ankle_keys = (
            [-0.12, -0.04, 0.08, 0.12, 0.16, -0.16, -0.18, -0.08, -0.12]
            if phase > 0
            else [0.16, -0.16, -0.18, -0.08, -0.12, -0.04, 0.08, 0.12, 0.16]
        )
        gait_frames = (1, 7, 13, 19, 25, 31, 37, 43, 49)
        author_object_clip(
            controls[f"{side}_upper_leg"],
            "Vanta_WalkCycle",
            [f(frame, rotation=(angle, 0, 0)) for frame, angle in zip(gait_frames, thigh_keys)],
        )
        author_object_clip(
            controls[f"{side}_knee"],
            "Vanta_WalkCycle",
            [f(frame, rotation=(angle, 0, 0)) for frame, angle in zip(gait_frames, knee_keys)],
        )
        author_object_clip(
            controls[f"{side}_ankle"],
            "Vanta_WalkCycle",
            [f(frame, rotation=(angle, 0, 0)) for frame, angle in zip(gait_frames, ankle_keys)],
        )
        author_object_clip(
            controls[f"{side}_foot"],
            "Vanta_WalkCycle",
            [f(1, rotation=(-0.04 if phase > 0 else 0.06, 0, 0)), f(13, rotation=(0.08 if phase > 0 else -0.1, 0, 0)), f(25, rotation=(0.06 if phase > 0 else -0.04, 0, 0)), f(37, rotation=(-0.1 if phase > 0 else 0.08, 0, 0)), f(49, rotation=(-0.04 if phase > 0 else 0.06, 0, 0))],
        )
        author_object_clip(
            controls[f"{side}_upper_arm"],
            "Vanta_WalkCycle",
            [f(1, rotation=(-0.3 * phase, 0.012 * phase, 0)), f(13), f(25, rotation=(0.3 * phase, -0.012 * phase, 0)), f(37), f(49, rotation=(-0.3 * phase, 0.012 * phase, 0))],
        )
        author_object_clip(
            controls[f"{side}_elbow"],
            "Vanta_WalkCycle",
            [f(1, rotation=(-0.18, 0, 0.01 * phase)), f(13, rotation=(-0.26, 0, 0)), f(25, rotation=(-0.18, 0, -0.01 * phase)), f(37, rotation=(-0.26, 0, 0)), f(49, rotation=(-0.18, 0, 0.01 * phase))],
        )
        for index in range(1, 5):
            author_object_clip(
                controls[f"{side}_finger_{index}"],
                "Vanta_WalkCycle",
                [f(1, rotation=(0.08 + index * 0.012, 0, 0)), f(13, rotation=(0.12 + index * 0.014, 0, 0)), f(25, rotation=(0.08 + index * 0.012, 0, 0)), f(37, rotation=(0.12 + index * 0.014, 0, 0)), f(49, rotation=(0.08 + index * 0.012, 0, 0))],
            )

    # The clean face layers participate in the idle clip, preserving the approved
    # breathing glow and adding a real vertical blink.
    left_eye = bpy.data.objects.get("AscendFaceGlowEyeL")
    right_eye = bpy.data.objects.get("AscendFaceGlowEyeR")
    ring = bpy.data.objects.get("AscendFaceGlowRing")
    for eye in (left_eye, right_eye):
        if eye:
            author_object_clip(
                eye,
                "Vanta_Idle",
                [f(1), f(86), f(89, scale=(1, 1, 0.08)), f(92), f(181)],
            )
    if ring:
        author_object_clip(
            ring,
            "Vanta_Idle",
            [f(1, scale=(0.99, 0.99, 0.99)), f(46, scale=(1.03, 1.03, 1.03)), f(91, scale=(0.99, 0.99, 0.99)), f(136, scale=(1.025, 1.025, 1.025)), f(181, scale=(0.99, 0.99, 0.99))],
        )

    bpy.context.scene.render.fps = 30
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 181


def prepare_scene_for_export() -> None:
    for obj in bpy.context.scene.objects:
        obj.hide_render = False
        obj.hide_set(False)
        if obj.type == "MESH":
            for polygon in obj.data.polygons:
                polygon.use_smooth = True

    scene = bpy.context.scene
    scene["vantaProduction"] = True
    scene["animationFps"] = 30
    scene["webTarget"] = "Three.js / React Three Fiber"


def export_web_glb(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Keep the editable master at full texture resolution; scale only the in-memory
    # export copy to a premium-but-web-responsible 1536px atlas.
    for image in bpy.data.images:
        if image.size[0] > 1536 or image.size[1] > 1536:
            image.scale(1536, 1536)

    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        export_yup=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_merge_animation="NLA_TRACK",
        export_nla_strips=True,
        export_force_sampling=False,
        export_optimize_animation_size=True,
        export_optimize_animation_keep_anim_object=True,
        export_extras=True,
        export_image_format="WEBP",
        export_image_quality=82,
        export_image_add_webp=False,
        # Geometry simplification + EXT_meshopt compression is the following
        # reproducible Node stage (scripts/optimize-vanta-robot-glb.mjs). Blender's
        # macOS bundle exposes these UI flags without shipping a gltfpack binary.
        export_use_gltfpack=False,
        export_cameras=False,
        export_lights=False,
        use_visible=True,
    )


def main() -> None:
    args = cli_args()
    if len(args) != 3:
        raise SystemExit(
            "Usage: blender -b --python build_vanta_robot.py -- input.glb master.blend output.glb"
        )

    source = Path(args[0]).resolve()
    master_path = Path(args[1]).resolve()
    output_path = Path(args[2]).resolve()
    master_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source), import_pack_images=True)
    reset_imported_animation()
    controls = build_controls()
    decompose_and_parent(controls)
    tune_materials()
    author_animations(controls)
    prepare_scene_for_export()

    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(master_path))
    export_web_glb(output_path)

    print(f"Saved editable master: {master_path}")
    print(f"Saved optimized web GLB: {output_path}")


if __name__ == "__main__":
    main()
