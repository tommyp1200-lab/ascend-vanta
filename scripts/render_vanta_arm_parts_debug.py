"""Temporary visual isolation of the articulated salute arm pieces."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_vanta_motion_checks import activate_clip, configure_scene


output_dir = Path("output/vanta-robot/arm-parts-debug").resolve()
configure_scene(output_dir)
activate_clip("Vanta_Greeting")
bpy.context.scene.frame_set(22)

parts = (
    "RightShoulderShell",
    "RightUpperArm",
    "RightLowerArm",
    "RightSaluteElbowJointCover",
)

bpy.context.scene.render.filepath = str(output_dir / "all.png")
bpy.ops.render.render(write_still=True)

for name in parts:
    obj = bpy.data.objects[name]
    obj.hide_render = True
    bpy.context.scene.render.filepath = str(output_dir / f"without-{name}.png")
    bpy.ops.render.render(write_still=True)
    obj.hide_render = False
