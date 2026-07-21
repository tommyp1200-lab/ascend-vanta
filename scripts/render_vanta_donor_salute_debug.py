"""Render the donor right hand at the greeting hold for rig alignment checks."""

from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))

from render_vanta_motion_checks import activate_clip, configure_scene


output_dir = Path("output/vanta-robot/donor-salute-debug").resolve()
configure_scene(output_dir)
activate_clip("Vanta_Greeting")
bpy.context.scene.frame_set(40)

elbow = bpy.data.objects["RightElbow_CTRL"]
evaluated_elbow_x = elbow.rotation_euler.x
for test_x in (-0.2, -0.4, -0.6, -0.8, -1.0):
    elbow.rotation_euler.x = test_x
    bpy.context.view_layer.update()
    wrist_position = bpy.data.objects["RightWrist_CTRL"].matrix_world.translation
    print(
        f"DEBUG elbow_x={test_x} wrist="
        f"{tuple(round(value, 4) for value in wrist_position)}"
    )
elbow.rotation_euler.x = evaluated_elbow_x
bpy.context.view_layer.update()

# Solve a connected two-link arm pose to a reachable brow target. This is a
# coordinate diagnostic only; the production builder receives the solved local
# Euler values after visual verification.
bpy.context.scene.frame_set(1)
upper = bpy.data.objects["RightUpperArm_CTRL"]
elbow = bpy.data.objects["RightElbow_CTRL"]
wrist = bpy.data.objects["RightWrist_CTRL"]
upper_origin = upper.matrix_world.translation.copy()
upper_length = elbow.location.length
lower_length = wrist.location.length
target = Vector((-0.40, -0.20, 0.53))
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
upper.rotation_mode = "XYZ"
upper.rotation_euler = elbow.location.rotation_difference(upper_vector_parent).to_euler("XYZ")
bpy.context.view_layer.update()

upper_world_rotation = upper.matrix_world.to_quaternion()
lower_vector_parent = upper_world_rotation.inverted() @ (target - elbow_target)
elbow.rotation_mode = "XYZ"
elbow.rotation_euler = wrist.location.rotation_difference(lower_vector_parent).to_euler("XYZ")
bpy.context.view_layer.update()
print(f"DEBUG IK upper_euler={tuple(round(value, 4) for value in upper.rotation_euler)}")
print(f"DEBUG IK elbow_euler={tuple(round(value, 4) for value in elbow.rotation_euler)}")
print(
    "DEBUG IK joints="
    f"upper={tuple(round(value, 4) for value in upper.matrix_world.translation)},"
    f"elbow={tuple(round(value, 4) for value in elbow.matrix_world.translation)},"
    f"wrist={tuple(round(value, 4) for value in wrist.matrix_world.translation)}"
)
bpy.context.scene.frame_set(40)

for object_name in (
    "RightShoulder_CTRL",
    "RightElbow_CTRL",
    "RightWrist_CTRL",
    "RightHand_CTRL",
    "RightSaluteHand_CTRL",
):
    obj = bpy.data.objects[object_name]
    print(
        f"DEBUG {object_name} world="
        f"{tuple(round(value, 4) for value in obj.matrix_world.translation)}"
    )

for object_name in ("HeadShell", "AscendFaceCleanScreen"):
    obj = bpy.data.objects.get(object_name)
    if obj is None:
        continue
    corners = [obj.matrix_world @ __import__("mathutils").Vector(corner) for corner in obj.bound_box]
    print(
        f"DEBUG {object_name} y_bounds="
        f"{min(round(point.y, 4) for point in corners)},"
        f"{max(round(point.y, 4) for point in corners)}"
    )

# Reveal the donor wrist/hand and hide the pose-specific replacement so its real
# location can be aligned without guessing from the final composite.
bpy.data.objects["RightHandVisual_CTRL"].scale = (1.0, 1.0, 1.0)
bpy.data.objects["RightSaluteHand_CTRL"].scale = (0.001, 0.001, 0.001)
camera = bpy.context.scene.camera
print(
    "DEBUG camera="
    f"{tuple(round(value, 4) for value in camera.matrix_world.translation)} "
    f"rotation={tuple(round(value, 4) for value in camera.rotation_euler)}"
)
for diagnostic_frame in (1, 22, 40):
    bpy.context.scene.frame_set(diagnostic_frame)
    points = []
    for candidate in bpy.context.scene.objects:
        if candidate.type != "MESH" or not candidate.visible_get():
            continue
        points.extend(candidate.matrix_world @ Vector(corner) for corner in candidate.bound_box)
    print(
        f"DEBUG bounds frame={diagnostic_frame} "
        f"x=({min(point.x for point in points):.3f},{max(point.x for point in points):.3f}) "
        f"y=({min(point.y for point in points):.3f},{max(point.y for point in points):.3f}) "
        f"z=({min(point.z for point in points):.3f},{max(point.z for point in points):.3f})"
    )
    for candidate in bpy.context.scene.objects:
        if candidate.type != "MESH" or not candidate.visible_get():
            continue
        candidate_points = [candidate.matrix_world @ Vector(corner) for corner in candidate.bound_box]
        extent = max((max(point.x for point in candidate_points) - min(point.x for point in candidate_points)), (max(point.y for point in candidate_points) - min(point.y for point in candidate_points)), (max(point.z for point in candidate_points) - min(point.z for point in candidate_points)))
        if extent > 1.8 or max(point.z for point in candidate_points) > 2.0:
            print(f"DEBUG oversized frame={diagnostic_frame} name={candidate.name} extent={extent:.3f} scale={tuple(round(value, 4) for value in candidate.scale)}")
bpy.context.scene.frame_set(40)
bpy.context.scene.render.filepath = str(output_dir / "donor-hand-frame-040.png")
bpy.ops.render.render(write_still=True)
