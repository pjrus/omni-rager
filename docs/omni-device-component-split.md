# Plan: split `OmniDevice` into per-region part files

## Context

`src/device/OmniDevice.ts` (~460 lines) procedurally builds the entire device
out of ~30 individually-named primitives — `chassis`, `upperBridge`,
`silverBezel`, `caseTop`, `dialRing`, `cradle`, `guardPaths`, `particles`,
and so on — packed into seven large `build*()` methods (`buildHousing`,
`buildCase`, `buildMechanism`, `buildDial`, `buildCore`, `buildProjectDisplay`,
`buildParticles`). Finding and tweaking one part (e.g. the "grey bezel" —
`silverBezel` — or the case's "top plate" — `caseTop`) means scanning a
100+ line method full of unrelated siblings, as happened repeatedly while
debugging the bezel/dial alignment (`silverBezel`, `dialRing`, `dialPlate`
all live in different methods but needed to be reasoned about together).

The goal: give every named part its own clearly separated definition, so a
future change to one part doesn't require reading past the others, while
keeping the number of files manageable. This follows the same pattern
already used for `src/main.ts` (split into `scene/`, `ui/`, `animations/`,
`interactions/` by responsibility, with `AppState` threaded through).

## Approach

One file per body region (mirrors the current `build*()` methods), with
**each named part inside as its own small exported function**. A single
`build<Region>()` function per file composes its region's parts and returns
exactly the references `OmniDevice` needs to keep as instance fields.
Everything else (part functions, local geometry helpers) stays private to
that file.

```
src/device/
  OmniDevice.ts        - class: groups, hit meshes, animation/interaction
                          state fields, constructor (calls build* per region),
                          update()/setProject()/setHourglassVisible()/etc.
  materials.ts          - shared MeshStandardMaterial/MeshBasicMaterial
                          instances (graphite, gunmetal, blackMetal, bone,
                          silver, shutterMaterial, energy, darkEnergy,
                          displayEnergy) as one exported `materials` object
  geometry.ts            - shared helpers: `cylinder()` (rotated cylinder
                          factory used across every region)
  parts/
    housing.ts           - buildHousing(materials) -> void-ish; adds to root
    case.ts               - buildCase(materials) -> { outerBezel }
    mechanism.ts          - buildMechanism(materials) -> THREE.Group parts
    dial.ts                - buildDial(materials) -> parts for `dial` group
    core.ts                - buildCore(materials) -> { energyFace,
                            leftShutter, rightShutter, lens, silverBezel }
    projectDisplay.ts     - buildProjectDisplay(materials, projects) ->
                            { diamondDial, projectDisplay, projectSymbol,
                              symbolMaterials }
    particles.ts           - buildParticles(compactDevice) -> { points,
                            particleMaterial }
    hitMeshes.ts            - buildHitMeshes() -> { dialHit, centreHit,
                            dragHit }
```

### Part inventory (current method → new file → part functions)

- **`buildHousing` → `parts/housing.ts`**: `buildChassis`, `buildUpperBridge`,
  `buildLowerBridge`, `buildShoulderPair` (upper+lower, called per side),
  `buildSeam`, `buildActuatorAssembly` (bracket/housing/actuator),
  `buildUpperCatch`, `buildUpperIndicator`, `buildFingerGuards` (the
  `guardPaths` loop). Top-level `buildHousing(materials)` calls each and
  adds them to `root` (passed in).
- **`buildCase` → `parts/case.ts`**: `buildCaseBase`, `buildCaseMiddle`,
  `buildCaseTop`, `buildOuterBezel`, `buildSideButtons` (per side),
  `buildLowerIndicator`. `buildCase(materials)` assembles these into `root`
  / `outerRing` and returns `{ outerBezel }` (needed by `OmniDevice` for the
  `outerRing` rotation reference — actually already owned via the group; may
  return nothing if `outerRing` alone suffices).
- **`buildMechanism` → `parts/mechanism.ts`**: `buildMechanismPlate`,
  `buildMechanismCarrier`, `buildMechanismRail` (called ×6 in a loop).
- **`buildDial` → `parts/dial.ts`**: `buildDialPlate`, `buildDialRing`.
- **`buildCore` → `parts/core.ts`**: `buildCradle`, `buildEnergyFace`,
  `buildShutter` (parameterised by side, called twice for left/right —
  replaces the current copy-pasted mirroring logic), `buildLens`,
  `buildSilverBezel`, plus the private `createShutterShape`/`extrudeShutter`
  geometry helpers used only here.
- **`buildProjectDisplay` → `parts/projectDisplay.ts`**: `buildSelectorPlate`,
  `buildDiamondFrame`, `buildDiamondFace`, `buildProjectSymbol` (+ the
  per-project `symbolMaterials` texture loading), plus the private
  `createDiamond` helper.
- **`buildParticles` → `parts/particles.ts`**: unchanged logic, just moved.
- **hit meshes (currently inline in the constructor) → `parts/hitMeshes.ts`**:
  `buildDialHit`, `buildCentreHit`, `buildDragHit`.

### Design rule

Part functions are small and return the `Mesh`/`Group` they build (position
and rotation already applied) — they do not reach into `OmniDevice`'s
fields or add themselves to a parent. The region-level `build<Region>()`
function is the only thing that knows which parent group each part belongs
to, adds them, and returns the handful of references `OmniDevice` must keep
(e.g. `energyFace`, `leftShutter`/`rightShutter` for `setHourglassVisible`,
`projectSymbol`/`symbolMaterials` for `setProject`, `particleMaterial` for
the render loop). This keeps part functions trivially testable/movable and
keeps `OmniDevice.ts` as the single place that owns the assembled tree and
per-frame state — matching how `AppState` stayed the single owner of
mutable state when `main.ts` was split.


All numeric values (radii, positions, rotations, bevel settings) move
verbatim — this is a structural extraction, not a redesign. No visual
change is expected; `npm run build` plus a manual pass through boot /
engage / dial-drag / return should look pixel-identical to before.

## Migration order

Extract independently and verify the build after each step, same as the
`main.ts` split:

1. `materials.ts` + `geometry.ts` (no behavior change, just relocation).
2. `parts/hitMeshes.ts` (smallest, self-contained, no cross-part refs).
3. `parts/particles.ts` (self-contained).
4. `parts/mechanism.ts`, `parts/dial.ts` (simple, few parts each).
5. `parts/housing.ts`, `parts/case.ts` (largest part counts, no external
   refs needed back).
6. `parts/core.ts` (needs to return `energyFace`/`leftShutter`/
   `rightShutter`/`silverBezel` refs — do after the simpler ones are
   proven out).
7. `parts/projectDisplay.ts` (depends on `projects` data + texture
   loading — most involved, do last).
8. Slim `OmniDevice.ts` down to: field declarations, constructor wiring
   (calling each `build*` and storing returned refs), `update()`,
   `setProject()`, `setHourglassVisible()`, `getBobOffset()`,
   `syncPositionTarget()`.

## Verification

- `npm run build` after each extracted file (strict TS, `noUnusedLocals`/
  `noUnusedParameters` will catch dangling refs immediately).
- Manual pass in the browser: boot → engage core → drag-rotate the dial →
  switch projects → return to selector, comparing against the current
  build to confirm no visual regression (particularly around the bezel/
  dial/core stack that was hand-tuned recently).

See `TODO.md` at the repo root and `docs/README.md` for related follow-up
work.
