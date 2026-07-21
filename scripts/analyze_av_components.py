import bpy
import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
source = os.path.join(root, "source-assets/models/AVFINALLOGO.glb")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source, import_pack_images=True)
mesh = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")
parts = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
print(f"COMPONENT_COUNT={len(parts)}")
for obj in sorted(parts, key=lambda item: item.dimensions.length, reverse=True)[:40]:
    obj.data.calc_loop_triangles()
    print(
        f"COMPONENT name={obj.name!r} verts={len(obj.data.vertices)} tris={len(obj.data.loop_triangles)} "
        f"location={tuple(round(v, 6) for v in obj.matrix_world.translation)} "
        f"dimensions={tuple(round(v, 6) for v in obj.dimensions)}"
    )
