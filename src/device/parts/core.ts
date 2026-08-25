import * as THREE from "three";
import { cylinder } from "../geometry";
import type { DeviceMaterials } from "../materials";

export type CoreParts = {
  cradle: THREE.Mesh;
  energyFace: THREE.Mesh;
  leftShutter: THREE.Group;
  rightShutter: THREE.Group;
  lens: THREE.Mesh;
  silverBezel: THREE.Mesh;
};

function buildCradle(materials: DeviceMaterials) {
  const cradle = cylinder(1.4, 0.2, materials.darkEnergy, 64);
  cradle.position.z = 0.94;
  return cradle;
}

function buildEnergyFace(materials: DeviceMaterials) {
  const energyFace = cylinder(1.3, 0.1, materials.energy, 64);
  energyFace.position.z = 1.08;
  return energyFace;
}

function createShutterShape(radius: number, angle: number, pointX: number) {
  const shape = new THREE.Shape();
  const upperAngle = Math.PI - angle;
  const lowerAngle = -Math.PI + angle;
  shape.moveTo(Math.cos(upperAngle) * radius, Math.sin(upperAngle) * radius);
  shape.lineTo(pointX, 0);
  shape.lineTo(Math.cos(lowerAngle) * radius, Math.sin(lowerAngle) * radius);
  shape.absarc(0, 0, radius, lowerAngle, upperAngle, true);
  shape.closePath();
  return shape;
}

function extrudeShutter(shape: THREE.Shape, depth: number) {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.03,
    bevelSegments: 2,
    steps: 1,
  });
}

/**
 * One half of the shutter pair that parts to reveal the glowing core (`side` is
 * "left" or "right" — the right shutter mirrors the left via a negative X scale).
 * Separate backing and face geometry creates the heavy black shutter outline.
 */
function buildShutter(
  materials: DeviceMaterials,
  side: "left" | "right",
  backingGeometry: THREE.ExtrudeGeometry,
  faceGeometry: THREE.ExtrudeGeometry,
) {
  const shutter = new THREE.Group();
  const mirror = side === "right" ? -1 : 1;

  const backing = new THREE.Mesh(backingGeometry, materials.blackMetal);
  backing.scale.x = mirror;
  shutter.add(backing);

  const face = new THREE.Mesh(faceGeometry, materials.shutterMaterial);
  face.scale.x = mirror;
  face.position.z = 0.055;
  shutter.add(face);

  shutter.position.z = 1.15;
  return shutter;
}

function buildLens() {
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd9dfd8,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.25,
    transparent: true,
    opacity: 0.08,
    thickness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
    depthWrite: false,
  });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(1.27, 64), lensMaterial);
  lens.position.z = 1.285;
  return lens;
}

/** The raised silver lip keeps the shutters physically inside the selector pod. */
function buildSilverBezel(materials: DeviceMaterials) {
  const silverBezel = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.16, 14, 80), materials.silver);
  silverBezel.position.z = 1.1;
  return silverBezel;
}

/**
 * The centre core: glowing energy face, the two shutters that part to reveal it,
 * lens, and silver bezel. Adds all parts to `target` (the `core` group) and returns
 * the refs `OmniDevice` needs for `setHourglassVisible()`.
 */
export function buildCore(target: THREE.Group, materials: DeviceMaterials): CoreParts {
  const backingGeometry = extrudeShutter(createShutterShape(1.245, Math.PI / 4, -0.12), 0.09);
  const faceGeometry = extrudeShutter(createShutterShape(1.16, Math.PI / 4.15, -0.25), 0.075);

  const cradle = buildCradle(materials);
  const energyFace = buildEnergyFace(materials);
  const leftShutter = buildShutter(materials, "left", backingGeometry, faceGeometry);
  const rightShutter = buildShutter(materials, "right", backingGeometry, faceGeometry);
  const lens = buildLens();
  const silverBezel = buildSilverBezel(materials);

  target.add(cradle, energyFace, leftShutter, rightShutter, lens, silverBezel);

  return { cradle, energyFace, leftShutter, rightShutter, lens, silverBezel };
}
