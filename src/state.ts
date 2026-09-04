import * as THREE from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import type { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { projects } from "./data/projects";
import type { OmniDevice } from "./device/OmniDevice";

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
export const compactDevice = window.matchMedia("(max-width: 700px)");
export const projectStep = (Math.PI * 2) / projects.length;

/** The device's root scale, which shrinks on compact viewports and grows once engaged. */
export const deviceScale = (active: boolean) =>
  compactDevice.matches ? (active ? 0.76 : 0.7) : active ? 0.9 : 0.82;

/** Camera distance and max pixel ratio, both eased back on compact viewports. */
export const cameraDistance = () => (compactDevice.matches ? 11.2 : 10.5);
export const maxPixelRatio = () =>
  Math.min(window.devicePixelRatio, compactDevice.matches ? 1.35 : 1.8);

export type InteractionMode = "idle" | "pending" | "dial" | "rotate" | "drag" | "cancelled";
export type PressTarget = "centre" | "housing" | null;

/**
 * The app's single shared mutable runtime state object. Scene, interaction and
 * animation modules each receive an `AppState` by reference so they read and
 * mutate the same live Three.js objects, pointer/drag vectors and interaction
 * flags without importing from one another.
 */
export class AppState {
  renderer!: THREE.WebGLRenderer;
  composer!: EffectComposer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  omni!: OmniDevice;
  bloom!: UnrealBloomPass;
  animationFrame = 0;
  lastTime = performance.now();
  elapsed = 0;
  explored = false;
  pointerMoved = 0;
  lastPointerAngle = 0;
  wheelLocked = false;
  activePointerId: number | null = null;
  longPressTimer: number | null = null;
  interactionMode: InteractionMode = "idle";
  pressTarget: PressTarget = null;

  readonly longPressDelay = 450;
  readonly tapMovementLimit = 8;
  readonly dragBoundaryPadding = 12;
  readonly pointer = new THREE.Vector2();
  readonly lastPointerPosition = new THREE.Vector2();
  readonly pressStartPosition = new THREE.Vector2();
  readonly deviceRotationTarget = new THREE.Vector2(-0.06, 0.12);
  readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  readonly dragOffset = new THREE.Vector3();
  readonly dragWorldPosition = new THREE.Vector3();
  readonly dragTargetPosition = new THREE.Vector3();
  readonly dragConstrainedPosition = new THREE.Vector3();
  readonly raycaster = new THREE.Raycaster();
}
