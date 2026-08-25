import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { projects } from "../data/projects";
import { compactDevice, reducedMotion } from "../state";

/**
 * Procedurally builds the device's entire Three.js scene graph (housing, case,
 * mechanism, dial, core/shutters, project display, and ambient particles) out of
 * primitive geometry rather than a loaded model, and owns the per-frame
 * animation/interaction state — dialTarget, active, busy, positionTarget, etc.
 * That state is read and mutated by other modules (interactions/pointer.ts,
 * animations/projectFlow.ts, scene/scene.ts) rather than by this class itself,
 * so OmniDevice acts as the shared model + view for the device.
 */
export class OmniDevice {
  readonly root = new THREE.Group();
  readonly dial = new THREE.Group();
  readonly outerRing = new THREE.Group();
  readonly mechanism = new THREE.Group();
  readonly core = new THREE.Group();
  readonly projectDisplay = new THREE.Group();
  readonly diamondDial = new THREE.Group();
  readonly leftShutter = new THREE.Group();
  readonly rightShutter = new THREE.Group();
  energyFace!: THREE.Mesh;
  readonly centreHit: THREE.Mesh;
  readonly dialHit: THREE.Mesh;
  readonly dragHit: THREE.Mesh;
  particleMaterial!: THREE.PointsMaterial;

  dialTarget = 0;
  dialVelocity = 0;
  selectedIndex = 0;
  active = false;
  busy = false;
  readonly positionTarget = new THREE.Vector3();

  private readonly graphite = new THREE.MeshStandardMaterial({ color: 0x1a1d1b, metalness: 0.3, roughness: 0.42 });
  private readonly gunmetal = new THREE.MeshStandardMaterial({ color: 0x343836, metalness: 0.52, roughness: 0.32 });
  private readonly blackMetal = new THREE.MeshStandardMaterial({ color: 0x070908, metalness: 0.25, roughness: 0.48 });
  private readonly bone = new THREE.MeshStandardMaterial({ color: 0xe6e9e4, metalness: 0.12, roughness: 0.32 });
  private readonly silver = new THREE.MeshStandardMaterial({ color: 0xc7cbc6, metalness: 0.72, roughness: 0.23 });
  private readonly shutterMaterial = new THREE.MeshStandardMaterial({ color: 0x606461, metalness: 0.38, roughness: 0.36 });
  private readonly energy = new THREE.MeshStandardMaterial({
    color: 0x9bff32,
    emissive: 0x4f9e0c,
    emissiveIntensity: 0.85,
    metalness: 0.05,
    roughness: 0.25,
  });
  private readonly darkEnergy = new THREE.MeshStandardMaterial({
    color: 0x2a3e0d,
    emissive: 0x1d3804,
    emissiveIntensity: 0.5,
    metalness: 0.2,
    roughness: 0.35,
  });
  private readonly displayEnergy = new THREE.MeshBasicMaterial({ color: 0xb9ff42, toneMapped: false });
  private projectSymbol!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private symbolMaterials: THREE.MeshBasicMaterial[] = [];

  constructor() {
    this.root.rotation.set(-0.06, 0.12, 0);
    this.root.scale.setScalar(compactDevice.matches ? 0.7 : 0.82);

    this.buildHousing();
    this.buildCase();
    this.buildMechanism();
    this.buildDial();
    this.buildCore();
    this.buildProjectDisplay();
    this.setHourglassVisible(false);
    this.buildParticles();

    // The dial hit ring backs drag-to-rotate interaction on the outer selector dial.
    this.dialHit = new THREE.Mesh(
      new THREE.RingGeometry(1.38, 2.08, 64),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    this.dialHit.position.z = 0.9;
    this.root.add(this.dialHit);

    // The centre hit disc backs tap-to-engage on the core, independent of dial rotation.
    this.centreHit = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 48),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    this.centreHit.position.z = 1.04;
    this.root.add(this.centreHit);

    // The housing hit area lets a long-press begin away from the selector dial.
    this.dragHit = new THREE.Mesh(
      new THREE.CircleGeometry(2.72, 64),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    this.dragHit.position.z = 0.5;
    this.root.add(this.dragHit);

    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== this.dialHit && object !== this.centreHit && object !== this.dragHit) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  private cylinder(radius: number, depth: number, material: THREE.Material, segments = 64) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), material);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  // The outer wrist-strap chassis: main body, upper/lower bridges, shoulders, seams, and finger guards.
  private buildHousing() {
    const chassis = new THREE.Mesh(new RoundedBoxGeometry(4.58, 5.02, 0.92, 6, 0.28), this.blackMetal);
    chassis.position.z = -0.68;
    this.root.add(chassis);

    const upperBridge = new THREE.Mesh(new RoundedBoxGeometry(4.2, 1.12, 0.72, 5, 0.18), this.graphite);
    upperBridge.position.set(0, 2.02, -0.22);
    this.root.add(upperBridge);

    const lowerBridge = new THREE.Mesh(new RoundedBoxGeometry(4.14, 1.0, 0.74, 5, 0.18), this.graphite);
    lowerBridge.position.set(0, -2.04, -0.23);
    this.root.add(lowerBridge);

    for (const direction of [-1, 1]) {
      const upperShoulder = new THREE.Mesh(new RoundedBoxGeometry(1.08, 1.8, 0.94, 4, 0.2), this.graphite);
      upperShoulder.position.set(direction * 2.37, 1.12, -0.6);
      upperShoulder.rotation.z = direction * 0.05;
      this.root.add(upperShoulder);

      const lowerShoulder = new THREE.Mesh(new RoundedBoxGeometry(1.02, 1.72, 0.94, 4, 0.2), this.gunmetal);
      lowerShoulder.position.set(direction * 2.36, -1.42, -0.62);
      lowerShoulder.rotation.z = direction * -0.045;
      this.root.add(lowerShoulder);

      const seam = new THREE.Mesh(new RoundedBoxGeometry(0.12, 2.76, 0.08, 2, 0.035), this.blackMetal);
      seam.position.set(direction * 1.55, -0.72, -0.16);
      this.root.add(seam);
    }

    const actuatorBracket = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.5, 0.52, 4, 0.12), this.blackMetal);
    actuatorBracket.position.set(0, -2.42, -0.02);
    this.root.add(actuatorBracket);
    const actuatorHousing = this.cylinder(0.43, 0.34, this.gunmetal, 32);
    actuatorHousing.position.set(0, -2.59, 0.19);
    this.root.add(actuatorHousing);
    const actuator = this.cylinder(0.25, 0.2, this.energy, 32);
    actuator.position.set(0, -2.59, 0.42);
    this.root.add(actuator);

    const upperCatch = this.cylinder(0.22, 0.22, this.gunmetal, 24);
    upperCatch.position.set(0, 2.57, -0.1);
    this.root.add(upperCatch);

    const upperIndicatorHousing = this.cylinder(0.29, 0.22, this.gunmetal, 24);
    upperIndicatorHousing.position.set(0, 2.03, 0.56);
    this.root.add(upperIndicatorHousing);
    const upperIndicator = this.cylinder(0.15, 0.15, this.energy, 24);
    upperIndicator.position.set(0, 2.03, 0.73);
    this.root.add(upperIndicator);

    const guardPaths = [
      [[-1.68, 2.38], [-2.02, 2.42], [-2.22, 2.04]],
      [[1.68, 2.38], [2.02, 2.42], [2.22, 2.04]],
      [[-2.22, -1.78], [-2.15, -2.24], [-1.78, -2.42]],
      [[2.22, -1.78], [2.15, -2.24], [1.78, -2.42]],
    ];
    guardPaths.forEach((points) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map(([x, y]) => new THREE.Vector3(x, y, 0.34)),
      );
      const guard = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.23, 12, false), this.bone);
      this.root.add(guard);
    });
  }

  // The circular pod that sits on top of the housing and holds the dial/core: base, bezel, and side buttons.
  private buildCase() {
    const base = this.cylinder(2.12, 0.74, this.blackMetal, 80);
    base.position.z = -0.18;
    this.root.add(base);

    const caseMiddle = this.cylinder(2.04, 0.78, this.gunmetal, 80);
    caseMiddle.position.z = 0.1;
    this.root.add(caseMiddle);

    const caseTop = this.cylinder(1.93, 0.3, this.blackMetal, 80);
    caseTop.position.z = 0.54;
    this.root.add(caseTop);

    const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(1.86, 0.24, 18, 80), this.blackMetal);
    outerBezel.position.z = 0.7;
    this.outerRing.add(outerBezel);

    this.root.add(this.outerRing);

    for (const direction of [-1, 1]) {
      const buttonHousing = this.cylinder(0.25, 0.22, this.gunmetal, 24);
      buttonHousing.position.set(direction * 2.03, 0.18, 0.55);
      buttonHousing.rotation.z = direction * 0.06;
      this.root.add(buttonHousing);
      const sideButton = this.cylinder(0.135, 0.15, this.energy, 24);
      sideButton.position.set(direction * 2.03, 0.18, 0.72);
      this.root.add(sideButton);
    }

    const lowerIndicatorHousing = this.cylinder(0.29, 0.22, this.gunmetal, 24);
    lowerIndicatorHousing.position.set(0, -2.03, 0.56);
    this.root.add(lowerIndicatorHousing);
    const lowerIndicator = this.cylinder(0.15, 0.15, this.energy, 24);
    lowerIndicator.position.set(0, -2.03, 0.73);
    this.root.add(lowerIndicator);
  }

  // The inner rotating plate and rail spokes visible beneath the dial, seen spinning while the device is active.
  private buildMechanism() {
    const plate = this.cylinder(1.5, 0.18, this.blackMetal, 64);
    plate.position.z = 0.52;
    this.mechanism.add(plate);

    const carrier = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 10, 48), this.graphite);
    carrier.position.z = 0.65;
    this.mechanism.add(carrier);

    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const rail = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.68, 0.13, 2, 0.035), this.gunmetal);
      rail.position.set(Math.cos(angle) * 1.08, Math.sin(angle) * 1.08, 0.65);
      rail.rotation.z = angle + Math.PI / 2;
      this.mechanism.add(rail);
    }

    this.root.add(this.mechanism);
  }

  // The outer selector dial ring the user drags to rotate through projects (rotated via dialTarget in update()).
  private buildDial() {
    const dialPlate = this.cylinder(1.48, 0.18, this.graphite, 64);
    dialPlate.position.z = 0.82;
    this.dial.add(dialPlate);

    const dialRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.075, 12, 64), this.blackMetal);
    dialRing.position.z = 0.94;
    this.dial.add(dialRing);

    this.root.add(this.dial);
  }

  // The centre core: glowing energy face, the two shutters that part to reveal it, lens, and silver bezel.
  private buildCore() {
    const cradle = this.cylinder(1.4, 0.2, this.darkEnergy, 64);
    cradle.position.z = 0.94;
    this.core.add(cradle);

    this.energyFace = this.cylinder(1.3, 0.1, this.energy, 64);
    this.energyFace.position.z = 1.08;
    this.core.add(this.energyFace);

    const createShutterShape = (radius: number, angle: number, pointX: number) => {
      const shape = new THREE.Shape();
      const upperAngle = Math.PI - angle;
      const lowerAngle = -Math.PI + angle;
      shape.moveTo(Math.cos(upperAngle) * radius, Math.sin(upperAngle) * radius);
      shape.lineTo(pointX, 0);
      shape.lineTo(Math.cos(lowerAngle) * radius, Math.sin(lowerAngle) * radius);
      shape.absarc(0, 0, radius, lowerAngle, upperAngle, true);
      shape.closePath();
      return shape;
    };

    const extrudeShutter = (shape: THREE.Shape, depth: number) => new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.03,
      bevelSegments: 2,
      steps: 1,
    });

    // Separate backing and face geometry creates the heavy black shutter outline.
    const backingGeometry = extrudeShutter(createShutterShape(1.245, Math.PI / 4, -0.12), 0.09);
    const faceGeometry = extrudeShutter(createShutterShape(1.16, Math.PI / 4.15, -0.25), 0.075);

    const leftBacking = new THREE.Mesh(backingGeometry, this.blackMetal);
    this.leftShutter.add(leftBacking);
    const leftFace = new THREE.Mesh(faceGeometry, this.shutterMaterial);
    leftFace.position.z = 0.055;
    this.leftShutter.add(leftFace);
    this.leftShutter.position.z = 1.15;
    this.core.add(this.leftShutter);

    const rightBacking = new THREE.Mesh(backingGeometry, this.blackMetal);
    rightBacking.scale.x = -1;
    this.rightShutter.add(rightBacking);
    const rightFace = new THREE.Mesh(faceGeometry, this.shutterMaterial);
    rightFace.scale.x = -1;
    rightFace.position.z = 0.055;
    this.rightShutter.add(rightFace);
    this.rightShutter.position.z = 1.15;
    this.core.add(this.rightShutter);

    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd9dfd8,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.25,
      transparent: true,
      opacity: 0.08,
      thickness: 0.18,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16,
      depthWrite: false,
    });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.27, 64), lensMaterial);
    lens.position.z = 1.285;
    this.core.add(lens);

    // The raised silver lip keeps the shutters physically inside the selector pod.
    const silverBezel = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.085, 14, 80), this.silver);
    silverBezel.position.z = 1.32;
    this.core.add(silverBezel);

    this.root.add(this.core);
  }

  // The diamond-shaped "project display" plate mounted on the core, showing the selected project's symbol.
  private buildProjectDisplay() {
    const createDiamond = (halfWidth: number, halfHeight: number) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, halfHeight);
      shape.lineTo(halfWidth, 0);
      shape.lineTo(0, -halfHeight);
      shape.lineTo(-halfWidth, 0);
      shape.closePath();
      return shape;
    };

    // A neutral selector plate fully masks the powered-up hourglass beneath it.
    const selectorPlate = new THREE.Mesh(
      new THREE.CircleGeometry(1.23, 64),
      new THREE.MeshBasicMaterial({ color: 0x565b57, toneMapped: false }),
    );
    selectorPlate.position.z = -0.035;

    const frame = new THREE.Mesh(
      new THREE.ShapeGeometry(createDiamond(0.98, 1.2)),
      new THREE.MeshBasicMaterial({ color: 0x070908, toneMapped: false }),
    );
    const face = new THREE.Mesh(
      new THREE.ShapeGeometry(createDiamond(0.82, 1.04)),
      this.displayEnergy,
    );
    face.position.z = 0.018;

    const textureLoader = new THREE.TextureLoader();
    this.symbolMaterials = projects.map((project) => {
      const texture = textureLoader.load(project.symbol);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return new THREE.MeshBasicMaterial({
        map: texture,
        alphaTest: 0.2,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
    });
    this.projectSymbol = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), this.symbolMaterials[0]);
    this.projectSymbol.position.z = 0.035;
    this.projectSymbol.renderOrder = 2;

    this.diamondDial.add(frame, face, this.projectSymbol);
    this.projectDisplay.add(selectorPlate, this.diamondDial);
    this.projectDisplay.position.z = 1.38;
    this.projectDisplay.scale.setScalar(1);
    this.projectDisplay.visible = true;
    this.core.add(this.projectDisplay);
  }

  // The ambient particle field drifting around the device (not part of the physical model).
  private buildParticles() {
    const count = compactDevice.matches ? 90 : 180;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.7 + Math.random() * 3.2;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xb9ff42,
      size: 0.025,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geometry, this.particleMaterial);
    particles.name = "particles";
    this.root.add(particles);
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
      this.energy.emissiveIntensity = (this.active ? 1.25 : 0.82) + Math.sin(elapsed * 2.4) * 0.1;
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
