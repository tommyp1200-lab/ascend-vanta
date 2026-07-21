"""Temporary two-link IK solver for Vanta's right-arm wave path key poses."""

from mathutils import Vector
import bpy


upper = bpy.data.objects["RightUpperArm_CTRL"]
elbow = bpy.data.objects["RightElbow_CTRL"]
wrist = bpy.data.objects["RightWrist_CTRL"]
bpy.context.scene.frame_set(1)

for label, target in (
    ("wave_low", Vector((-0.55, -0.07, -0.18))),
    ("wave_mid", Vector((-0.63, -0.12, 0.15))),
    ("wave_hold", Vector((-0.64, -0.18, 0.36))),
    ("wave_head", Vector((-0.53, -0.16, 0.53))),
    ("wave_high", Vector((-0.49, -0.16, 0.61))),
):
    upper.rotation_euler = (0.0, 0.0, 0.0)
    elbow.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    upper_origin = upper.matrix_world.translation.copy()
    upper_length = elbow.location.length
    lower_length = wrist.location.length
    target_vector = target - upper_origin
    distance = target_vector.length
    direction = target_vector.normalized()
    along = (upper_length**2 - lower_length**2 + distance**2) / (2 * distance)
    height = max(0.0, upper_length**2 - along**2) ** 0.5
    pole = Vector((-1.0, 0.0, 0.0))
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
    print(
        f"SOLVE {label} upper={tuple(round(value, 5) for value in upper.rotation_euler)} "
        f"elbow={tuple(round(value, 5) for value in elbow.rotation_euler)} "
        f"wrist={tuple(round(value, 5) for value in wrist.matrix_world.translation)} "
        f"distance={distance:.5f} lengths=({upper_length:.5f},{lower_length:.5f})"
    )
