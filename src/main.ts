import "./style.css";
import { SoundSystem } from "./audio/SoundSystem";
import {
  app,
  audioToggle,
  boot,
  bootButton,
  canvas,
  engageButton,
  nextButton,
  previousButton,
  returnButton,
  sceneWrap,
  systemStatus,
} from "./dom/elements";
import {
  cancelPointerInteraction,
  onLostPointerCapture,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onWindowPointerOut,
} from "./interactions/pointer";
import { initialiseScene, render, resize } from "./scene/scene";
import { AppState, compactDevice, reducedMotion } from "./state";
import { engageProject, moveProject, returnToSelector } from "./animations/projectFlow";
import { revealPortfolio, updateProjectInterface } from "./ui/interface";

const state = new AppState();
const sounds = new SoundSystem();

async function startExperience() {
  bootButton.disabled = true;
  systemStatus.textContent = "CHARGING CORE";
  await sounds.unlock();
  sounds.play("core-ready");
  app.classList.add("is-ready");
  boot.classList.add("is-hidden");
  revealPortfolio(state);
  state.omni.active = true;
  state.omni.projectDisplay.visible = false;
  state.omni.setHourglassVisible(true);
  state.omni.core.position.z = 0.38;
  state.omni.dial.position.z = 0.08;
  state.omni.root.scale.setScalar(compactDevice.matches ? 0.76 : 0.9);
  app.classList.add("is-active");
  systemStatus.textContent = "PROJECT LINKED";
  bootButton.disabled = false;
  canvas.focus?.();
}

bootButton.addEventListener("click", () => void startExperience());
audioToggle.addEventListener("click", () => {
  const muted = sounds.toggle();
  audioToggle.classList.toggle("is-muted", muted);
  audioToggle.setAttribute("aria-pressed", String(muted));
  audioToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
});
previousButton.addEventListener("click", () => moveProject(state, sounds, -1));
nextButton.addEventListener("click", () => moveProject(state, sounds, 1));
engageButton.addEventListener("click", () => engageProject(state, sounds));
returnButton.addEventListener("click", () => returnToSelector(state, sounds));
canvas.addEventListener("pointerdown", (event) => onPointerDown(event, state));
canvas.addEventListener("pointermove", (event) => onPointerMove(event, state));
canvas.addEventListener("pointerup", (event) => onPointerUp(event, state, sounds));
canvas.addEventListener("pointercancel", (event) => onPointerUp(event, state, sounds));
canvas.addEventListener("lostpointercapture", (event) => onLostPointerCapture(event, state, sounds));
sceneWrap.addEventListener("wheel", (event) => onWheel(event, state, sounds), { passive: false });
window.addEventListener("resize", () => resize(state));
window.addEventListener("blur", () => cancelPointerInteraction(state, sounds));
window.addEventListener("pointerout", (event) => onWindowPointerOut(event, state, sounds));
window.addEventListener("keydown", (event) => {
  if (boot && !boot.classList.contains("is-hidden")) return;
  if (event.key === "ArrowLeft") moveProject(state, sounds, -1);
  if (event.key === "ArrowRight") moveProject(state, sounds, 1);
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    engageProject(state, sounds);
  }
  if (event.key === "Escape") returnToSelector(state, sounds);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelPointerInteraction(state, sounds);
  if (document.hidden) cancelAnimationFrame(state.animationFrame);
  else {
    state.lastTime = performance.now();
    state.animationFrame = requestAnimationFrame((now) => render(now, state));
  }
});
reducedMotion.addEventListener("change", () => {
  if (state.bloom) state.bloom.enabled = !reducedMotion.matches;
});

updateProjectInterface(0);
initialiseScene(state);
