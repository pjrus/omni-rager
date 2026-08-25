# TODO

## Build / Performance
- [ ] Code-split the main JS bundle (currently ~636 kB minified). Consider dynamic
      `import()` for Three.js/GSAP-heavy modules, or `build.rollupOptions.output.manualChunks`
      in `vite.config.ts`.
- [ ] Decide whether `dist/` should be gitignored entirely or committed intentionally
      (`dist/assets/` currently shows up as untracked).

## Testing
- [ ] Add unit tests for the pointer interaction state machine in
      `src/interactions/pointer.ts` (tap vs. long-press-drag vs. dial-drag disambiguation,
      the `pending` / `cancelled` / `drag` transitions).
- [ ] Add unit tests for the dial-snapping math in
      `src/animations/projectFlow.ts` (`selectFromRotation`'s modulo/wrap logic).

## Accessibility
- [ ] Audit keyboard navigation — can a user engage/switch/return between projects without
      a pointer?
- [ ] Review ARIA labeling on the interactive 3D canvas and related controls.
- [ ] Confirm all `prefers-reduced-motion` branches (already present in
      `src/animations/projectFlow.ts`) are complete and consistent.

## Code Health
- [ ] Tighten `AppState` (`src/state.ts`) typing — e.g. a discriminated union for
      `interactionMode` instead of loose string literals, to make the pointer state machine
      safer to extend.
- [ ] Extract the hand-tuned GSAP durations/eases in `src/animations/projectFlow.ts` into
      named constants to speed up future choreography tweaks.

## Documentation
- [x] Add module/function-level documentation comments to `src/scene/scene.ts`,
      `src/ui/interface.ts`, `src/animations/projectFlow.ts`, `src/interactions/pointer.ts`.
- [ ] Populate `docs/` with architecture notes (see `docs/README.md`).
