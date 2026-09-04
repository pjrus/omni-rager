import * as THREE from "three";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/** The dial's backing plate and the outer selector ring the user drags to rotate through projects (rotated via `dialTarget` in `update()`). */
export function buildDial(target: THREE.Group, materials: DeviceMaterials) {
  const plate = cylinder(1.48, 0.18, materials.graphite, 64);
  plate.position.z = 0.82;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.075, 12, 64), materials.blackMetal);
  ring.position.z = 0.94;

  target.add(plate, ring);
}
