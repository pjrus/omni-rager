# Architecture

Omni Rager is a single-page app: one HTML shell, one Vite/TypeScript entry
point, and a set of small modules that were split out of an original
single-file implementation. There is no framework, router, or build-time
templating — `src/main.ts` wires everything together imperatively.

## Runtime model

A single `AppState` instance (`src/state.ts`) is the shared mutable state
threaded through every module: Three.js camera/scene/renderer, the
`OmniDevice`, current interaction mode, pointer/drag vectors, animation
frame handle, etc. It exists because the app was originally one file with
top-level `let` variables sharing a closure — splitting the logic into
modules meant that state had to be bundled into one object and passed by
reference instead. There is no event bus or reactive store; modules read
and mutate `AppState` and the `OmniDevice` directly.

A single `SoundSystem` instance (`src/audio/SoundSystem.ts`) is the other
piece of shared runtime state, passed alongside `AppState` into most
functions that can produce a sound.

## Module map

```
src/main.ts              orchestration entry point — constructs AppState/SoundSystem,
                          wires DOM listeners to the functions below, starts the scene
src/state.ts              AppState class + shared mutable runtime state
src/dom/elements.ts        typed, centralised querySelector lookups
src/data/projects.ts       static project catalogue + asset URL helper
src/device/OmniDevice.ts   procedural Three.js scene graph for the device (model + view)
src/scene/scene.ts         renderer/camera/composer bootstrap, render loop,
                            screen<->world projection math (raycasting, plane intersection)
src/interactions/pointer.ts  pointer/drag/dial/wheel interaction state machine
src/animations/projectFlow.ts  GSAP timelines: engage, return, switch, dial selection
src/ui/interface.ts        DOM-facing updates for the info panel and status/feedback text
src/audio/SoundSystem.ts   sample playback (HTMLAudioElement) + synthesized tick (Web Audio)
```

### Dependency direction

`main.ts` is the only module that imports from everywhere; the rest form a
rough layering, low-level to high-level:

```
dom/elements, data/projects, state
        ↑
device/OmniDevice   scene/scene (reads state, dom)
        ↑                 ↑
        └── interactions/pointer ── ui/interface
                    ↑
        animations/projectFlow (GSAP timelines; calls ui/interface)
                    ↑
                 main.ts
```

`OmniDevice` owns the device's scene graph and per-frame animation/target
state (e.g. `dialTarget`, `active`, `busy`, `positionTarget`), but that
state is read and mutated by `interactions/pointer.ts` and
`animations/projectFlow.ts` rather than by `OmniDevice` itself — it acts as
shared model + view, not a self-contained controller.

## Interaction flow

1. `main.ts` registers DOM/canvas listeners (pointer, wheel, keyboard,
   resize, visibility, `prefers-reduced-motion`) that call into
   `interactions/pointer.ts` and `animations/projectFlow.ts`.
2. `interactions/pointer.ts` classifies a pointer press into a gesture —
   tap on the core (engage), drag on the dial (rotate to select), or
   long-press-then-drag on the housing (reposition) — tracked via
   `state.interactionMode`. Wheel input maps directly to project stepping.
3. Gesture resolution calls into `animations/projectFlow.ts`, which runs
   GSAP timelines against the `OmniDevice` scene graph (and falls back to
   an instant, non-animated state change when reduced motion is active),
   and into `SoundSystem` to trigger the matching sound.
4. `ui/interface.ts` updates the DOM info panel (title, description, tags,
   link, status/feedback text) independent of the Three.js/GSAP work, so
   plain text updates aren't tangled with mesh or timeline logic.
5. `scene/scene.ts` runs the render loop and supplies the screen<->world
   projection helpers (raycasting, plane intersection, projected bounding
   boxes) that keep pointer interactions aligned with the 3D device.

## Audio

Playback is inert until `SoundSystem.unlock()` runs, which only happens
inside the boot-button click handler — browsers block `AudioContext`
creation/resume outside a user gesture. Sample-based effects play through
preloaded `HTMLAudioElement`s; the mechanical tick is synthesized via a raw
oscillator on the same `AudioContext`. Every sound call site corresponds to
a visible mechanical event, per `AGENTS.md`.

## Build

Vite + `tsc` (see `AGENTS.md` for commands). No test suite or linter is
configured; verification is `npm run build` for type errors plus manual
interaction testing (drag, wheel, keyboard, touch) in the browser.
