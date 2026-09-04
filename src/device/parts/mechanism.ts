import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/**
 * The inner rotating plate and its six radial rail spokes, visible beneath the dial
 * and seen spinning while the device is active. Adds all parts to `target`.
 */
export function buildMechanism(target: THREE.Group, materials: DeviceMaterials) {
  const plate = cylinder(1.5, 0.18, materials.blackMetal, 64);
  plate.position.z = 0.52;

  // Ring tying the rail spokes together.
  const carrier = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 10, 48), materials.graphite);
  carrier.position.z = 0.65;

  target.add(plate, carrier);

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(0.16, 0.68, 0.13, 2, 0.035),
      materials.gunmetal,
    );
    rail.position.set(Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0.65);
    rail.rotation.z = angle + Math.PI / 2;
    target.add(rail);
  }
}
