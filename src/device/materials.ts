import * as THREE from "three";

/**
 * The device's shared materials, built once per `OmniDevice` and threaded through
 * every part builder under `./parts/` so parts referencing e.g. `materials.blackMetal`
 * share one material instance.
 */
export function createMaterials() {
  return {
    graphite: new THREE.MeshStandardMaterial({ color: 0x1a1d1b, metalness: 0.3, roughness: 0.42 }),
    gunmetal: new THREE.MeshStandardMaterial({ color: 0x343836, metalness: 0.52, roughness: 0.32 }),
    blackMetal: new THREE.MeshStandardMaterial({
      color: 0x070908,
      metalness: 0.25,
      roughness: 0.48,
    }),
    bone: new THREE.MeshStandardMaterial({ color: 0xe6e9e4, metalness: 0.12, roughness: 0.32 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc7cbc6, metalness: 0.72, roughness: 0.23 }),
    shutterMaterial: new THREE.MeshStandardMaterial({
      color: 0x606461,
      metalness: 0.38,
      roughness: 0.36,
    }),
    energy: new THREE.MeshStandardMaterial({
      color: 0x9bff32,
      emissive: 0x4f9e0c,
      emissiveIntensity: 0.85,
      metalness: 0.05,
      roughness: 0.25,
    }),
    darkEnergy: new THREE.MeshStandardMaterial({
      color: 0x2a3e0d,
      emissive: 0x1d3804,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.35,
    }),
    displayEnergy: new THREE.MeshBasicMaterial({ color: 0xb9ff42, toneMapped: false }),
  };
}

export type DeviceMaterials = ReturnType<typeof createMaterials>;
