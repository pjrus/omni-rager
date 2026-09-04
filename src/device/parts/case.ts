import * as THREE from "three";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/** One side button housing and its glowing button (`direction` is -1 for left, 1 for right). */
function buildSideButton(materials: DeviceMaterials, direction: -1 | 1) {
  const group = new THREE.Group();

  const buttonHousing = cylinder(0.25, 0.22, materials.gunmetal, 24);
  buttonHousing.position.set(direction * 2.03, 0.18, 0.55);
  buttonHousing.rotation.z = direction * 0.06;

  const sideButton = cylinder(0.135, 0.15, materials.energy, 24);
  sideButton.position.set(direction * 2.03, 0.18, 0.72);

  group.add(buttonHousing, sideButton);
  return group;
}

/**
 * The circular pod that sits on top of the housing and holds the dial/core: base,
 * middle, top plate, outer bezel, side buttons, and lower indicator. Adds parts to
 * `target` (`root`) and the outer bezel to `outerRing` so it can rotate independently.
 */
export function buildCase(target: THREE.Group, outerRing: THREE.Group, materials: DeviceMaterials) {
  const base = cylinder(2.12, 0.74, materials.blackMetal, 80);
  base.position.z = -0.18;

  const middle = cylinder(2.04, 0.78, materials.gunmetal, 80);
  middle.position.z = 0.1;

  // Top plate, sitting just beneath the outer bezel ring.
  const top = cylinder(1.93, 0.3, materials.blackMetal, 80);
  top.position.z = 0.54;

  // The large black ring framing the dial, mounted in `outerRing` so it spins independently.
  const outerBezel = new THREE.Mesh(
    new THREE.TorusGeometry(1.86, 0.24, 18, 80),
    materials.blackMetal,
  );
  outerBezel.position.z = 0.7;
  outerRing.add(outerBezel);

  const indicatorHousing = cylinder(0.29, 0.22, materials.gunmetal, 24);
  indicatorHousing.position.set(0, -2.03, 0.56);

  const indicator = cylinder(0.15, 0.15, materials.energy, 24);
  indicator.position.set(0, -2.03, 0.73);

  target.add(
    base,
    middle,
    top,
    outerRing,
    buildSideButton(materials, -1),
    buildSideButton(materials, 1),
    indicatorHousing,
    indicator,
  );
}
