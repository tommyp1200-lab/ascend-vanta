"""Temporary bounds diagnostic for the rebuilt Vanta master."""

import bpy
from mathutils import Vector


for obj in bpy.context.scene.objects:
    if not obj.animation_data:
        continue
    for track in obj.animation_data.nla_tracks:
        track.mute = track.name != "Vanta_Greeting"

for frame in (1, 28, 44, 108):
    bpy.context.scene.frame_set(frame)
    scene_points = []
    print(f"FRAME {frame}")
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.visible_get():
            continue
        points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        scene_points.extend(points)
        extent = max(
            max(point.x for point in points) - min(point.x for point in points),
            max(point.y for point in points) - min(point.y for point in points),
            max(point.z for point in points) - min(point.z for point in points),
        )
        if extent > 2.0:
            print(
                f"HUGE {obj.name} extent={extent:.3f} "
                f"scale={tuple(round(value, 4) for value in obj.scale)}"
            )
    print(
        "BOUNDS "
        f"x=({min(point.x for point in scene_points):.3f},{max(point.x for point in scene_points):.3f}) "
        f"y=({min(point.y for point in scene_points):.3f},{max(point.y for point in scene_points):.3f}) "
        f"z=({min(point.z for point in scene_points):.3f},{max(point.z for point in scene_points):.3f})"
    )
