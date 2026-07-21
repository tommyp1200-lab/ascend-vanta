import bpy
import math
import os
from mathutils import Vector

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
source = os.path.join(root, "source-assets/models/AVFINALLOGO.glb")
output = os.path.join(root, "docs/assets/av-logo-original-inspection.png")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source, import_pack_images=True)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1200
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("Inspection_World")
scene.world.color = (0.002, 0.002, 0.003)

camera_data = bpy.data.cameras.new("Inspection_Camera")
camera = bpy.data.objects.new("Inspection_Camera", camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
camera.location = (0.0, -1.9, 0.0)
camera.data.lens = 58
direction = Vector((0.0, 0.0, 0.0)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

for name, location, energy, size, color in [
    ("Key", (-1.2, -1.4, 1.4), 1100, 4.0, (0.82, 0.95, 1.0)),
    ("Lime_Rim", (1.2, 0.5, 0.6), 850, 3.0, (0.62, 1.0, 0.01)),
    ("Fill", (0.0, -0.2, -1.4), 650, 3.0, (0.3, 0.4, 0.55)),
]:
    light_data = bpy.data.lights.new(name, "AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light_data.color = color
    light = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (math.radians(25), 0.0, math.radians(25))

scene.render.filepath = output
bpy.ops.render.render(write_still=True)
print(output)
