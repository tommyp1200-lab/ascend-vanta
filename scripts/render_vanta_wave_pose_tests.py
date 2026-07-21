"""Temporary pose sheet for tuning Vanta's original articulated wave hand."""

from pathlib import Path

import bpy
from mathutils import Vector


OUTPUT = Path("output/vanta-robot/wave-pose-tests").resolve()


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


for obj in bpy.context.scene.objects:
    if not obj.animation_data:
        continue
    for track in obj.animation_data.nla_tracks:
        track.mute = track.name != "Vanta_Greeting"

scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.studio_light = "paint.sl"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 560
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
if scene.world is None:
    scene.world = bpy.data.worlds.new("Vanta Wave Test World")
scene.world.color = (0.018, 0.022, 0.028)

bpy.ops.object.camera_add(location=(0.0, -3.25, -0.02))
camera = bpy.context.object
camera.data.lens = 58
look_at(camera, Vector((0.0, 0.0, -0.07)))
scene.camera = camera
OUTPUT.mkdir(parents=True, exist_ok=True)

for label, curl, wrist_rotation in (
    ("open-soft", -0.18, (0.08, -0.16, 0.0)),
    ("open-medium", -0.36, (0.08, -0.16, 0.0)),
    ("open-wide", -0.54, (0.08, -0.16, 0.0)),
    ("wave-left", -0.36, (0.08, -0.16, 0.52)),
    ("wave-right", -0.36, (0.08, -0.16, -0.5)),
):
    scene.frame_set(30)
    bpy.data.objects["RightWrist_CTRL"].rotation_euler = wrist_rotation
    for index in range(1, 5):
        bpy.data.objects[f"RightFinger{index}_CTRL"].rotation_euler = (
            curl - index * 0.018,
            0.0,
            0.0,
        )
    bpy.context.view_layer.update()
    scene.render.filepath = str(OUTPUT / f"{label}.png")
    bpy.ops.render.render(write_still=True)
