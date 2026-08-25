# Docs

Architecture and design notes for Omni Rager, split out from the root-level `PRODUCT.md`
(product concept) and `AGENTS.md` (agent-facing repo conventions).

This folder is a placeholder — nothing has been written yet. Candidate docs to add:

- `architecture.md` — module map (`src/scene`, `src/ui`, `src/animations`,
  `src/interactions`, `src/device`, `src/audio`, `src/state.ts`) and how they interact,
  particularly the shared `AppState` object and the pointer/GSAP interaction flow.
- `state-machine.md` — the pointer interaction state machine
  (`idle` / `pending` / `drag` / `rotate` / `dial` / `cancelled`) implemented in
  `src/interactions/pointer.ts`.
- `animations.md` — the GSAP timelines in `src/animations/projectFlow.ts` that drive the
  "transformation" choreography (engage / return / switch / dial select).

See `TODO.md` at the repo root for the running list of follow-up work.
