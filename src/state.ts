import * as THREE from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import type { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { projects } from "./data/projects";
import type { OmniDevice } from "./device/OmniDevice";

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
export const compactDevice = window.matchMedia("(max-width: 700px)");
export const projectStep = (Math.PI * 2) / projects.length;

export type InteractionMode = "idle" | "pending" | "dial" | "rotate" | "drag" | "cancelled";
export type PressTarget = "centre" | "housing" | null;

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
