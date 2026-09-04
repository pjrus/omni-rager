// Three.js renderer/scene/camera bootstrap and the render loop, plus the screen<->world
// projection math (raycasting, plane intersection, projected bounding-box extents) that
// keeps pointer/drag interactions in `interactions/pointer.ts` in sync with the 3D device.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { canvas, fallback, sceneWrap, systemStatus } from "../dom/elements";
import { OmniDevice } from "../device/OmniDevice";
import {
  AppState,
  cameraDistance,
  compactDevice,
  deviceScale,
  maxPixelRatio,
  reducedMotion,
} from "../state";

export function initialiseScene(state: AppState) {
  try {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x050806);
    state.scene.fog = new THREE.FogExp2(0x050806, 0.035);

    state.camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 60);
    state.camera.position.set(0, 0, cameraDistance());

    state.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    state.renderer.outputColorSpace = THREE.SRGBColorSpace;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.05;
    state.renderer.shadowMap.enabled = !compactDevice.matches;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    state.renderer.setPixelRatio(maxPixelRatio());
    state.renderer.setSize(window.innerWidth, window.innerHeight, false);

    const ambient = new THREE.AmbientLight(0x667066, 0.7);
    state.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xf1f4e9, 4.2);
    key.position.set(4, 5, 8);
    key.castShadow = !compactDevice.matches;
    key.shadow.mapSize.set(1024, 1024);
    state.scene.add(key);

    const rim = new THREE.PointLight(0xb9ff42, 9, 12, 2);
    rim.position.set(-4.5, 1.2, 4);
    state.scene.add(rim);

    const coolFill = new THREE.PointLight(0x91a99b, 12, 12, 2);
    coolFill.position.set(4, -3, 2);
    state.scene.add(coolFill);

    state.omni = new OmniDevice();
    state.scene.add(state.omni.root);

    state.composer = new EffectComposer(state.renderer);
    state.composer.addPass(new RenderPass(state.scene, state.camera));
    state.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      compactDevice.matches ? 0.18 : 0.24,
      0.16,
      0.93,
    );
    state.bloom.enabled = !reducedMotion.matches;
    state.composer.addPass(state.bloom);

    resize(state);
    state.animationFrame = requestAnimationFrame((now) => render(now, state));
  } catch (error) {
    console.error("WebGL initialisation failed", error);
    canvas.hidden = true;
    fallback.hidden = false;
    systemStatus.textContent = "SIMPLIFIED CORE";
  }
}

export function render(now: number, state: AppState) {
  const delta = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  state.elapsed += delta;
  state.omni.update(delta, state.elapsed, state.deviceRotationTarget);
  state.composer.render();
  state.animationFrame = requestAnimationFrame((next) => render(next, state));
}

export function resize(state: AppState) {
  if (!state.renderer || !state.camera || !state.composer) return;
  const width = sceneWrap.clientWidth;
  const height = sceneWrap.clientHeight;
  state.camera.aspect = width / height;
  state.camera.position.z = cameraDistance();
  state.camera.updateProjectionMatrix();
  state.renderer.setPixelRatio(maxPixelRatio());
  state.renderer.setSize(width, height, false);
  state.composer.setSize(width, height);
  state.bloom.setSize(width, height);
  state.omni.root.scale.setScalar(deviceScale(state.omni.active));
  constrainOmniTargetToScene(state);
}

/** Angle (radians) from the device's on-screen centre to the pointer, used to track dial-rotation drags. */
export function screenAngle(event: PointerEvent, state: AppState) {
  const bounds = canvas.getBoundingClientRect();
  const centre = new THREE.Vector3();
  state.omni.root.getWorldPosition(centre);
  centre.project(state.camera);
  const x = bounds.left + ((centre.x + 1) * bounds.width) / 2;
  const y = bounds.top + ((1 - centre.y) * bounds.height) / 2;
  return Math.atan2(event.clientY - y, event.clientX - x);
}

/** Writes the normalised device coordinates of a screen point into `state.pointer`. */
function setPointerFromScreen(clientX: number, clientY: number, state: AppState) {
  const bounds = canvas.getBoundingClientRect();
  state.pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
  state.pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;
}

export function projectToScreen(position: THREE.Vector3, state: AppState) {
  const bounds = canvas.getBoundingClientRect();
  const projected = position.clone().project(state.camera);
  return new THREE.Vector2(
    bounds.left + ((projected.x + 1) * bounds.width) / 2,
    bounds.top + ((1 - projected.y) * bounds.height) / 2,
  );
}

/** Casts a ray from a screen point through the camera and intersects it with the drag plane, giving the world-space point currently under the pointer. */
export function worldPositionAtScreen(clientX: number, clientY: number, state: AppState) {
  setPointerFromScreen(clientX, clientY, state);
  state.raycaster.setFromCamera(state.pointer, state.camera);
  return state.raycaster.ray.intersectPlane(state.dragPlane, state.dragWorldPosition);
}

/**
 * Measures the device's world-space bounding box and projects its corners to screen
 * space, returning the half-width/half-height (in pixels) it currently occupies. Used
 * instead of a fixed margin so the drag boundary adapts to the device's actual on-screen
 * size (which changes with scale/distance/viewport).
 */
export function getProjectedDeviceHalfExtents(state: AppState) {
  const worldBounds = new THREE.Box3();
  state.omni.root.updateMatrixWorld(true);
  state.omni.root.traverse((object) => {
    if (
      object instanceof THREE.Mesh &&
      object !== state.omni.centreHit &&
      object !== state.omni.dialHit &&
      object !== state.omni.dragHit &&
      object.name !== "particles"
    ) {
      worldBounds.expandByObject(object);
    }
  });

  if (worldBounds.isEmpty()) return new THREE.Vector2();

  const worldCentre = state.omni.root.getWorldPosition(new THREE.Vector3());
  const screenCentre = projectToScreen(worldCentre, state);
  const corners = [
    new THREE.Vector3(worldBounds.min.x, worldBounds.min.y, worldBounds.min.z),
    new THREE.Vector3(worldBounds.min.x, worldBounds.min.y, worldBounds.max.z),
    new THREE.Vector3(worldBounds.min.x, worldBounds.max.y, worldBounds.min.z),
    new THREE.Vector3(worldBounds.min.x, worldBounds.max.y, worldBounds.max.z),
    new THREE.Vector3(worldBounds.max.x, worldBounds.min.y, worldBounds.min.z),
    new THREE.Vector3(worldBounds.max.x, worldBounds.min.y, worldBounds.max.z),
    new THREE.Vector3(worldBounds.max.x, worldBounds.max.y, worldBounds.min.z),
    new THREE.Vector3(worldBounds.max.x, worldBounds.max.y, worldBounds.max.z),
  ];
  const halfExtents = new THREE.Vector2();
  corners.forEach((corner) => {
    const screenCorner = projectToScreen(corner, state);
    halfExtents.x = Math.max(halfExtents.x, Math.abs(screenCorner.x - screenCentre.x));
    halfExtents.y = Math.max(halfExtents.y, Math.abs(screenCorner.y - screenCentre.y));
  });
  return halfExtents;
}

/** Clamps a candidate world position so the device's projected screen bounds stay fully inside the canvas, then converts the clamped screen point back to world space. */
export function constrainDragPosition(position: THREE.Vector3, state: AppState) {
  const bounds = canvas.getBoundingClientRect();
  const halfExtents = getProjectedDeviceHalfExtents(state);
  const screenPosition = projectToScreen(position, state);
  const horizontalInset = Math.min(halfExtents.x + state.dragBoundaryPadding, bounds.width / 2);
  const verticalInset = Math.min(halfExtents.y + state.dragBoundaryPadding, bounds.height / 2);
  const constrainedX = THREE.MathUtils.clamp(
    screenPosition.x,
    bounds.left + horizontalInset,
    bounds.right - horizontalInset,
  );
  const constrainedY = THREE.MathUtils.clamp(
    screenPosition.y,
    bounds.top + verticalInset,
    bounds.bottom - verticalInset,
  );

  const worldPosition = worldPositionAtScreen(constrainedX, constrainedY, state);
  if (worldPosition) position.copy(worldPosition);
  return position;
}

export function constrainOmniTargetToScene(state: AppState) {
  if (!state.omni || !state.camera) return;
  state.dragTargetPosition.set(
    state.omni.positionTarget.x,
    state.omni.positionTarget.y + state.omni.getBobOffset(state.elapsed),
    state.omni.positionTarget.z,
  );
  constrainDragPosition(state.dragTargetPosition, state);
  state.omni.positionTarget.set(
    state.dragTargetPosition.x,
    state.dragTargetPosition.y - state.omni.getBobOffset(state.elapsed),
    state.omni.positionTarget.z,
  );
}

export function raycastDevice(event: PointerEvent, state: AppState) {
  setPointerFromScreen(event.clientX, event.clientY, state);
  state.raycaster.setFromCamera(state.pointer, state.camera);
  return state.raycaster.intersectObjects(
    [state.omni.centreHit, state.omni.dialHit, state.omni.dragHit],
    false,
  );
}
