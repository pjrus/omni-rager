import * as THREE from "three";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/** The solid backing plate behind the dial ring. */
function buildDialPlate(materials: DeviceMaterials) {
  const dialPlate = cylinder(1.48, 0.18, materials.graphite, 64);
  dialPlate.position.z = 0.82;
  return dialPlate;
}

/** The outer selector dial ring the user drags to rotate through projects (rotated via `dialTarget` in `update()`). */
function buildDialRing(materials: DeviceMaterials) {
  const dialRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.075, 12, 64),
    materials.blackMetal,
  );
  dialRing.position.z = 0.94;
  return dialRing;
}

/** Assembles the dial's backing plate and ring into `target` (the `dial` group). */
export function buildDial(target: THREE.Group, materials: DeviceMaterials) {
  target.add(buildDialPlate(materials));
  target.add(buildDialRing(materials));
}
