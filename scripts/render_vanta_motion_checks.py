"""Render compact Blender workbench contact sheets for Vanta's authored clips."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


CHECKS = {
    "Vanta_WalkCycle": (1, 7, 13, 19, 25, 31, 37, 43),
    "Vanta_Greeting": (1, 8, 18, 28, 36, 44, 52, 60, 68, 76, 90, 100, 108),
    "Vanta_Idle": (1, 42, 92, 140),
}


def cli_args() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def look_at(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def activate_clip(clip_name: str) -> None:
    for obj in bpy.context.scene.objects:
        animation_data = obj.animation_data
        if not animation_data:
            continue
        for track in animation_data.nla_tracks:
            track.mute = track.name != clip_name


def configure_scene(output_dir: Path) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.studio_light = "paint.sl"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "WORLD"
    scene.display.shading.curvature_ridge_factor = 1.6
    scene.display.shading.curvature_valley_factor = 1.2
    scene.render.resolution_x = 560
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Vanta Motion Check World")
    scene.world.color = (0.018, 0.022, 0.028)

    bpy.ops.object.camera_add(location=(0.0, -3.25, -0.02))
    camera = bpy.context.object
    camera.data.lens = 58
    look_at(camera, Vector((0.0, 0.0, -0.07)))
    scene.camera = camera
    output_dir.mkdir(parents=True, exist_ok=True)


def main() -> None:
    args = cli_args()
    if args == ["--help"] or len(args) != 1:
        raise SystemExit(
            "Usage: blender -b master.blend --python render_vanta_motion_checks.py -- output_dir"
        )

    output_dir = Path(args[0]).resolve()
    configure_scene(output_dir)
    scene = bpy.context.scene

    for clip_name, frames in CHECKS.items():
        activate_clip(clip_name)
        for frame in frames:
            scene.frame_set(frame)
            scene.render.filepath = str(output_dir / f"{clip_name}-{frame:03d}.png")
            bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
