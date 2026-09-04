import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

/** The shoulder blocks and seam strip on one side (`direction` is -1 for left, 1 for right). */
function buildShoulderPair(materials: DeviceMaterials, direction: -1 | 1) {
  const group = new THREE.Group();

  const upperShoulder = new THREE.Mesh(
    new RoundedBoxGeometry(1.08, 1.8, 0.94, 4, 0.2),
    materials.graphite,
  );
  upperShoulder.position.set(direction * 2.37, 1.12, -0.6);
  upperShoulder.rotation.z = direction * 0.05;

  const lowerShoulder = new THREE.Mesh(
    new RoundedBoxGeometry(1.02, 1.72, 0.94, 4, 0.2),
    materials.gunmetal,
  );
  lowerShoulder.position.set(direction * 2.36, -1.42, -0.62);
  lowerShoulder.rotation.z = direction * -0.045;

  const seam = new THREE.Mesh(
    new RoundedBoxGeometry(0.12, 2.76, 0.08, 2, 0.035),
    materials.blackMetal,
  );
  seam.position.set(direction * 1.55, -0.72, -0.16);

  group.add(upperShoulder, lowerShoulder, seam);
  return group;
}

/** The lower actuator bracket, housing, and glowing button. */
function buildActuatorAssembly(materials: DeviceMaterials) {
  const group = new THREE.Group();

  const bracket = new THREE.Mesh(
    new RoundedBoxGeometry(1.42, 0.5, 0.52, 4, 0.12),
    materials.blackMetal,
  );
  bracket.position.set(0, -2.42, -0.02);

  const actuatorHousing = cylinder(0.43, 0.34, materials.gunmetal, 32);
  actuatorHousing.position.set(0, -2.59, 0.19);

  const actuator = cylinder(0.25, 0.2, materials.energy, 32);
  actuator.position.set(0, -2.59, 0.42);

  group.add(bracket, actuatorHousing, actuator);
  return group;
}

const GUARD_PATHS = [
  [
    [-1.68, 2.38],
    [-2.02, 2.42],
    [-2.22, 2.04],
  ],
  [
    [1.68, 2.38],
    [2.02, 2.42],
    [2.22, 2.04],
  ],
  [
    [-2.22, -1.78],
    [-2.15, -2.24],
    [-1.78, -2.42],
  ],
  [
    [2.22, -1.78],
    [2.15, -2.24],
    [1.78, -2.42],
  ],
];

/** The four curved finger guards around the housing's corners. */
function buildFingerGuards(materials: DeviceMaterials) {
  const group = new THREE.Group();
  GUARD_PATHS.forEach((points) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0.34)));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.23, 12, false), materials.bone));
  });
  return group;
}

/**
 * The outer wrist-strap chassis: main body, upper/lower bridges, shoulders, seams,
 * actuator, catches, indicator, and finger guards. Adds all parts to `target` (`root`).
 */
export function buildHousing(target: THREE.Group, materials: DeviceMaterials) {
  const chassis = new THREE.Mesh(
    new RoundedBoxGeometry(4.58, 5.02, 0.92, 6, 0.28),
    materials.blackMetal,
  );
  chassis.position.z = -0.68;

  const upperBridge = new THREE.Mesh(
    new RoundedBoxGeometry(4.2, 1.12, 0.72, 5, 0.18),
    materials.graphite,
  );
  upperBridge.position.set(0, 2.02, -0.22);

  const lowerBridge = new THREE.Mesh(
    new RoundedBoxGeometry(4.14, 1.0, 0.74, 5, 0.18),
    materials.graphite,
  );
  lowerBridge.position.set(0, -2.04, -0.23);

  const upperCatch = cylinder(0.22, 0.22, materials.gunmetal, 24);
  upperCatch.position.set(0, 2.57, -0.1);

  const indicatorHousing = cylinder(0.29, 0.22, materials.gunmetal, 24);
  indicatorHousing.position.set(0, 2.03, 0.56);

  const indicator = cylinder(0.15, 0.15, materials.energy, 24);
  indicator.position.set(0, 2.03, 0.73);

  target.add(
    chassis,
    upperBridge,
    lowerBridge,
    buildShoulderPair(materials, -1),
    buildShoulderPair(materials, 1),
    buildActuatorAssembly(materials),
    upperCatch,
    indicatorHousing,
    indicator,
    buildFingerGuards(materials),
  );
}
