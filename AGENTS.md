# AGENTS.md

Guidance for coding agents working in this repository.

## Project

Omni Rager — a single-page portfolio built as an interactive Three.js
"Omnitrix-inspired" selector device, with GSAP-driven animation and sound.
See `PRODUCT.md` for product intent, positioning, and constraints.

## Stack

- Vite + TypeScript, single-page app
- Three.js for the 3D device and scene
- GSAP for animation sequencing

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc`) then production build via Vite
- `npm run preview` — preview the production build locally

There is no test suite or linter configured. After changes, run
`npm run build` to catch type errors, and manually verify interactive
behavior in the browser (drag, wheel, keyboard, and touch controls).

## Structure

- `index.html` — entry HTML
- `src/main.ts` — application/scene logic
- `src/style.css` — global styles
- `public/` — static assets (sounds, etc.)
- `dist/` — build output (generated, do not hand-edit)

## Conventions

- Flat colors only — no CSS gradients or visual-effect overlays (per
  `PRODUCT.md`).
- Every sound must be tied to a visible mechanical event.
- Preserve keyboard-accessible, non-gesture alternatives for all
  drag/wheel-driven interactions; keep reduced-motion support working.
- Project content (titles, descriptions, links) is placeholder and
  illustrative — do not present it as real without being asked to change it.
- Do not use protected logos or character artwork; the Omnitrix is a
  conceptual/behavioral reference only.
