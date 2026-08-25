import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/** The flat rotating plate the rail spokes are mounted to. */
function buildMechanismPlate(materials: DeviceMaterials) {
  const plate = cylinder(1.5, 0.18, materials.blackMetal, 64);
  plate.position.z = 0.52;
  return plate;
}

/** The ring that visually ties the rail spokes together. */
function buildMechanismCarrier(materials: DeviceMaterials) {
  const carrier = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 10, 48), materials.graphite);
  carrier.position.z = 0.65;
  return carrier;
}

/** One radial rail spoke, at the given index of six evenly spaced around the plate. */
function buildMechanismRail(materials: DeviceMaterials, index: number) {
  const angle = (index / 6) * Math.PI * 2;
  const rail = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.68, 0.13, 2, 0.035), materials.gunmetal);
  rail.position.set(Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0.65);
  rail.rotation.z = angle + Math.PI / 2;
  return rail;
}

/**
 * The inner rotating plate and rail spokes visible beneath the dial, seen spinning
 * while the device is active. Adds all parts to `target` (the `mechanism` group).
 */
export function buildMechanism(target: THREE.Group, materials: DeviceMaterials) {
  target.add(buildMechanismPlate(materials));
  target.add(buildMechanismCarrier(materials));
  for (let index = 0; index < 6; index += 1) {
    target.add(buildMechanismRail(materials, index));
  }
}
