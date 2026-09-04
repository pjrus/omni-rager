import * as THREE from "three";

/** The ambient particle field drifting around the device (not part of the physical model). */
export function buildParticles(compact: boolean) {
  const count = compact ? 90 : 180;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 2.7 + Math.random() * 3.2;
    const angle = Math.random() * Math.PI * 2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 2.4;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xb9ff42,
    size: 0.025,
    transparent: true,
    opacity: 0.28,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "particles";
  return { points, material };
}
