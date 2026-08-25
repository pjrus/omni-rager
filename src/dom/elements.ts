/**
 * Typed DOM element lookups shared across modules. Centralising these
 * querySelector calls (and their non-null assertions) here avoids repeating
 * lookups and null-checks in every module that needs to touch the page.
 */
export const app = document.querySelector<HTMLElement>("#app")!;
export const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
export const sceneWrap = document.querySelector<HTMLElement>("#scene-wrap")!;
export const fallback = document.querySelector<HTMLElement>("#fallback")!;
export const boot = document.querySelector<HTMLElement>("#boot")!;
export const bootButton = document.querySelector<HTMLButtonElement>("#boot-button")!;
export const audioToggle = document.querySelector<HTMLButtonElement>("#audio-toggle")!;
export const engageButton = document.querySelector<HTMLButtonElement>("#engage-project")!;
export const returnButton = document.querySelector<HTMLButtonElement>("#return-button")!;
export const previousButton = document.querySelector<HTMLButtonElement>("#previous-project")!;
export const nextButton = document.querySelector<HTMLButtonElement>("#next-project")!;
export const systemStatus = document.querySelector<HTMLElement>("#system-status")!;
export const dragFeedbackLabel = document.querySelector<HTMLElement>("#drag-feedback-label")!;
export const numberNode = document.querySelector<HTMLElement>("#project-number")!;
export const categoryNode = document.querySelector<HTMLElement>("#project-category")!;
export const titleNode = document.querySelector<HTMLElement>("#project-title")!;
export const descriptionNode = document.querySelector<HTMLElement>("#project-description")!;
export const tagsNode = document.querySelector<HTMLUListElement>("#project-tags")!;
export const projectLink = document.querySelector<HTMLAnchorElement>("#project-link")!;
