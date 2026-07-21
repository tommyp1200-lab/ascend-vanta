import bpy
import bmesh
import hashlib
import json
import os
import sys
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCE = os.path.join(ROOT, "source-assets/models/AVFINALLOGO.glb")
OUTPUT = os.path.join(ROOT, "docs/assets/AVFINALLOGO_AUDIT_DATA.json")


def rounded(values):
    return [round(float(value), 6) for value in values]


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_record(image):
    path = bpy.path.abspath(image.filepath) if image.filepath else ""
    extension = os.path.splitext(path)[1].lower().lstrip(".") or image.file_format.lower()
    usages = []
    for material in bpy.data.materials:
        if not material.use_nodes or not material.node_tree:
            continue
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image == image:
                linked_inputs = []
                for output in node.outputs:
                    for link in output.links:
                        linked_inputs.append(f"{link.to_node.name}:{link.to_socket.name}")
                usages.append({"material": material.name, "node": node.name, "linked_inputs": linked_inputs})
    return {
        "name": image.name,
        "format": extension,
        "dimensions": [int(image.size[0]), int(image.size[1])],
        "packed": image.packed_file is not None,
        "source": image.source,
        "usages": usages,
    }


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE, import_pack_images=True)

objects = list(bpy.data.objects)
meshes = [obj for obj in objects if obj.type == "MESH"]
vertices = edges = polygons = triangles = 0
non_manifold_edges = 0
loose_vertices = 0
degenerate_faces = 0
uv_maps = {}
mesh_records = []

for obj in meshes:
    mesh = obj.data
    mesh.calc_loop_triangles()
    vertices += len(mesh.vertices)
    edges += len(mesh.edges)
    polygons += len(mesh.polygons)
    triangles += len(mesh.loop_triangles)
    uv_maps[obj.name] = [layer.name for layer in mesh.uv_layers]

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.edges.ensure_lookup_table()
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    object_non_manifold = sum(1 for edge in bm.edges if not edge.is_manifold)
    object_loose = sum(1 for vert in bm.verts if not vert.link_edges)
    object_degenerate = sum(1 for face in bm.faces if face.calc_area() < 1e-12)
    non_manifold_edges += object_non_manifold
    loose_vertices += object_loose
    degenerate_faces += object_degenerate
    bm.free()

    mesh_records.append({
        "object": obj.name,
        "mesh": mesh.name,
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "faces": len(mesh.polygons),
        "triangles": len(mesh.loop_triangles),
        "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
        "uv_maps": uv_maps[obj.name],
        "shape_keys": [key.name for key in mesh.shape_keys.key_blocks] if mesh.shape_keys else [],
        "non_manifold_edges": object_non_manifold,
        "loose_vertices": object_loose,
        "degenerate_faces": object_degenerate,
    })

world_corners = []
for obj in meshes:
    world_corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
if world_corners:
    mins = [min(corner[i] for corner in world_corners) for i in range(3)]
    maxs = [max(corner[i] for corner in world_corners) for i in range(3)]
    dimensions = [maxs[i] - mins[i] for i in range(3)]
else:
    mins = maxs = dimensions = [0.0, 0.0, 0.0]

object_records = []
for obj in objects:
    object_records.append({
        "name": obj.name,
        "type": obj.type,
        "parent": obj.parent.name if obj.parent else None,
        "children": [child.name for child in obj.children],
        "location": rounded(obj.location),
        "rotation_euler": rounded(obj.rotation_euler),
        "scale": rounded(obj.scale),
        "dimensions": rounded(obj.dimensions),
        "origin_world": rounded(obj.matrix_world.translation),
        "hidden_viewport": obj.hide_viewport,
        "hidden_render": obj.hide_render,
    })

actions = []
for action in bpy.data.actions:
    frame_range = action.frame_range
    actions.append({
        "name": action.name,
        "frame_range": rounded(frame_range),
        "slots": len(action.slots) if hasattr(action, "slots") else None,
    })

duplicate_mesh_groups = {}
for obj in meshes:
    signature = (len(obj.data.vertices), len(obj.data.edges), len(obj.data.polygons))
    duplicate_mesh_groups.setdefault(str(signature), []).append(obj.name)
duplicate_mesh_groups = [names for names in duplicate_mesh_groups.values() if len(names) > 1]

report = {
    "source": os.path.relpath(SOURCE, ROOT),
    "file_size_bytes": os.path.getsize(SOURCE),
    "sha256": file_sha256(SOURCE),
    "blender_version": bpy.app.version_string,
    "counts": {
        "objects": len(objects),
        "meshes": len(meshes),
        "vertices": vertices,
        "edges": edges,
        "faces": polygons,
        "triangles": triangles,
        "materials": len(bpy.data.materials),
        "textures": len(bpy.data.images),
        "animations": len(actions),
        "shape_keys": sum(len(record["shape_keys"]) for record in mesh_records),
    },
    "bounds": {
        "min": rounded(mins),
        "max": rounded(maxs),
        "dimensions": rounded(dimensions),
        "depth_y": round(float(dimensions[1]), 6),
    },
    "materials": [material.name for material in bpy.data.materials],
    "textures": [image_record(image) for image in bpy.data.images],
    "uv_maps": uv_maps,
    "animations": actions,
    "objects": object_records,
    "meshes": mesh_records,
    "geometry_checks": {
        "non_manifold_edges": non_manifold_edges,
        "loose_vertices": loose_vertices,
        "degenerate_faces": degenerate_faces,
        "duplicate_topology_signature_groups": duplicate_mesh_groups,
        "hidden_objects": [obj.name for obj in objects if obj.hide_viewport or obj.hide_render],
    },
}

with open(OUTPUT, "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2)
print(json.dumps(report, indent=2))
