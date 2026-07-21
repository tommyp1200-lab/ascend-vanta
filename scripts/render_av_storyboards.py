import bpy
import math
import os
import random
import shutil
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS = {
    "desktop": os.path.join(ROOT, "public/assets/models/av-logo-desktop.glb"),
    "mobile": os.path.join(ROOT, "public/assets/models/av-logo-mobile.glb"),
}
OUTPUTS = {
    "desktop": os.path.join(ROOT, "docs/creative/av-logo-storyboard/desktop"),
    "mobile": os.path.join(ROOT, "docs/creative/av-logo-storyboard/mobile"),
}
FALLBACKS = os.path.join(ROOT, "public/assets/images/av-logo-fallbacks")
os.makedirs(FALLBACKS, exist_ok=True)

STATES = [
    "01-logo-hidden",
    "02-logo-revealed",
    "03-logo-activated",
    "04-logo-dimensional",
    "05-logo-av-separated",
    "06-logo-layer-expanded",
    "07-logo-portfolio-frame",
    "08-logo-data-state",
    "09-logo-background-mark",
    "10-logo-reassembled",
]


def create_material(name, base, metallic, roughness, emission=None, strength=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*base, 1.0)
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*base, 1.0)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    emission_input = principled.inputs.get("Emission Color") or principled.inputs.get("Emission")
    if emission_input and emission:
        emission_input.default_value = (*emission, 1.0)
    strength_input = principled.inputs.get("Emission Strength")
    if strength_input:
        strength_input.default_value = strength
    return material


def tetra(vertices, faces, center, radius):
    start = len(vertices)
    x, y, z = center
    vertices.extend([
        (x + radius, y, z - radius * 0.5),
        (x - radius, y, z - radius * 0.5),
        (x, y + radius, z + radius * 0.65),
        (x, y - radius, z + radius * 0.65),
    ])
    faces.extend([
        (start, start + 1, start + 2),
        (start, start + 3, start + 1),
        (start, start + 2, start + 3),
        (start + 1, start + 3, start + 2),
    ])


def particle_mesh(name, material, mobile=False):
    random.seed(20260713 + (1 if mobile else 0))
    vertices, faces = [], []
    count = 430 if mobile else 760
    for index in range(count):
        t = index / max(1, count - 1)
        stream = index % 2
        if stream == 0:
            x = -0.67 + 1.31 * t
            z = -0.33 + 0.68 * math.sin(math.pi * t) + 0.08 * t
        else:
            x = -0.56 + 1.16 * t
            z = 0.36 - 0.72 * math.sin(math.pi * t) - 0.05 * t
        x += random.uniform(-0.055, 0.055)
        z += random.uniform(-0.045, 0.045)
        y = 0.075 + random.uniform(-0.025, 0.025)
        radius = random.uniform(0.0022, 0.0065) * (1.2 if not mobile else 1.0)
        tetra(vertices, faces, (x, y, z), radius)
    mesh = bpy.data.meshes.new(f"GEO_{name}")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def star_mesh(material, mobile=False):
    random.seed(1108 + (1 if mobile else 0))
    vertices, faces = [], []
    count = 180 if mobile else 320
    for _ in range(count):
        x = random.uniform(-1.2, 1.2)
        z = random.uniform(-0.85, 0.85)
        y = random.uniform(0.18, 0.42)
        radius = random.uniform(0.0008, 0.0025)
        tetra(vertices, faces, (x, y, z), radius)
    mesh = bpy.data.meshes.new("GEO_AV_Stars")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    obj = bpy.data.objects.new("AV_Stars", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_area(name, location, energy, size, color):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (Vector((0.0, 0.0, 0.0)) - light.location).to_track_quat("-Z", "Y").to_euler()
    return light


def emission_strength(material, value):
    principled = material.node_tree.nodes.get("Principled BSDF")
    strength = principled.inputs.get("Emission Strength")
    if strength:
        strength.default_value = value


def set_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0


def restore_materials(obj, materials, indices):
    obj.data.materials.clear()
    for material in materials:
        obj.data.materials.append(material)
    for polygon, material_index in zip(obj.data.polygons, indices):
        polygon.material_index = material_index


desktop_renders = {}
for device, model_path in MODELS.items():
    mobile = device == "mobile"
    output_dir = OUTPUTS[device]
    os.makedirs(output_dir, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=model_path, import_pack_images=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1080 if mobile else 2400
    scene.render.resolution_y = 1350 if mobile else 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = 84
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = -1.0
    scene.view_settings.gamma = 1.0
    scene.world = bpy.data.worlds.new("AV_Storyboard_World")
    scene.world.use_nodes = True
    world_background = scene.world.node_tree.nodes.get("Background")
    world_background.inputs["Color"].default_value = (0.0002, 0.0007, 0.0025, 1.0)
    world_background.inputs["Strength"].default_value = 0.08

    root = bpy.data.objects["AV_Logo_Root"]
    a_root = bpy.data.objects["A_Root"]
    v_root = bpy.data.objects["V_Root"]
    root.rotation_mode = "XYZ"
    a_root.rotation_mode = "XYZ"
    v_root.rotation_mode = "XYZ"
    a_primary = bpy.data.objects["A_Primary"]
    v_primary = bpy.data.objects["V_Primary"]
    logo_lime = bpy.data.materials.get("MAT_AV_AscendLime")
    pearl_white = bpy.data.materials.get("MAT_AV_PearlWhite")
    a_materials = list(a_primary.data.materials)
    v_materials = list(v_primary.data.materials)
    a_material_indices = [polygon.material_index for polygon in a_primary.data.polygons]
    v_material_indices = [polygon.material_index for polygon in v_primary.data.polygons]
    particle_lime = create_material("MAT_AV_Storyboard_Lime", (0.12, 0.22, 0.004), 0.2, 0.3, (0.624, 1.0, 0.001), 5.5)
    data_material = create_material("MAT_AV_Storyboard_Data", (0.015, 0.04, 0.018), 0.65, 0.2, (0.624, 1.0, 0.001), 1.7)
    stars_material = create_material("MAT_AV_Storyboard_Stars", (0.22, 0.3, 0.42), 0.0, 0.5, (0.22, 0.3, 0.42), 1.4)
    field = particle_mesh("AV_Runtime_Field_Preview", particle_lime, mobile)
    stars = star_mesh(stars_material, mobile)

    camera_data = bpy.data.cameras.new("AV_Storyboard_Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 1.52 if mobile else 1.15
    camera = bpy.data.objects.new("AV_Storyboard_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, -2.0, 0.04)
    camera.rotation_euler = (Vector((0.0, 0.0, 0.04)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera

    key = add_area("AV_Key", (-0.9, -1.1, 1.1), 620, 3.2, (0.72, 0.84, 1.0))
    rim = add_area("AV_Lime_Rim", (1.0, 0.5, 0.65), 420, 2.5, (0.55, 1.0, 0.01))
    fill = add_area("AV_Fill", (0.0, -0.3, -1.1), 180, 3.0, (0.18, 0.28, 0.48))

    assembled_a = a_root.location.copy()
    assembled_v = v_root.location.copy()
    for index, state in enumerate(STATES, start=1):
        root.location = (0.0, 0.0, 0.10 if mobile else 0.08)
        root.rotation_euler = (math.radians(-7), 0.0, math.radians(-6))
        root.scale = (0.86, 0.86, 0.86) if mobile else (0.92, 0.92, 0.92)
        a_root.location = assembled_a
        v_root.location = assembled_v
        restore_materials(a_primary, a_materials, a_material_indices)
        restore_materials(v_primary, v_materials, v_material_indices)
        field.hide_render = False
        field.scale = (1.0, 1.0, 1.0)
        stars.hide_render = False
        emission_strength(particle_lime, 4.0)
        key.data.energy = 620
        rim.data.energy = 420
        fill.data.energy = 180

        if index == 1:
            root.scale *= 0.9
            key.data.energy = 35
            rim.data.energy = 55
            fill.data.energy = 15
            emission_strength(particle_lime, 0.12)
        elif index == 3:
            emission_strength(particle_lime, 8.0)
            rim.data.energy = 850
        elif index == 4:
            root.rotation_euler = (math.radians(-15), math.radians(3), math.radians(-13))
        elif index == 5:
            a_root.location.x -= 0.045
            v_root.location.x += 0.045
            emission_strength(particle_lime, 5.5)
        elif index == 6:
            a_root.location.y -= 0.028
            v_root.location.y += 0.028
            root.rotation_euler.x = math.radians(-8)
        elif index == 7:
            a_root.location.x -= 0.085
            v_root.location.x += 0.085
            a_root.rotation_euler.y = math.radians(-4)
            v_root.rotation_euler.y = math.radians(4)
            field.scale.x = 1.13
        elif index == 8:
            set_material(a_primary, data_material)
            set_material(v_primary, data_material)
            emission_strength(particle_lime, 7.0)
            root.scale *= 0.92
        elif index == 9:
            root.scale *= 0.66
            root.location.y = 0.18
            root.location.z += 0.06
            key.data.energy = 120
            fill.data.energy = 50
            emission_strength(particle_lime, 0.7)
        elif index == 10:
            emission_strength(particle_lime, 5.2)
            rim.data.energy = 650

        output_path = os.path.join(output_dir, f"{state}.webp")
        scene.render.filepath = output_path
        bpy.ops.render.render(write_still=True)
        if device == "desktop":
            desktop_renders[state] = output_path

fallback_map = {
    "hero-desktop.webp": "02-logo-revealed",
    "activated-logo.webp": "03-logo-activated",
    "av-separated.webp": "05-logo-av-separated",
    "layer-expanded.webp": "06-logo-layer-expanded",
    "portfolio-frame.webp": "07-logo-portfolio-frame",
    "data-state.webp": "08-logo-data-state",
    "background-mark.webp": "09-logo-background-mark",
    "final-reassembled.webp": "10-logo-reassembled",
}
for destination, state in fallback_map.items():
    shutil.copy2(desktop_renders[state], os.path.join(FALLBACKS, destination))
shutil.copy2(
    os.path.join(OUTPUTS["mobile"], "02-logo-revealed.webp"),
    os.path.join(FALLBACKS, "hero-mobile.webp"),
)
print(f"Rendered {len(STATES) * 2} storyboards and {len(fallback_map) + 1} fallbacks")
