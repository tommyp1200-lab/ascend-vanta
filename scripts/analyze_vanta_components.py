"""Separate the Vanta robot donor into loose mechanical shells and report their bounds."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


SOURCE_NAMES = {"Head", "LeftArm", "RightArm", "LeftLeg", "RightLeg", "Torso"}


def cli_args() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def rounded(values) -> list[float]:
    return [round(float(value), 6) for value in values]


def world_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector([min(point[axis] for point in points) for axis in range(3)])
    maximum = Vector([max(point[axis] for point in points) for axis in range(3)])
    return minimum, maximum


def separate_loose(obj: bpy.types.Object) -> list[bpy.types.Object]:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    return [candidate for candidate in bpy.context.selected_objects if candidate.type == "MESH"]


def main() -> None:
    args = cli_args()
    if len(args) != 2:
        raise SystemExit("Usage: blender -b --python analyze_vanta_components.py -- input.glb output.json")

    source = Path(args[0]).resolve()
    output = Path(args[1]).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source), import_pack_images=True)

    result: dict[str, list[dict]] = {}
    for source_name in ["Head", "LeftArm", "RightArm", "LeftLeg", "RightLeg", "Torso"]:
        obj = bpy.data.objects.get(source_name)
        if not obj:
            continue
        pieces = separate_loose(obj)
        rows = []
        for index, piece in enumerate(pieces):
            minimum, maximum = world_bounds(piece)
            size = maximum - minimum
            center = (minimum + maximum) * 0.5
            triangles = sum(max(0, len(poly.vertices) - 2) for poly in piece.data.polygons)
            rows.append(
                {
                    "index": index,
                    "object": piece.name,
                    "vertices": len(piece.data.vertices),
                    "triangles": triangles,
                    "min": rounded(minimum),
                    "max": rounded(maximum),
                    "center": rounded(center),
                    "size": rounded(size),
                    "volume": round(float(size.x * size.y * size.z), 9),
                }
            )
        rows.sort(key=lambda row: row["triangles"], reverse=True)
        result[source_name] = rows
        print(f"{source_name}: {len(rows)} loose components")

    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
