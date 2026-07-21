import bpy
import bmesh
import json
import math
import os
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS = {
    "desktop": os.path.join(ROOT, "public/assets/models/av-logo-desktop.glb"),
    "tablet": os.path.join(ROOT, "public/assets/models/av-logo-tablet.glb"),
    "mobile": os.path.join(ROOT, "public/assets/models/av-logo-mobile.glb"),
    "low": os.path.join(ROOT, "public/assets/models/av-logo-low.glb"),
}
OUTPUT = os.path.join(ROOT, "docs/assets/AVFINALLOGO_VALIDATION_DATA.json")
RENDER_DIR = os.path.join(ROOT, "docs/assets/av-logo-validation-renders")
os.makedirs(RENDER_DIR, exist_ok=True)


def bounds(meshes):
    corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = [min(corner[index] for corner in corners) for index in range(3)]
    maxs = [max(corner[index] for corner in corners) for index in range(3)]
    return {
        "min": [round(value, 6) for value in mins],
        "max": [round(value, 6) for value in maxs],
        "dimensions": [round(maxs[index] - mins[index], 6) for index in range(3)],
    }


def add_light(name, location, energy, color, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = location
    direction = Vector((0.0, 0.0, 0.0)) - light.location
    light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


results = {}
for tier, path in MODELS.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path, import_pack_images=True)
    scene = bpy.context.scene
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    total_triangles = 0
    total_vertices = 0
    non_manifold = 0
    draw_calls = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        total_triangles += len(obj.data.loop_triangles)
        total_vertices += len(obj.data.vertices)
        draw_calls += len({polygon.material_index for polygon in obj.data.polygons})
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        non_manifold += sum(1 for edge in bm.edges if not edge.is_manifold)
        bm.free()

    results[tier] = {
        "file": os.path.relpath(path, ROOT),
        "file_size_bytes": os.path.getsize(path),
        "objects": len(scene.objects),
        "mesh_objects": [obj.name for obj in meshes],
        "hierarchy": {obj.name: obj.parent.name if obj.parent else None for obj in scene.objects},
        "materials": [material.name for material in bpy.data.materials],
        "expected_draw_calls": draw_calls,
        "vertices": total_vertices,
        "triangles": total_triangles,
        "bounds": bounds(meshes),
        "non_manifold_edges": non_manifold,
        "animations": [action.name for action in bpy.data.actions],
    }

    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("Validation_World")
    scene.world.color = (0.001, 0.002, 0.004)
    camera_data = bpy.data.cameras.new("Validation_Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 1.18
    camera = bpy.data.objects.new("Validation_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, -2.0, 0.0)
    camera.rotation_euler = (math.radians(90), 0.0, 0.0)
    direction = Vector((0.0, 0.0, 0.0)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    add_light("Key", (-1.0, -1.1, 1.2), 1300, (0.82, 0.9, 1.0), 3.0)
    add_light("Lime_Rim", (1.1, 0.5, 0.5), 950, (0.55, 1.0, 0.01), 2.5)
    add_light("Fill", (0.0, -0.4, -1.2), 700, (0.2, 0.3, 0.5), 3.0)
    scene.render.filepath = os.path.join(RENDER_DIR, f"{tier}.png")
    bpy.ops.render.render(write_still=True)

with open(OUTPUT, "w", encoding="utf-8") as handle:
    json.dump(results, handle, indent=2)
print(json.dumps(results, indent=2))
