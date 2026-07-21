"""Inspect a GLB in Blender and write a machine-readable production audit."""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path

import bpy


def args_after_double_dash() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def vec(values) -> list[float]:
    return [round(float(value), 6) for value in values]


def main() -> None:
    args = args_after_double_dash()
    if len(args) != 2:
        raise SystemExit("Usage: blender -b --python inspect_vanta_robot.py -- input.glb report.json")

    source = Path(args[0]).expanduser().resolve()
    report_path = Path(args[1]).expanduser().resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source), import_pack_images=True)

    meshes: list[dict] = []
    armatures: list[dict] = []
    object_rows: list[dict] = []
    total_vertices = total_edges = total_polygons = total_triangles = 0

    world_min = [math.inf, math.inf, math.inf]
    world_max = [-math.inf, -math.inf, -math.inf]

    for obj in bpy.context.scene.objects:
        object_rows.append(
            {
                "name": obj.name,
                "type": obj.type,
                "parent": obj.parent.name if obj.parent else None,
                "location": vec(obj.location),
                "rotation_euler": vec(obj.rotation_euler),
                "scale": vec(obj.scale),
            }
        )

        if obj.type == "MESH":
            mesh = obj.data
            triangles = sum(max(0, len(poly.vertices) - 2) for poly in mesh.polygons)
            total_vertices += len(mesh.vertices)
            total_edges += len(mesh.edges)
            total_polygons += len(mesh.polygons)
            total_triangles += triangles

            for corner in obj.bound_box:
                point = obj.matrix_world @ mathutils_vector(corner)
                for axis in range(3):
                    world_min[axis] = min(world_min[axis], point[axis])
                    world_max[axis] = max(world_max[axis], point[axis])

            meshes.append(
                {
                    "object": obj.name,
                    "mesh": mesh.name,
                    "parent": obj.parent.name if obj.parent else None,
                    "vertices": len(mesh.vertices),
                    "edges": len(mesh.edges),
                    "polygons": len(mesh.polygons),
                    "triangles": triangles,
                    "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
                    "uv_layers": [layer.name for layer in mesh.uv_layers],
                    "color_attributes": [layer.name for layer in mesh.color_attributes],
                    "shape_keys": [key.name for key in mesh.shape_keys.key_blocks] if mesh.shape_keys else [],
                    "vertex_groups": [group.name for group in obj.vertex_groups],
                    "modifiers": [modifier.type for modifier in obj.modifiers],
                }
            )
        elif obj.type == "ARMATURE":
            bones = []
            for bone in obj.data.bones:
                bones.append(
                    {
                        "name": bone.name,
                        "parent": bone.parent.name if bone.parent else None,
                        "head": vec(bone.head_local),
                        "tail": vec(bone.tail_local),
                        "use_deform": bool(bone.use_deform),
                    }
                )
            armatures.append({"object": obj.name, "bones": bones})

    images = []
    for image in bpy.data.images:
        packed_bytes = 0
        if image.packed_file:
            packed_bytes = len(image.packed_file.data)
        images.append(
            {
                "name": image.name,
                "size": [int(image.size[0]), int(image.size[1])],
                "channels": int(image.channels),
                "file_format": image.file_format,
                "source": image.source,
                "filepath": image.filepath,
                "packed_bytes": packed_bytes,
                "colorspace": image.colorspace_settings.name,
            }
        )

    materials = []
    for material in bpy.data.materials:
        node_types = []
        linked_images = []
        if material.use_nodes and material.node_tree:
            for node in material.node_tree.nodes:
                node_types.append(node.bl_idname)
                if node.type == "TEX_IMAGE" and node.image:
                    linked_images.append(node.image.name)
        materials.append(
            {
                "name": material.name,
                "blend_method": getattr(material, "surface_render_method", None),
                "node_types": node_types,
                "images": linked_images,
            }
        )

    actions = []
    for action in bpy.data.actions:
        layers = []
        for layer in action.layers:
            strips = []
            for strip in layer.strips:
                channel_bag_count = len(strip.channelbags) if hasattr(strip, "channelbags") else 0
                strips.append({"type": strip.type, "channel_bags": channel_bag_count})
            layers.append({"name": layer.name, "strips": strips})
        actions.append(
            {
                "name": action.name,
                "frame_range": vec(action.frame_range),
                "layers": layers,
            }
        )

    animation_assignments = []
    for obj in bpy.context.scene.objects:
        if obj.animation_data:
            animation_assignments.append(
                {
                    "object": obj.name,
                    "action": obj.animation_data.action.name if obj.animation_data.action else None,
                    "nla_tracks": [track.name for track in obj.animation_data.nla_tracks],
                }
            )

    bounds = None
    if all(math.isfinite(value) for value in world_min + world_max):
        bounds = {
            "min": vec(world_min),
            "max": vec(world_max),
            "size": vec([world_max[i] - world_min[i] for i in range(3)]),
        }

    report = {
        "source": str(source),
        "source_bytes": source.stat().st_size,
        "blender_version": bpy.app.version_string,
        "scene": {
            "objects": len(bpy.context.scene.objects),
            "meshes": len(meshes),
            "armatures": len(armatures),
            "materials": len(bpy.data.materials),
            "images": len(bpy.data.images),
            "actions": len(bpy.data.actions),
            "bounds": bounds,
            "totals": {
                "vertices": total_vertices,
                "edges": total_edges,
                "polygons": total_polygons,
                "triangles": total_triangles,
            },
        },
        "objects": object_rows,
        "meshes": meshes,
        "armatures": armatures,
        "materials": materials,
        "images": images,
        "actions": actions,
        "animation_assignments": animation_assignments,
    }

    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["scene"], indent=2))
    print(f"Wrote {report_path}")


def mathutils_vector(values):
    from mathutils import Vector

    return Vector(values)


if __name__ == "__main__":
    main()
