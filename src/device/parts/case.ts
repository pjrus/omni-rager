import * as THREE from "three";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

function buildCaseBase(materials: DeviceMaterials) {
  const base = cylinder(2.12, 0.74, materials.blackMetal, 80);
  base.position.z = -0.18;
  return base;
}

function buildCaseMiddle(materials: DeviceMaterials) {
  const caseMiddle = cylinder(2.04, 0.78, materials.gunmetal, 80);
  caseMiddle.position.z = 0.1;
  return caseMiddle;
}

/** The case's top plate, sitting just beneath the outer bezel ring. */
function buildCaseTop(materials: DeviceMaterials) {
  const caseTop = cylinder(1.93, 0.3, materials.blackMetal, 80);
  caseTop.position.z = 0.54;
  return caseTop;
}

/** The large black ring framing the dial; returned separately so it can be mounted in its own `outerRing` group and spin independently. */
function buildOuterBezel(materials: DeviceMaterials) {
  const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.24, 18, 80), materials.blackMetal);
  outerBezel.position.z = 0.7;
  return outerBezel;
}

/** One side button housing and its glowing button (`direction` is -1 for left, 1 for right). */
function buildSideButton(materials: DeviceMaterials, direction: -1 | 1) {
  const group = new THREE.Group();

  const buttonHousing = cylinder(0.25, 0.22, materials.gunmetal, 24);
  buttonHousing.position.set(direction * 2.03, 0.18, 0.55);
  buttonHousing.rotation.z = direction * 0.06;
  group.add(buttonHousing);

  const sideButton = cylinder(0.135, 0.15, materials.energy, 24);
  sideButton.position.set(direction * 2.03, 0.18, 0.72);
  group.add(sideButton);

  return group;
}

/** The lower indicator housing and its glowing LED. */
function buildLowerIndicator(materials: DeviceMaterials) {
  const group = new THREE.Group();

  const lowerIndicatorHousing = cylinder(0.29, 0.22, materials.gunmetal, 24);
  lowerIndicatorHousing.position.set(0, -2.03, 0.56);
  group.add(lowerIndicatorHousing);

  const lowerIndicator = cylinder(0.15, 0.15, materials.energy, 24);
  lowerIndicator.position.set(0, -2.03, 0.73);
  group.add(lowerIndicator);

  return group;
}

/**
 * The circular pod that sits on top of the housing and holds the dial/core: base,
 * middle, top plate, outer bezel, side buttons, and lower indicator. Adds parts to
 * `target` (`root`) and the outer bezel to `outerRing` so it can rotate independently.
 */
export function buildCase(target: THREE.Group, outerRing: THREE.Group, materials: DeviceMaterials) {
  target.add(buildCaseBase(materials));
  target.add(buildCaseMiddle(materials));
  target.add(buildCaseTop(materials));
  outerRing.add(buildOuterBezel(materials));
  target.add(outerRing);
  target.add(buildSideButton(materials, -1));
  target.add(buildSideButton(materials, 1));
  target.add(buildLowerIndicator(materials));
}
