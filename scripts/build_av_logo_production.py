import bpy
import json
import math
import os
from mathutils import Matrix, Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCE = os.path.join(ROOT, "source-assets/models/AVFINALLOGO.glb")
MASTER = os.path.join(ROOT, "source-assets/models/blender/AVFINALLOGO_master.blend")
STATS = os.path.join(ROOT, "docs/assets/AVFINALLOGO_EXPORT_DATA.json")

TIERS = {
    # Ithaca's public hero logo is only 2,720 triangles. These revised targets
    # retain extra budget for the scanned Ascend surface while moving all hero
    # spectacle to runtime shaders and points.
    "desktop": {"target": 32_000, "texture": 1024, "quality": 72, "file": "av-logo-desktop.glb"},
    "tablet": {"target": 18_000, "texture": 768, "quality": 68, "file": "av-logo-tablet.glb"},
    "mobile": {"target": 9_000, "texture": 512, "quality": 64, "file": "av-logo-mobile.glb"},
    "low": {"target": 4_000, "texture": 256, "quality": 58, "file": "av-logo-low.glb"},
}
TARGET_DEPTH_TO_WIDTH = 0.155
# The source is a dense scan. Its shallow surface relief looked acceptable from
# the front, but scaling that relief together with the extrusion turned tiny
# scan noise into visible teeth at oblique web-camera angles. Preserve the face
# architecture at its original scale and add the Ithaca-scale body behind it.
MAX_FRONT_RELIEF_TO_WIDTH = 0.038


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def apply_world_transform(obj):
    world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = world
    select_only([obj])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def make_material(name, base, metallic, roughness, emission=None, emission_strength=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.use_fake_user = True
    material.diffuse_color = (*base, 1.0)
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*base, 1.0)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    if emission:
        emission_input = principled.inputs.get("Emission Color") or principled.inputs.get("Emission")
        if emission_input:
            emission_input.default_value = (*emission, 1.0)
        strength_input = principled.inputs.get("Emission Strength")
        if strength_input:
            strength_input.default_value = emission_strength
    return material


def create_empty(name, parent=None, collection=None):
    obj = bpy.data.objects.new(name, None)
    (collection or bpy.context.scene.collection).objects.link(obj)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.08
    obj.parent = parent
    return obj


def set_origin_to_bounds(obj):
    select_only([obj])
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")


def count_triangles(objects):
    total = 0
    per_object = {}
    for obj in objects:
        obj.data.calc_loop_triangles()
        tris = len(obj.data.loop_triangles)
        total += tris
        per_object[obj.name] = tris
    return total, per_object


def apply_decimate(obj, ratio):
    select_only([obj])
    modifier = obj.modifiers.new(name="WEB_SILHOUETTE_DECIMATE", type="DECIMATE")
    modifier.decimate_type = "COLLAPSE"
    modifier.ratio = max(0.001, min(1.0, ratio))
    modifier.use_collapse_triangulate = True
    modifier.use_symmetry = False
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def rebuild_controlled_depth(obj, target_depth, logo_width):
    mesh = obj.data
    source_y = [vertex.co.y for vertex in mesh.vertices]
    source_min = min(source_y)
    source_max = max(source_y)
    source_depth = source_max - source_min
    source_center = (source_min + source_max) * 0.5
    target_front = source_center - target_depth * 0.5
    target_back = source_center + target_depth * 0.5
    max_relief = logo_width * MAX_FRONT_RELIEF_TO_WIDTH

    front_vertices = set()
    back_vertices = set()
    for polygon in mesh.polygons:
        if polygon.normal.y <= -0.5:
            front_vertices.update(polygon.vertices)
        elif polygon.normal.y >= 0.5:
            back_vertices.update(polygon.vertices)

    # Keep the raised trim, recessed panel, and etched face depth at its original
    # physical scale. Only the body behind that architecture is extended.
    for vertex in mesh.vertices:
        original_y = source_y[vertex.index]
        on_front = vertex.index in front_vertices
        on_back = vertex.index in back_vertices
        if on_front and on_back:
            on_front = abs(original_y - source_min) <= abs(original_y - source_max)
            on_back = not on_front

        if on_front:
            relief = min(max(original_y - source_min, 0.0), max_relief)
            vertex.co.y = target_front + relief
        elif on_back:
            relief = min(max(source_max - original_y, 0.0), max_relief)
            vertex.co.y = target_back - relief
        else:
            depth_progress = (original_y - source_min) / max(source_depth, 1e-9)
            vertex.co.y = target_front + depth_progress * target_depth
    mesh.update()


def stabilize_decimated_depth(obj, front_y, back_y, max_relief):
    """Prevent quadric decimation from pushing vertices beyond the slab planes."""
    depth = back_y - front_y
    plane_capture = depth * 0.18
    for vertex in obj.data.vertices:
        y = vertex.co.y
        if y <= front_y + plane_capture:
            vertex.co.y = front_y + min(max(y - front_y, 0.0), max_relief)
        elif y >= back_y - plane_capture:
            vertex.co.y = back_y - min(max(back_y - y, 0.0), max_relief)
        else:
            vertex.co.y = min(max(y, front_y), back_y)
    obj.data.update()


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE, import_pack_images=True)
scene = bpy.context.scene

source_meshes = [obj for obj in scene.objects if obj.type == "MESH"]
if len(source_meshes) != 1:
    raise RuntimeError(f"Expected one source mesh, found {len(source_meshes)}")
logo = source_meshes[0]
apply_world_transform(logo)
if not logo.data.materials or logo.data.materials[0] is None:
    raise RuntimeError("Source logo is missing its detailed face material")
source_face_material = logo.data.materials[0]
source_face_material.name = "MAT_AV_FaceDetail"
source_face_material.use_fake_user = True
source_images = list(bpy.data.images)
for image in source_images:
    image.use_fake_user = True

# The supplied scan is only 3.85% as deep as it is wide. Rebuild it as a clean
# 15.5%-deep physical extrusion while preserving the approved X/Z silhouette.
source_x = [vertex.co.x for vertex in logo.data.vertices]
logo_width = max(source_x) - min(source_x)
target_depth = logo_width * TARGET_DEPTH_TO_WIDTH
rebuild_controlled_depth(logo, target_depth, logo_width)

# Split across the actual empty gap between the left A and right V. No new outline
# or invented mechanical component is introduced.
xs = [vertex.co.x for vertex in logo.data.vertices]
split_x = (min(xs) + max(xs)) * 0.5
select_only([logo])
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
for vertex in logo.data.vertices:
    vertex.select = vertex.co.x < split_x
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.separate(type="SELECTED")
bpy.ops.object.mode_set(mode="OBJECT")
logo_parts = [obj for obj in scene.objects if obj.type == "MESH"]
if len(logo_parts) != 2:
    raise RuntimeError(f"A/V split produced {len(logo_parts)} meshes instead of 2")
logo_parts.sort(key=lambda obj: obj.location.x + sum(corner[0] for corner in obj.bound_box) / 8.0)
a_primary, v_primary = logo_parts
a_primary.name = "A_Primary"
a_primary.data.name = "GEO_A_Primary_High"
v_primary.name = "V_Primary"
v_primary.data.name = "GEO_V_Primary_High"

# Remove the imported hierarchy after the mesh is safely detached. The original
# UVs and two baked surface maps are retained, resized per device tier, and
# transcoded to WebP inside the GLBs.
for obj in list(scene.objects):
    if obj not in logo_parts:
        bpy.data.objects.remove(obj, do_unlink=True)
for material in list(bpy.data.materials):
    if material != source_face_material:
        bpy.data.materials.remove(material, do_unlink=True)

master_collection = bpy.data.collections.new("AV_LOGO_MASTER")
scene.collection.children.link(master_collection)
for obj in logo_parts:
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    master_collection.objects.link(obj)

graphite = make_material("MAT_AV_Graphite", (0.028, 0.032, 0.036), 0.86, 0.24)
black_chrome = make_material("MAT_AV_BlackChrome", (0.009, 0.011, 0.014), 1.0, 0.10)
brushed = make_material("MAT_AV_BrushedMetal", (0.12, 0.135, 0.145), 0.92, 0.32)
lime = make_material("MAT_AV_AscendLime", (0.624, 1.0, 0.0012), 0.08, 0.30, (0.624, 1.0, 0.0012), 0.35)
pearl_white = make_material("MAT_AV_PearlWhite", (0.93, 0.93, 0.93), 0.12, 0.24)
wire = make_material("MAT_AV_WireframeReference", (0.08, 0.1, 0.11), 0.55, 0.48)

def assign_front_and_side_materials(obj, front_material, side_material, relaxed=False):
    obj.data.materials.clear()
    obj.data.materials.append(front_material)
    obj.data.materials.append(side_material)
    # The camera-facing plane points down the negative depth axis. Keep only
    # that plane on-brand; the rear and sidewalls use graphite so the slab
    # reads as dark physical depth instead of a bright outline.
    ys = [vertex.co.y for vertex in obj.data.vertices]
    front_y = min(ys)
    depth = max(ys) - front_y
    front_band = max(depth * 0.30, 1e-6)
    for polygon in obj.data.polygons:
        is_front_plane = polygon.center.y <= front_y + front_band
        # The normal guard keeps presentation color off the deep sidewall on
        # interactive tiers. The non-interactive emergency tier relaxes it so
        # aggressive decimation cannot punch dark fragments through the face.
        is_presentation_face = is_front_plane and (relaxed or polygon.normal.y <= -0.45)
        polygon.material_index = 0 if is_presentation_face else 1


assign_front_and_side_materials(a_primary, source_face_material, graphite)
assign_front_and_side_materials(v_primary, source_face_material, graphite)

set_origin_to_bounds(a_primary)
set_origin_to_bounds(v_primary)
original_depth_bounds = {
    obj.name: (
        min(vertex.co.y for vertex in obj.data.vertices),
        max(vertex.co.y for vertex in obj.data.vertices),
    )
    for obj in logo_parts
}
root = create_empty("AV_Logo_Root", collection=master_collection)
a_root = create_empty("A_Root", parent=root, collection=master_collection)
v_root = create_empty("V_Root", parent=root, collection=master_collection)
particle_anchor = create_empty("AV_ParticleField_Anchor", parent=root, collection=master_collection)
portfolio_anchor = create_empty("AV_Portfolio_Frame_Anchor", parent=root, collection=master_collection)
particle_anchor.empty_display_type = "SPHERE"
particle_anchor.empty_display_size = 0.62
particle_anchor["runtime_only"] = True
particle_anchor["field_shape"] = "asymmetric A/V-following field; never an Ithaca-style spherical emblem"
particle_anchor["desktop_point_budget"] = 32000
particle_anchor["mobile_point_budget"] = 8000
portfolio_anchor.empty_display_type = "CUBE"
portfolio_anchor.empty_display_size = 0.42
portfolio_anchor["runtime_only"] = True
for obj, parent, role in [
    (a_primary, a_root, "left_monogram_primary"),
    (v_primary, v_root, "right_monogram_primary"),
]:
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
    obj["gsap_role"] = role
    obj["assembled_location"] = list(obj.location)
    obj["assembled_rotation"] = list(obj.rotation_euler)
    obj["runtime_material_states"] = "graphite|blackChrome|ascendLime|wireframe"

root["asset_identity"] = "Ascend Vanta A/V monogram"
root["ascend_lime_hex"] = "#CFFF04"
root["depth_to_width_ratio"] = TARGET_DEPTH_TO_WIDTH
root["web_control"] = "GSAP ScrollTrigger controls root/A/V transforms; Three.js controls shader states"
root["hero_reference_contract"] = "scale 1->0; z 0->-1 normalized unit; alpha pow(1-progress,5); desktop pointer damping 0.1"
root["shader_uniforms"] = "uLogoOut|uLogoAlphaOut|uActivation|uDataState|uReassembly"

state_collection = bpy.data.collections.new("AV_LOGO_STATE_GUIDES")
scene.collection.children.link(state_collection)
state_names = [
    "LOGO_HIDDEN", "LOGO_REVEALED", "LOGO_ACTIVATED", "LOGO_DIMENSIONAL",
    "LOGO_AV_SEPARATED", "LOGO_LAYER_EXPANDED", "LOGO_PORTFOLIO_FRAME",
    "LOGO_DATA_STATE", "LOGO_BACKGROUND_MARK", "LOGO_REASSEMBLED",
]
for index, name in enumerate(state_names, start=1):
    guide = create_empty(name, collection=state_collection)
    guide.hide_viewport = True
    guide.hide_render = True
    guide["state_index"] = index
    scene.timeline_markers.new(name, frame=1 + ((index - 1) * 10))

scene["production_note"] = "No robot or invented geometry. A/V split follows the source logo gap."
scene["lime_usage"] = "Runtime-only selective edge/rear illumination; never full-surface green."
scene.render.engine = "BLENDER_EEVEE"
bpy.ops.wm.save_as_mainfile(filepath=MASTER)

original_data = {obj.name: obj.data for obj in logo_parts}
original_triangles, original_per_object = count_triangles(logo_parts)
export_stats = {
    "master": {
        "file": os.path.relpath(MASTER, ROOT),
        "triangles": original_triangles,
        "per_object": original_per_object,
        "materials": [material.name for material in bpy.data.materials],
        "mesh_objects": [obj.name for obj in logo_parts],
    },
    "tiers": {},
}

for tier_name, tier in TIERS.items():
    ratio = tier["target"] / original_triangles
    for obj in logo_parts:
        obj.data = original_data[obj.name].copy()
        apply_decimate(obj, ratio)
        front_y, back_y = original_depth_bounds[obj.name]
        stabilize_decimated_depth(
            obj,
            front_y,
            back_y,
            logo_width * MAX_FRONT_RELIEF_TO_WIDTH,
        )
        assign_front_and_side_materials(
            obj,
            source_face_material,
            graphite,
            relaxed=tier_name == "low",
        )
        obj.data.name = f"GEO_{obj.name}_{tier_name.capitalize()}"

    actual_triangles, per_object = count_triangles(logo_parts)
    for image in source_images:
        image.scale(tier["texture"], tier["texture"])
    export_path = os.path.join(ROOT, "public/assets/models", tier["file"])
    select_only([root, a_root, v_root, particle_anchor, portfolio_anchor, a_primary, v_primary])
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_tangents=False,
        export_normals=True,
        export_yup=True,
        export_image_format="WEBP",
        export_image_quality=tier["quality"],
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=10,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=8,
        export_draco_texcoord_quantization=12,
    )
    export_stats["tiers"][tier_name] = {
        "file": os.path.relpath(export_path, ROOT),
        "target_triangles": tier["target"],
        "triangles": actual_triangles,
        "per_object": per_object,
        "file_size_bytes": os.path.getsize(export_path),
        "compression": "KHR_draco_mesh_compression level 10 + quantized positions/normals",
        "texture_compression": f"embedded WebP {tier['texture']}px quality {tier['quality']}",
        "mesh_objects": [obj.name for obj in logo_parts],
        "materials": [source_face_material.name, graphite.name],
        "expected_draw_calls": 4,
    }

for obj in logo_parts:
    obj.data = original_data[obj.name]

with open(STATS, "w", encoding="utf-8") as handle:
    json.dump(export_stats, handle, indent=2)
print(json.dumps(export_stats, indent=2))
