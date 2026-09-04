import * as THREE from "three";

const hitMaterial = () => new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

/**
 * The invisible hit-test meshes backing pointer interaction on the device (see
 * `interactions/pointer.ts`): the dial ring backs drag-to-rotate, the centre disc
 * backs tap-to-engage on the core, and the housing disc lets a long-press begin
 * away from the selector dial.
 */
export function buildHitMeshes() {
  const dialHit = new THREE.Mesh(new THREE.RingGeometry(1.38, 2.08, 64), hitMaterial());
  dialHit.position.z = 0.9;

  const centreHit = new THREE.Mesh(new THREE.CircleGeometry(1.35, 48), hitMaterial());
  centreHit.position.z = 1.04;

  const dragHit = new THREE.Mesh(new THREE.CircleGeometry(2.72, 64), hitMaterial());
  dragHit.position.z = 0.5;

  return { dialHit, centreHit, dragHit };
}
