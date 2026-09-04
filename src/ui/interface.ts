// DOM-facing updates for the project info panel and status/feedback text.
import { Project, projects } from "../data/projects";
import {
  app,
  categoryNode,
  descriptionNode,
  dragFeedbackLabel,
  engageButton,
  nextButton,
  numberNode,
  previousButton,
  projectLink,
  returnButton,
  sceneWrap,
  systemStatus,
  tagsNode,
  titleNode,
} from "../dom/elements";
import { AppState, reducedMotion } from "../state";

export function revealPortfolio(state: AppState) {
  if (state.explored) return;
  state.explored = true;
  app.classList.add("has-explored");
  systemStatus.textContent = "SELECTOR READY";
}

/** Swaps the info panel text to the given project; delayed via `is-changing` (skipped under reduced motion) so a CSS fade can play before the DOM content changes underneath it. */
export function updateProjectInterface(index: number) {
  const project: Project = projects[index];
  app.classList.add("is-changing");
  window.setTimeout(
    () => {
      numberNode.textContent = String(index + 1).padStart(2, "0");
      categoryNode.textContent = project.category;
      titleNode.textContent = project.name;
      descriptionNode.textContent = project.description;
      tagsNode.replaceChildren(
        ...project.tags.map((tag) => {
          const item = document.createElement("li");
          item.textContent = tag;
          return item;
        }),
      );
      projectLink.href = project.link;
      projectLink.setAttribute("aria-label", `View ${project.name} project`);
      app.classList.remove("is-changing");
    },
    reducedMotion.matches ? 0 : 170,
  );
}

export function setControlsDisabled(disabled: boolean) {
  previousButton.disabled = disabled;
  nextButton.disabled = disabled;
  engageButton.disabled = disabled;
  returnButton.disabled = disabled;
}

/** Updates the drag-hint label and status text for the current pointer gesture; "idle" falls back to whatever status reflects the device's engaged/explored state. */
export function setDragFeedback(state: AppState, dragState: "idle" | "pressing" | "dragging") {
  sceneWrap.classList.toggle("is-pressing", dragState === "pressing");
  sceneWrap.classList.toggle("is-dragging", dragState === "dragging");

  if (dragState === "pressing") {
    dragFeedbackLabel.textContent = "Hold to reposition";
    systemStatus.textContent = "HOLD TO REPOSITION";
  } else if (dragState === "dragging") {
    dragFeedbackLabel.textContent = "Drag to move Omnitrix";
    systemStatus.textContent = "REPOSITIONING";
  } else {
    dragFeedbackLabel.textContent = "Hold to reposition";
    systemStatus.textContent = state.omni.active
      ? "PROJECT LINKED"
      : state.explored
        ? "SELECTOR READY"
        : "CORE OFFLINE";
  }
}
