import trimesh
import os

output_dir = 'public/models/'

# 1. Skeletal - White Box
box = trimesh.creation.box(extents=(2, 2, 2))
box.visual.vertex_colors = [255, 255, 255, 255] # White
box.export(os.path.join(output_dir, 'skeletal.glb'))

# 2. Muscular - Red Cylinder
cylinder = trimesh.creation.cylinder(radius=1.0, height=3.0)
cylinder.visual.vertex_colors = [200, 50, 50, 255] # Dark Red
cylinder.export(os.path.join(output_dir, 'muscular.glb'))

# 3. Cardiovascular - Bright Red Sphere
sphere = trimesh.creation.icosphere(radius=1.5)
sphere.visual.vertex_colors = [255, 0, 0, 255] # Bright Red
sphere.export(os.path.join(output_dir, 'cardiovascular.glb'))

# 4. Nervous - Yellow Torus (Annulus)
torus = trimesh.creation.annulus(r_min=0.5, r_max=1.5, height=0.5)
torus.visual.vertex_colors = [255, 255, 0, 255] # Yellow
torus.export(os.path.join(output_dir, 'nervous.glb'))

print("Generated primitive GLB files.")
