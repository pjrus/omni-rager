import * as THREE from "three";
import { projects } from "../data/projects";
import { compactDevice, reducedMotion } from "../state";
import { createMaterials } from "./materials";
import { buildCase } from "./parts/case";
import { buildCore } from "./parts/core";
import { buildDial } from "./parts/dial";
import { buildHitMeshes } from "./parts/hitMeshes";
import { buildHousing } from "./parts/housing";
import { buildMechanism } from "./parts/mechanism";
import { buildParticles } from "./parts/particles";
import { buildProjectDisplay } from "./parts/projectDisplay";

/**
 * Procedurally builds the device's entire Three.js scene graph (housing, case,
 * mechanism, dial, core/shutters, project display, and ambient particles) out of
 * primitive geometry rather than a loaded model, and owns the per-frame
 * animation/interaction state — dialTarget, active, busy, positionTarget, etc.
 * That state is read and mutated by other modules (interactions/pointer.ts,
 * animations/projectFlow.ts, scene/scene.ts) rather than by this class itself,
 * so OmniDevice acts as the shared model + view for the device.
 *
 * The geometry itself is assembled from per-part builder functions grouped by
 * body region under `./parts/` — see docs/omni-device-component-split.md.
 */
export class OmniDevice {
  readonly root = new THREE.Group();
  readonly dial = new THREE.Group();
  readonly outerRing = new THREE.Group();
  readonly mechanism = new THREE.Group();
  readonly core = new THREE.Group();
  readonly projectDisplay: THREE.Group;
  readonly diamondDial: THREE.Group;
  readonly leftShutter: THREE.Group;
  readonly rightShutter: THREE.Group;
  readonly energyFace: THREE.Mesh;
  readonly centreHit: THREE.Mesh;
  readonly dialHit: THREE.Mesh;
  readonly dragHit: THREE.Mesh;
  readonly particleMaterial: THREE.PointsMaterial;

  dialTarget = 0;
  dialVelocity = 0;
  selectedIndex = 0;
  active = false;
  busy = false;
  readonly positionTarget = new THREE.Vector3();

  private readonly energyMaterial: THREE.MeshStandardMaterial;
  private readonly projectSymbol: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly symbolMaterials: THREE.MeshBasicMaterial[];

  constructor() {
    this.root.rotation.set(-0.06, 0.12, 0);
    this.root.scale.setScalar(compactDevice.matches ? 0.7 : 0.82);

    const materials = createMaterials();
    this.energyMaterial = materials.energy;

    buildHousing(this.root, materials);
    buildCase(this.root, this.outerRing, materials);

    buildMechanism(this.mechanism, materials);
    this.root.add(this.mechanism);

    buildDial(this.dial, materials);
    this.root.add(this.dial);

    const coreParts = buildCore(this.core, materials);
    this.energyFace = coreParts.energyFace;
    this.leftShutter = coreParts.leftShutter;
    this.rightShutter = coreParts.rightShutter;

    const displayParts = buildProjectDisplay(this.core, materials, projects);
    this.diamondDial = displayParts.diamondDial;
    this.projectDisplay = displayParts.projectDisplay;
    this.projectSymbol = displayParts.projectSymbol;
    this.symbolMaterials = displayParts.symbolMaterials;
    this.root.add(this.core);

    this.setHourglassVisible(false);

    const { points: particles, material: particleMaterial } = buildParticles(compactDevice.matches);
    this.particleMaterial = particleMaterial;
    this.root.add(particles);

    const hitMeshes = buildHitMeshes();
    this.dialHit = hitMeshes.dialHit;
    this.centreHit = hitMeshes.centreHit;
    this.dragHit = hitMeshes.dragHit;
    this.root.add(this.dialHit, this.centreHit, this.dragHit);

    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== this.dialHit && object !== this.centreHit && object !== this.dragHit) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  /**
   * Selects a project by index (wrapping around projects.length in either direction)
   * and swaps the diamond dial's texture to that project's symbol. Called by the
   * dial-rotation interaction as the user scrolls through projects.
   */
  setProject(index: number) {
    this.selectedIndex = ((index % projects.length) + projects.length) % projects.length;
    this.projectSymbol.material = this.symbolMaterials[this.selectedIndex];
  }

  /**
   * Shows or hides the glowing core (energy face + shutters) beneath the project
   * display, e.g. while the "hourglass" charge-up animation is running.
   */
  setHourglassVisible(visible: boolean) {
    this.energyFace.visible = visible;
    this.leftShutter.visible = visible;
    this.rightShutter.visible = visible;
  }

  /** Advances all per-frame animation state; called every frame from scene/scene.ts's render loop. */
  update(delta: number, elapsed: number, rotationTarget: THREE.Vector2) {
    const damping = 1 - Math.exp(-delta * 12);
    const bob = this.getBobOffset(elapsed);
    this.dial.rotation.z = THREE.MathUtils.lerp(this.dial.rotation.z, this.dialTarget, damping);
    this.root.rotation.x = THREE.MathUtils.lerp(this.root.rotation.x, rotationTarget.x, damping);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, rotationTarget.y, damping);
    this.root.position.x = THREE.MathUtils.lerp(this.root.position.x, this.positionTarget.x, damping);
    this.root.position.y = THREE.MathUtils.lerp(this.root.position.y, this.positionTarget.y + bob, damping);
    this.root.position.z = THREE.MathUtils.lerp(this.root.position.z, this.positionTarget.z, damping);
    this.outerRing.rotation.z += delta * (this.active ? -0.025 : 0);
    this.mechanism.rotation.z += delta * (this.active ? 0.055 : 0);

    if (!reducedMotion.matches) {
      const particles = this.root.getObjectByName("particles");
      if (particles) particles.rotation.z -= delta * 0.025;
      this.energyMaterial.emissiveIntensity = (this.active ? 1.25 : 0.82) + Math.sin(elapsed * 2.4) * 0.1;
    }
  }

  /** Returns the idle vertical bob offset at the given elapsed time (zero when reduced motion is on). */
  getBobOffset(elapsed: number) {
    return reducedMotion.matches ? 0 : Math.sin(elapsed * 0.75) * 0.035;
  }

  /**
   * Reconciles positionTarget with the device's current on-screen position, subtracting
   * out the idle bob so it doesn't get baked in. Called before a drag begins so the
   * device continues from where it visually is instead of snapping/jumping.
   */
  syncPositionTarget(elapsed: number) {
    this.positionTarget.set(this.root.position.x, this.root.position.y - this.getBobOffset(elapsed), this.root.position.z);
  }
}
