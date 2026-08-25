import type { AppState } from "../state";

/**
 * Dev-only console hook for reproducing exact device angles while tuning
 * geometry (bezel/ring alignment, etc.) — sets `deviceRotationTarget` (what
 * the render loop damps `root.rotation` toward) and snaps `root.rotation`
 * immediately so there's no lerp delay while iterating. Only installed in
 * dev builds; `import.meta.env.DEV` is statically replaced by Vite, so this
 * whole module is dead-code-eliminated from production output.
 */
export function installOmniDebug(state: AppState) {
  if (!import.meta.env.DEV) return;

  const omniDebug = {
    /** Current damped rotation target (radians), as { x, y }. */
    getRotation: () => ({ x: state.deviceRotationTarget.x, y: state.deviceRotationTarget.y }),
    /** Snap the device to an exact rotation (radians) immediately, bypassing the usual damping. */
    setRotation(x: number, y: number) {
      state.deviceRotationTarget.set(x, y);
      state.omni.root.rotation.x = x;
      state.omni.root.rotation.y = y;
    },
    /** Full shared AppState, for poking at `omni`/`camera`/etc. directly from the console. */
    state,
  };

  (window as unknown as { omniDebug: typeof omniDebug }).omniDebug = omniDebug;
  console.info("[omniDebug] window.omniDebug.setRotation(x, y) available for debugging device angle.");
}
