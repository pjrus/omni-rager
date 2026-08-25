import * as THREE from "three";

export type HitMeshes = {
  dialHit: THREE.Mesh;
  centreHit: THREE.Mesh;
  dragHit: THREE.Mesh;
};

/** The dial hit ring backs drag-to-rotate interaction on the outer selector dial. */
function buildDialHit() {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(1.38, 2.08, 64),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  mesh.position.z = 0.9;
  return mesh;
}

/** The centre hit disc backs tap-to-engage on the core, independent of dial rotation. */
function buildCentreHit() {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 48),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  mesh.position.z = 1.04;
  return mesh;
}

/** The housing hit area lets a long-press begin away from the selector dial. */
function buildDragHit() {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(2.72, 64),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  mesh.position.z = 0.5;
  return mesh;
}

/** The invisible hit-test meshes backing pointer interaction on the device (see `interactions/pointer.ts`). */
export function buildHitMeshes(): HitMeshes {
  return {
    dialHit: buildDialHit(),
    centreHit: buildCentreHit(),
    dragHit: buildDragHit(),
  };
}
