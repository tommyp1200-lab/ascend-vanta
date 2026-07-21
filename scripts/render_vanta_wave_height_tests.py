"""Temporary pose sheet for tuning Vanta's full arm-raise wave."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_vanta_motion_checks import configure_scene


OUTPUT = Path("output/vanta-robot/wave-height-tests").resolve()


def solve_arm(target: Vector, pole: Vector) -> None:
    upper = bpy.data.objects["RightUpperArm_CTRL"]
    elbow = bpy.data.objects["RightElbow_CTRL"]
    wrist = bpy.data.objects["RightWrist_CTRL"]
    upper.rotation_euler = (0.0, 0.0, 0.0)
    elbow.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()

    upper_origin = upper.matrix_world.translation.copy()
    upper_length = elbow.location.length
    lower_length = wrist.location.length
    target_vector = target - upper_origin
    distance = min(target_vector.length, upper_length + lower_length - 0.002)
    direction = target_vector.normalized()
    along = (upper_length**2 - lower_length**2 + distance**2) / (2 * distance)
    height = max(0.0, upper_length**2 - along**2) ** 0.5
    perpendicular = (pole - direction * pole.dot(direction)).normalized()
    elbow_target = upper_origin + direction * along + perpendicular * height

    parent_rotation = upper.parent.matrix_world.to_quaternion()
    upper_vector_parent = parent_rotation.inverted() @ (elbow_target - upper_origin)
    upper.rotation_euler = elbow.location.rotation_difference(upper_vector_parent).to_euler("XYZ")
    bpy.context.view_layer.update()

    upper_world_rotation = upper.matrix_world.to_quaternion()
    lower_vector_parent = upper_world_rotation.inverted() @ (target - elbow_target)
    elbow.rotation_euler = wrist.location.rotation_difference(lower_vector_parent).to_euler("XYZ")
    bpy.context.view_layer.update()


for obj in bpy.context.scene.objects:
    if not obj.animation_data:
        continue
    for track in obj.animation_data.nla_tracks:
        track.mute = True

configure_scene(OUTPUT)
scene = bpy.context.scene
scene.frame_set(1)

tests = (
    ("base", (0.05, -0.12, 0.0), (0.04, -0.06, 0.0), -0.25),
    ("fingers-positive", (0.05, -0.12, 0.0), (0.04, -0.06, 0.0), 0.55),
    ("wrist-x-positive", (0.85, -0.12, 0.0), (0.04, -0.06, 0.0), 0.55),
    ("wrist-x-negative", (-0.75, -0.12, 0.0), (0.04, -0.06, 0.0), 0.55),
    ("wrist-y-positive", (0.05, 0.7, 0.0), (0.04, -0.06, 0.0), 0.55),
    ("wrist-y-negative", (0.05, -0.9, 0.0), (0.04, -0.06, 0.0), 0.55),
    ("wrist-z-positive", (0.05, -0.12, 0.75), (0.04, -0.06, 0.0), 0.55),
    ("wrist-z-negative", (0.05, -0.12, -0.75), (0.04, -0.06, 0.0), 0.55),
)

for label, wrist_rotation, hand_rotation, finger_curl in tests:
    solve_arm(Vector((-0.46, -0.22, 0.54)), Vector((-1.0, 0.0, 0.0)))
    bpy.data.objects["RightShoulder_CTRL"].rotation_euler = (-0.02, 0.02, 0.015)
    bpy.data.objects["RightWrist_CTRL"].rotation_euler = wrist_rotation
    bpy.data.objects["RightHand_CTRL"].rotation_euler = hand_rotation
    for index in range(1, 5):
        bpy.data.objects[f"RightFinger{index}_CTRL"].rotation_euler = (
            finger_curl,
            0.0,
            0.0,
        )
    bpy.context.view_layer.update()
    upper = bpy.data.objects["RightUpperArm_CTRL"]
    elbow = bpy.data.objects["RightElbow_CTRL"]
    wrist = bpy.data.objects["RightWrist_CTRL"]
    print(
        f"POSE {label} "
        f"upper={tuple(round(value, 5) for value in upper.rotation_euler)} "
        f"elbow={tuple(round(value, 5) for value in elbow.rotation_euler)} "
        f"wrist_world={tuple(round(value, 5) for value in wrist.matrix_world.translation)}"
    )
    scene.render.filepath = str(OUTPUT / f"{label}.png")
    bpy.ops.render.render(write_still=True)
