import * as THREE from "three";
import { SoundSystem } from "../audio/SoundSystem";
import { canvas } from "../dom/elements";
import {
  constrainDragPosition,
  raycastDevice,
  screenAngle,
  worldPositionAtScreen,
} from "../scene/scene";
import { AppState } from "../state";
import { engageProject, moveProject, selectFromRotation } from "../animations/projectFlow";
import { revealPortfolio, setDragFeedback } from "../ui/interface";

export function onPointerDown(event: PointerEvent, state: AppState) {
  if (
    state.omni.busy ||
    state.activePointerId !== null ||
    !event.isPrimary ||
    (event.pointerType === "mouse" && event.button !== 0)
  ) return;
  const hits = raycastDevice(event, state);
  if (!hits.length) return;

  const hitObject = hits[0].object;
  state.activePointerId = event.pointerId;
  state.pointerMoved = 0;
  state.pressStartPosition.set(event.clientX, event.clientY);
  state.lastPointerPosition.copy(state.pressStartPosition);
  state.pressTarget = hitObject === state.omni.centreHit ? "centre" : "housing";
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();

  if (hitObject === state.omni.dialHit) {
    state.interactionMode = state.omni.active ? "rotate" : "dial";
    state.omni.dialVelocity = 0;
    state.lastPointerAngle = screenAngle(event, state);
    canvas.classList.add("is-dragging");
    return;
  }

  if (hitObject === state.omni.dragHit && state.omni.active) {
    state.interactionMode = "rotate";
    canvas.classList.add("is-dragging");
    return;
  }

  state.interactionMode = "pending";
  setDragFeedback(state, "pressing");
  state.longPressTimer = window.setTimeout(() => {
    if (state.interactionMode !== "pending" || state.activePointerId !== event.pointerId) return;
    state.omni.syncPositionTarget(state.elapsed);
    state.dragPlane.constant = -state.omni.root.position.z;
    const pointerWorld = worldPositionAtScreen(event.clientX, event.clientY, state);
    if (!pointerWorld) {
      state.interactionMode = "cancelled";
      setDragFeedback(state, "idle");
      return;
    }
    state.dragOffset.copy(state.omni.root.getWorldPosition(new THREE.Vector3())).sub(pointerWorld);
    state.interactionMode = "drag";
    setDragFeedback(state, "dragging");
    canvas.classList.add("is-dragging");
  }, state.longPressDelay);
}

export function onPointerMove(event: PointerEvent, state: AppState) {
  if (event.pointerId !== state.activePointerId || state.omni.busy) return;

  const currentPosition = new THREE.Vector2(event.clientX, event.clientY);
  state.pointerMoved = Math.max(state.pointerMoved, currentPosition.distanceTo(state.pressStartPosition));

  if (state.interactionMode === "pending") {
    if (state.pointerMoved > state.tapMovementLimit) {
      clearLongPress(state);
      state.interactionMode = "cancelled";
      setDragFeedback(state, "idle");
    }
    return;
  }

  if (state.interactionMode === "drag") {
    const pointerWorld = worldPositionAtScreen(event.clientX, event.clientY, state);
    if (!pointerWorld) return;
    state.dragTargetPosition.copy(pointerWorld).add(state.dragOffset);
    state.dragConstrainedPosition.copy(state.dragTargetPosition);
    constrainDragPosition(state.dragConstrainedPosition, state);
    state.omni.positionTarget.set(
      state.dragConstrainedPosition.x,
      state.dragConstrainedPosition.y - state.omni.getBobOffset(state.elapsed),
      state.omni.positionTarget.z,
    );
    event.preventDefault();
    return;
  }

  if (state.interactionMode === "rotate") {
    const movement = currentPosition.clone().sub(state.lastPointerPosition);
    state.deviceRotationTarget.y += movement.x * 0.006;
    state.deviceRotationTarget.x = THREE.MathUtils.clamp(state.deviceRotationTarget.x + movement.y * 0.006, -Math.PI, Math.PI);
    state.lastPointerPosition.set(event.clientX, event.clientY);
    event.preventDefault();
    return;
  }

  if (state.interactionMode !== "dial") return;
  const angle = screenAngle(event, state);
  let delta = angle - state.lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  state.omni.dialTarget += delta;
  state.omni.dialVelocity = delta;
  state.lastPointerAngle = angle;
  revealPortfolio(state);
}

function finishPointerInteraction(state: AppState, sounds: SoundSystem, cancelled = false, pointerId?: number) {
  if (state.activePointerId === null || (pointerId !== undefined && pointerId !== state.activePointerId)) return;

  const capturedPointerId = state.activePointerId;
  const completedMode = state.interactionMode;
  const completedPressTarget = state.pressTarget;
  clearLongPress(state);
  state.activePointerId = null;
  state.interactionMode = "idle";
  state.pressTarget = null;
  canvas.classList.remove("is-dragging", "is-pressing");
  setDragFeedback(state, "idle");
  if (canvas.hasPointerCapture(capturedPointerId)) canvas.releasePointerCapture(capturedPointerId);

  if (!cancelled && completedMode === "pending" && completedPressTarget === "centre" && state.pointerMoved <= state.tapMovementLimit) {
    engageProject(state, sounds);
    return;
  }

  if (completedMode !== "dial") return;
  state.omni.dialTarget += state.omni.dialVelocity * 2.4;
  selectFromRotation(state, sounds, true, state.omni.dialVelocity <= 0 ? 1 : -1);
}

export function onPointerUp(event: PointerEvent, state: AppState, sounds: SoundSystem) {
  finishPointerInteraction(state, sounds, event.type === "pointercancel", event.pointerId);
}

export function onLostPointerCapture(event: PointerEvent, state: AppState, sounds: SoundSystem) {
  finishPointerInteraction(state, sounds, true, event.pointerId);
}

export function cancelPointerInteraction(state: AppState, sounds: SoundSystem) {
  finishPointerInteraction(state, sounds, true);
}

export function onWindowPointerOut(event: PointerEvent, state: AppState, sounds: SoundSystem) {
  if (event.relatedTarget === null && event.pointerId === state.activePointerId) {
    finishPointerInteraction(state, sounds, true, event.pointerId);
  }
}

function clearLongPress(state: AppState) {
  if (state.longPressTimer === null) return;
  window.clearTimeout(state.longPressTimer);
  state.longPressTimer = null;
}

export function onWheel(event: WheelEvent, state: AppState, sounds: SoundSystem) {
  if (Math.abs(event.deltaY) < 8 || state.wheelLocked || state.omni.busy) return;
  event.preventDefault();
  state.wheelLocked = true;
  moveProject(state, sounds, event.deltaY > 0 ? 1 : -1);
  window.setTimeout(() => {
    state.wheelLocked = false;
  }, 360);
}
