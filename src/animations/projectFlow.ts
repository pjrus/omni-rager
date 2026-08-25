// GSAP timeline sequences that drive the device's state transitions: engaging a project,
// returning to the selector, switching between projects while engaged, and animating the
// dial selection. These timelines are the core "transformation" choreography behind the
// Omnitrix-inspired interaction — the product's signature moment.
import { gsap } from "gsap";
import { SoundSystem } from "../audio/SoundSystem";
import { projects } from "../data/projects";
import { app, systemStatus } from "../dom/elements";
import { AppState, compactDevice, projectStep, reducedMotion } from "../state";
import { revealPortfolio, setControlsDisabled, updateProjectInterface } from "../ui/interface";

export function applyProjectSelection(state: AppState, sounds: SoundSystem, index: number) {
  sounds.tick(1.2);
  state.omni.setProject(index);
  updateProjectInterface(index);
}

export function animateProjectSelection(state: AppState, sounds: SoundSystem, index: number, direction: number) {
  if (reducedMotion.matches) {
    applyProjectSelection(state, sounds, index);
    return;
  }

  const omni = state.omni;
  omni.busy = true;
  setControlsDisabled(true);
  systemStatus.textContent = "SELECTOR ROTATING";
  const targetRotation = omni.diamondDial.rotation.z - direction * Math.PI * 2;

  gsap
    .timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        omni.diamondDial.rotation.z = 0;
        omni.busy = false;
        setControlsDisabled(false);
        systemStatus.textContent = "SELECTOR READY";
      },
    })
    .to(omni.diamondDial.rotation, { z: targetRotation, duration: 0.78 }, 0)
    .call(() => applyProjectSelection(state, sounds, index), [], 0.39);
}

/**
 * Snaps the dial's continuous rotation target (`omni.dialTarget`, which accumulates freely
 * as the user drags/flicks/scrolls) to the nearest discrete project index, wrapping around
 * with modulo so the dial can spin past either end of the project list.
 */
export function selectFromRotation(state: AppState, sounds: SoundSystem, animate = false, direction = 1) {
  const omni = state.omni;
  const rawIndex = Math.round(-omni.dialTarget / projectStep);
  omni.dialTarget = -rawIndex * projectStep;
  const index = ((rawIndex % projects.length) + projects.length) % projects.length;
  if (index !== omni.selectedIndex) {
    if (animate) animateProjectSelection(state, sounds, index, direction);
    else applyProjectSelection(state, sounds, index);
  }
}

export function moveProject(state: AppState, sounds: SoundSystem, direction: number) {
  if (state.omni.busy) return;
  revealPortfolio(state);
  if (state.omni.active) {
    switchActiveProject(state, sounds, direction);
    return;
  }
  state.omni.dialTarget -= direction * projectStep;
  selectFromRotation(state, sounds, true, direction);
}

export function engageProject(state: AppState, sounds: SoundSystem) {
  const omni = state.omni;
  if (omni.busy || omni.active) return;
  revealPortfolio(state);
  omni.busy = true;
  setControlsDisabled(true);
  systemStatus.textContent = "TRANSFORMATION ACTIVE";
  sounds.play("transform");

  // Respect prefers-reduced-motion: jump straight to the engaged end state instead of
  // running the GSAP timeline below.
  if (reducedMotion.matches) {
    omni.projectDisplay.visible = false;
    omni.setHourglassVisible(true);
    omni.active = true;
    omni.busy = false;
    app.classList.add("is-active");
    setControlsDisabled(false);
    systemStatus.textContent = "PROJECT LINKED";
    sounds.play("recharged");
    return;
  }

  const timeline = gsap.timeline({
    defaults: { ease: "expo.inOut" },
    onComplete: () => {
      omni.active = true;
      omni.busy = false;
      omni.projectDisplay.visible = false;
      omni.diamondDial.rotation.z = 0;
      app.classList.add("is-active");
      setControlsDisabled(false);
      systemStatus.textContent = "PROJECT LINKED";
      sounds.play("recharged");
    },
  });
  const selectorTurn = omni.diamondDial.rotation.z + Math.PI * 2;
  timeline
    .to(omni.diamondDial.rotation, { z: selectorTurn, duration: 0.62 }, 0)
    .call(() => {
      omni.projectDisplay.visible = false;
      omni.setHourglassVisible(true);
    }, [], 0.64)
    .to(omni.core.position, { z: -0.2, duration: 0.24 }, 0.64)
    .to(omni.leftShutter.position, { x: -0.5, duration: 0.3 }, 0.67)
    .to(omni.rightShutter.position, { x: 0.5, duration: 0.3 }, 0.67)
    .to(omni.outerRing.rotation, { z: omni.outerRing.rotation.z - Math.PI * 0.32, duration: 0.48 }, 0.64)
    .to(omni.mechanism.scale, { x: 0.86, y: 0.86, duration: 0.3 }, 0.72)
    .call(() => sounds.play("transformation"), [], 0.9)
    .to(omni.dial.position, { z: 0.28, duration: 0.22 }, 0.89)
    .to(omni.core.rotation, { z: omni.core.rotation.z + Math.PI * 2, duration: 0.78 }, 0.94)
    .to(omni.leftShutter.position, { x: 0, duration: 0.34, ease: "back.out(2)" }, 1.29)
    .to(omni.rightShutter.position, { x: 0, duration: 0.34, ease: "back.out(2)" }, 1.29)
    .to(omni.core.position, { z: 0.38, duration: 0.32, ease: "back.out(2.5)" }, 1.34)
    .to(omni.mechanism.scale, { x: 1.05, y: 1.05, duration: 0.3 }, 1.32)
    .to(omni.mechanism.scale, { x: 1, y: 1, duration: 0.18 }, 1.62)
    .to(omni.dial.position, { z: 0.21, duration: 0.32 }, 1.46)
    .to(omni.root.scale, { x: compactDevice.matches ? 0.76 : 0.9, y: compactDevice.matches ? 0.76 : 0.9, z: compactDevice.matches ? 0.76 : 0.9, duration: 0.55 }, 1.18)
    .to(omni.particleMaterial, { opacity: 0.82, size: 0.055, duration: 0.24 }, 1.06)
    .to(omni.particleMaterial, { opacity: 0.34, size: 0.025, duration: 0.5 }, 1.44);
}

export function switchActiveProject(state: AppState, sounds: SoundSystem, direction: number) {
  const omni = state.omni;
  if (omni.busy) return;
  omni.busy = true;
  setControlsDisabled(true);
  app.classList.add("is-changing");
  systemStatus.textContent = "RECALIBRATING";
  sounds.play("power-down");

  // Respect prefers-reduced-motion: apply the switch immediately instead of running the
  // GSAP timeline below.
  const applySwitch = () => {
    omni.dialTarget -= direction * projectStep;
    selectFromRotation(state, sounds);
    sounds.play("transformation");
  };

  const completeSwitch = () => {
    app.classList.remove("is-changing");
    omni.busy = false;
    setControlsDisabled(false);
    systemStatus.textContent = "PROJECT LINKED";
  };

  if (reducedMotion.matches) {
    applySwitch();
    completeSwitch();
    return;
  }

  gsap
    .timeline({ onComplete: completeSwitch })
    .to(omni.leftShutter.position, { x: -0.48, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.rightShutter.position, { x: 0.48, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.core.position, { z: 0.08, duration: 0.2, ease: "expo.in" }, 0)
    .call(applySwitch, [], 0.2)
    .to(omni.core.rotation, { z: omni.core.rotation.z + direction * projectStep, duration: 0.42, ease: "expo.inOut" }, 0.18)
    .to(omni.leftShutter.position, { x: 0, duration: 0.34, ease: "back.out(2.1)" }, 0.4)
    .to(omni.rightShutter.position, { x: 0, duration: 0.34, ease: "back.out(2.1)" }, 0.4)
    .to(omni.core.position, { z: 0.38, duration: 0.3, ease: "back.out(2)" }, 0.4);
}

export function returnToSelector(state: AppState, sounds: SoundSystem) {
  const omni = state.omni;
  if (omni.busy || !omni.active) return;
  omni.busy = true;
  setControlsDisabled(true);
  sounds.play("power-down");
  systemStatus.textContent = "DISENGAGING";
  omni.projectDisplay.visible = reducedMotion.matches;
  omni.diamondDial.rotation.z = reducedMotion.matches ? 0 : -Math.PI * 2;

  // Respect prefers-reduced-motion: skip the GSAP timeline below and jump straight to the
  // disengaged end state.
  const finish = () => {
    omni.active = false;
    omni.busy = false;
    omni.setHourglassVisible(false);
    omni.projectDisplay.visible = true;
    omni.diamondDial.rotation.z = 0;
    app.classList.remove("is-active");
    setControlsDisabled(false);
    systemStatus.textContent = "SELECTOR READY";
  };

  if (reducedMotion.matches) {
    omni.setHourglassVisible(false);
    finish();
    return;
  }

  gsap
    .timeline({ onComplete: finish })
    .to(omni.leftShutter.position, { x: -0.38, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.rightShutter.position, { x: 0.38, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.core.position, { z: -0.18, duration: 0.28, ease: "expo.in" }, 0)
    .to(omni.root.scale, { x: compactDevice.matches ? 0.7 : 0.82, y: compactDevice.matches ? 0.7 : 0.82, z: compactDevice.matches ? 0.7 : 0.82, duration: 0.38, ease: "expo.out" }, 0.18)
    .to(omni.leftShutter.position, { x: 0, duration: 0.28, ease: "back.out(2)" }, 0.3)
    .to(omni.rightShutter.position, { x: 0, duration: 0.28, ease: "back.out(2)" }, 0.3)
    .to(omni.core.position, { z: 0, duration: 0.32, ease: "back.out(2)" }, 0.3)
    .call(() => {
      omni.setHourglassVisible(false);
      omni.projectDisplay.visible = true;
    }, [], 0.62)
    .to(omni.diamondDial.rotation, { z: 0, duration: 0.62, ease: "expo.inOut" }, 0.62);
}
