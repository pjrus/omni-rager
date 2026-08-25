import * as THREE from "three";

/** Builds a cylinder mesh rotated so its flat face points along Z, matching the device's front-facing orientation. */
export function cylinder(radius: number, depth: number, material: THREE.Material, segments = 64) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, segments),
    material,
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}
