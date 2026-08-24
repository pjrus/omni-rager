import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import "./style.css";

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type Project = {
  name: string;
  category: string;
  description: string;
  tags: string[];
  link: string;
  symbol: string;
};

const projects: Project[] = [
  {
    name: "Arcfield",
    category: "Immersive commerce",
    description: "A spatial retail world where products respond to light, proximity and gesture.",
    tags: ["THREE.JS", "WEBGL", "GSAP"],
    link: "https://example.com/?project=arcfield",
    symbol: assetUrl("project-symbols/arcfield.svg"),
  },
  {
    name: "Signal / Noise",
    category: "Data experience",
    description: "Live environmental data translated into a calm, explorable audiovisual instrument.",
    tags: ["REACT", "D3", "WEB AUDIO"],
    link: "https://example.com/?project=signal-noise",
    symbol: assetUrl("project-symbols/signal-noise.svg"),
  },
  {
    name: "Nocturne",
    category: "Digital identity",
    description: "A performance-led identity system for an independent electronic music imprint.",
    tags: ["CREATIVE DEV", "MOTION", "GLSL"],
    link: "https://example.com/?project=nocturne",
    symbol: assetUrl("project-symbols/nocturne.svg"),
  },
  {
    name: "Assembly",
    category: "Product platform",
    description: "A modular collaboration space that turns complex production work into a shared timeline.",
    tags: ["TYPESCRIPT", "DESIGN SYSTEM", "API"],
    link: "https://example.com/?project=assembly",
    symbol: assetUrl("project-symbols/assembly.svg"),
  },
  {
    name: "Afterimage",
    category: "Cultural archive",
    description: "An atmospheric exhibition archive designed for wandering, recollection and discovery.",
    tags: ["NEXT.JS", "3D", "CMS"],
    link: "https://example.com/?project=afterimage",
    symbol: assetUrl("project-symbols/afterimage.svg"),
  },
];

const app = document.querySelector<HTMLElement>("#app")!;
const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const sceneWrap = document.querySelector<HTMLElement>("#scene-wrap")!;
const fallback = document.querySelector<HTMLElement>("#fallback")!;
const boot = document.querySelector<HTMLElement>("#boot")!;
const bootButton = document.querySelector<HTMLButtonElement>("#boot-button")!;
const audioToggle = document.querySelector<HTMLButtonElement>("#audio-toggle")!;
const engageButton = document.querySelector<HTMLButtonElement>("#engage-project")!;
const returnButton = document.querySelector<HTMLButtonElement>("#return-button")!;
const previousButton = document.querySelector<HTMLButtonElement>("#previous-project")!;
const nextButton = document.querySelector<HTMLButtonElement>("#next-project")!;
const systemStatus = document.querySelector<HTMLElement>("#system-status")!;
const numberNode = document.querySelector<HTMLElement>("#project-number")!;
const categoryNode = document.querySelector<HTMLElement>("#project-category")!;
const titleNode = document.querySelector<HTMLElement>("#project-title")!;
const descriptionNode = document.querySelector<HTMLElement>("#project-description")!;
const tagsNode = document.querySelector<HTMLUListElement>("#project-tags")!;
const projectLink = document.querySelector<HTMLAnchorElement>("#project-link")!;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactDevice = window.matchMedia("(max-width: 700px)");
const projectStep = (Math.PI * 2) / projects.length;

class SoundSystem {
  private muted = false;
  private ready = false;
  private context: AudioContext | null = null;
  private sounds: Record<string, HTMLAudioElement> = {};
  private readonly levels: Record<string, number> = {
    "core-ready": 0.28,
    transform: 0.26,
    transformation: 0.24,
    "power-down": 0.2,
    recharged: 0.2,
  };

  constructor() {
    Object.keys(this.levels).forEach((name) => {
      const audio = new Audio(assetUrl(`audio/${name}.mp3`));
      audio.preload = name === "core-ready" || name === "transform" ? "auto" : "metadata";
      audio.volume = this.levels[name];
      this.sounds[name] = audio;
    });
  }

  async unlock() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    this.ready = true;
  }

  play(name: string, restart = true) {
    if (!this.ready || this.muted) return;
    const sound = this.sounds[name];
    if (!sound) return;
    if (restart) sound.currentTime = 0;
    void sound.play().catch(() => undefined);
  }

  tick(strength = 1) {
    if (!this.ready || this.muted || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(190 + strength * 45, now);
    oscillator.frequency.exponentialRampToValueAtTime(95, now + 0.035);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  toggle() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach((sound) => {
      sound.muted = this.muted;
    });
    return this.muted;
  }
}

class OmniDevice {
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
  particleMaterial!: THREE.PointsMaterial;

  dialTarget = 0;
  dialVelocity = 0;
  selectedIndex = 0;
  active = false;
  busy = false;

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

    this.dialHit = new THREE.Mesh(
      new THREE.RingGeometry(1.38, 2.08, 64),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    this.dialHit.position.z = 0.9;
    this.root.add(this.dialHit);

    this.centreHit = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 48),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    );
    this.centreHit.position.z = 1.04;
    this.root.add(this.centreHit);

    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== this.dialHit && object !== this.centreHit) {
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

  private buildDial() {
    const dialPlate = this.cylinder(1.48, 0.18, this.graphite, 64);
    dialPlate.position.z = 0.82;
    this.dial.add(dialPlate);

    const dialRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.075, 12, 64), this.blackMetal);
    dialRing.position.z = 0.94;
    this.dial.add(dialRing);

    this.root.add(this.dial);
  }

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

  setProject(index: number) {
    this.selectedIndex = ((index % projects.length) + projects.length) % projects.length;
    this.projectSymbol.material = this.symbolMaterials[this.selectedIndex];
  }

  setHourglassVisible(visible: boolean) {
    this.energyFace.visible = visible;
    this.leftShutter.visible = visible;
    this.rightShutter.visible = visible;
  }

  update(delta: number, elapsed: number, rotationTarget: THREE.Vector2) {
    const damping = 1 - Math.exp(-delta * 12);
    this.dial.rotation.z = THREE.MathUtils.lerp(this.dial.rotation.z, this.dialTarget, damping);
    this.root.rotation.x = THREE.MathUtils.lerp(this.root.rotation.x, rotationTarget.x, damping);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, rotationTarget.y, damping);
    this.outerRing.rotation.z += delta * (this.active ? -0.025 : 0);
    this.mechanism.rotation.z += delta * (this.active ? 0.055 : 0);

    if (!reducedMotion.matches) {
      this.root.position.y = Math.sin(elapsed * 0.75) * 0.035;
      const particles = this.root.getObjectByName("particles");
      if (particles) particles.rotation.z -= delta * 0.025;
      this.energy.emissiveIntensity = (this.active ? 1.25 : 0.82) + Math.sin(elapsed * 2.4) * 0.1;
    }
  }
}

let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let omni: OmniDevice;
let bloom: UnrealBloomPass;
let animationFrame = 0;
let lastTime = performance.now();
let elapsed = 0;
let explored = false;
let pointerMoved = 0;
let lastPointerAngle = 0;
let wheelLocked = false;
let activePointerId: number | null = null;
let longPressTimer: number | null = null;
let interactionMode: "idle" | "pending" | "dial" | "orbit" | "cancelled" = "idle";
const longPressDelay = 450;
const tapMovementLimit = 8;
const pointer = new THREE.Vector2();
const lastPointerPosition = new THREE.Vector2();
const pressStartPosition = new THREE.Vector2();
const deviceRotationTarget = new THREE.Vector2(-0.06, 0.12);
const raycaster = new THREE.Raycaster();
const sounds = new SoundSystem();

function initialiseScene() {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050806);
    scene.fog = new THREE.FogExp2(0x050806, 0.035);

    camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 60);
    camera.position.set(0, 0, compactDevice.matches ? 11.2 : 10.5);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !compactDevice.matches;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice.matches ? 1.35 : 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const ambient = new THREE.AmbientLight(0x667066, 0.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xf1f4e9, 4.2);
    key.position.set(4, 5, 8);
    key.castShadow = !compactDevice.matches;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.PointLight(0xb9ff42, 9, 12, 2);
    rim.position.set(-4.5, 1.2, 4);
    scene.add(rim);

    const coolFill = new THREE.PointLight(0x91a99b, 12, 12, 2);
    coolFill.position.set(4, -3, 2);
    scene.add(coolFill);

    omni = new OmniDevice();
    scene.add(omni.root);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      compactDevice.matches ? 0.18 : 0.24,
      0.16,
      0.93,
    );
    bloom.enabled = !reducedMotion.matches;
    composer.addPass(bloom);

    resize();
    animationFrame = requestAnimationFrame(render);
  } catch (error) {
    console.error("WebGL initialisation failed", error);
    canvas.hidden = true;
    fallback.hidden = false;
    systemStatus.textContent = "SIMPLIFIED CORE";
  }
}

function render(now: number) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  elapsed += delta;
  omni.update(delta, elapsed, deviceRotationTarget);
  composer.render();
  animationFrame = requestAnimationFrame(render);
}

function resize() {
  if (!renderer || !camera || !composer) return;
  const width = sceneWrap.clientWidth;
  const height = sceneWrap.clientHeight;
  camera.aspect = width / height;
  camera.position.z = compactDevice.matches ? 11.2 : 10.5;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice.matches ? 1.35 : 1.8));
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  bloom.setSize(width, height);
  const selectorScale = compactDevice.matches ? 0.7 : 0.82;
  const engagedScale = compactDevice.matches ? 0.76 : 0.9;
  omni.root.scale.setScalar(omni.active ? engagedScale : selectorScale);
}

function screenAngle(event: PointerEvent) {
  const bounds = canvas.getBoundingClientRect();
  const centre = new THREE.Vector3();
  omni.root.getWorldPosition(centre);
  centre.project(camera);
  const x = bounds.left + ((centre.x + 1) * bounds.width) / 2;
  const y = bounds.top + ((1 - centre.y) * bounds.height) / 2;
  return Math.atan2(event.clientY - y, event.clientX - x);
}

function updatePointer(event: PointerEvent) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
}

function raycastDevice(event: PointerEvent) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects([omni.centreHit, omni.dialHit], false);
}

function revealPortfolio() {
  if (explored) return;
  explored = true;
  app.classList.add("has-explored");
  systemStatus.textContent = "SELECTOR READY";
}

function applyProjectSelection(index: number) {
  sounds.tick(1.2);
  omni.setProject(index);
  updateProjectInterface(index);
}

function animateProjectSelection(index: number, direction: number) {
  if (reducedMotion.matches) {
    applyProjectSelection(index);
    return;
  }

  omni.busy = true;
  setControlsDisabled(true);
  systemStatus.textContent = "SELECTOR ROTATING";
  const targetRotation = omni.diamondDial.rotation.z - direction * Math.PI * 2;

  gsap
    .timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        omni.diamondDial.rotation.z = 0;
        omni.busy = false;
        setControlsDisabled(false);
        systemStatus.textContent = "SELECTOR READY";
      },
    })
    .to(omni.diamondDial.rotation, { z: targetRotation, duration: 0.78 }, 0)
    .call(() => applyProjectSelection(index), [], 0.39);
}

function selectFromRotation(animate = false, direction = 1) {
  const rawIndex = Math.round(-omni.dialTarget / projectStep);
  omni.dialTarget = -rawIndex * projectStep;
  const index = ((rawIndex % projects.length) + projects.length) % projects.length;
  if (index !== omni.selectedIndex) {
    if (animate) animateProjectSelection(index, direction);
    else applyProjectSelection(index);
  }
}

function moveProject(direction: number) {
  if (omni.busy) return;
  revealPortfolio();
  if (omni.active) {
    switchActiveProject(direction);
    return;
  }
  omni.dialTarget -= direction * projectStep;
  selectFromRotation(true, direction);
}

function updateProjectInterface(index: number) {
  const project = projects[index];
  app.classList.add("is-changing");
  window.setTimeout(() => {
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
  }, reducedMotion.matches ? 0 : 170);
}

function setControlsDisabled(disabled: boolean) {
  previousButton.disabled = disabled;
  nextButton.disabled = disabled;
  engageButton.disabled = disabled;
  returnButton.disabled = disabled;
}

function engageProject() {
  if (omni.busy || omni.active) return;
  revealPortfolio();
  omni.busy = true;
  setControlsDisabled(true);
  systemStatus.textContent = "TRANSFORMATION ACTIVE";
  sounds.play("transform");

  if (reducedMotion.matches) {
    omni.projectDisplay.visible = false;
    omni.setHourglassVisible(true);
    omni.active = true;
    omni.busy = false;
    app.classList.add("is-active");
    setControlsDisabled(false);
    systemStatus.textContent = "PROJECT LINKED";
    sounds.play("recharged");
    return;
  }

  const timeline = gsap.timeline({
    defaults: { ease: "expo.inOut" },
    onComplete: () => {
      omni.active = true;
      omni.busy = false;
      omni.projectDisplay.visible = false;
      omni.diamondDial.rotation.z = 0;
      app.classList.add("is-active");
      setControlsDisabled(false);
      systemStatus.textContent = "PROJECT LINKED";
      sounds.play("recharged");
    },
  });
  const selectorTurn = omni.diamondDial.rotation.z + Math.PI * 2;
  timeline
    .to(omni.diamondDial.rotation, { z: selectorTurn, duration: 0.62 }, 0)
    .call(() => {
      omni.projectDisplay.visible = false;
      omni.setHourglassVisible(true);
    }, [], 0.64)
    .to(omni.core.position, { z: -0.2, duration: 0.24 }, 0.64)
    .to(omni.leftShutter.position, { x: -0.5, duration: 0.3 }, 0.67)
    .to(omni.rightShutter.position, { x: 0.5, duration: 0.3 }, 0.67)
    .to(omni.outerRing.rotation, { z: omni.outerRing.rotation.z - Math.PI * 0.32, duration: 0.48 }, 0.64)
    .to(omni.mechanism.scale, { x: 0.86, y: 0.86, duration: 0.3 }, 0.72)
    .call(() => sounds.play("transformation"), [], 0.9)
    .to(omni.dial.position, { z: 0.28, duration: 0.22 }, 0.89)
    .to(omni.core.rotation, { z: omni.core.rotation.z + Math.PI * 2, duration: 0.78 }, 0.94)
    .to(omni.leftShutter.position, { x: 0, duration: 0.34, ease: "back.out(2)" }, 1.29)
    .to(omni.rightShutter.position, { x: 0, duration: 0.34, ease: "back.out(2)" }, 1.29)
    .to(omni.core.position, { z: 0.38, duration: 0.32, ease: "back.out(2.5)" }, 1.34)
    .to(omni.mechanism.scale, { x: 1.05, y: 1.05, duration: 0.3 }, 1.32)
    .to(omni.mechanism.scale, { x: 1, y: 1, duration: 0.18 }, 1.62)
    .to(omni.dial.position, { z: 0.08, duration: 0.32 }, 1.46)
    .to(omni.root.scale, { x: compactDevice.matches ? 0.76 : 0.9, y: compactDevice.matches ? 0.76 : 0.9, z: compactDevice.matches ? 0.76 : 0.9, duration: 0.55 }, 1.18)
    .to(omni.particleMaterial, { opacity: 0.82, size: 0.055, duration: 0.24 }, 1.06)
    .to(omni.particleMaterial, { opacity: 0.34, size: 0.025, duration: 0.5 }, 1.44);
}

function switchActiveProject(direction: number) {
  if (omni.busy) return;
  omni.busy = true;
  setControlsDisabled(true);
  app.classList.add("is-changing");
  systemStatus.textContent = "RECALIBRATING";
  sounds.play("power-down");

  const applySwitch = () => {
    omni.dialTarget -= direction * projectStep;
    selectFromRotation();
    sounds.play("transformation");
  };

  const completeSwitch = () => {
    app.classList.remove("is-changing");
    omni.busy = false;
    setControlsDisabled(false);
    systemStatus.textContent = "PROJECT LINKED";
  };

  if (reducedMotion.matches) {
    applySwitch();
    completeSwitch();
    return;
  }

  gsap
    .timeline({ onComplete: completeSwitch })
    .to(omni.leftShutter.position, { x: -0.48, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.rightShutter.position, { x: 0.48, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.core.position, { z: 0.08, duration: 0.2, ease: "expo.in" }, 0)
    .call(applySwitch, [], 0.2)
    .to(omni.core.rotation, { z: omni.core.rotation.z + direction * projectStep, duration: 0.42, ease: "expo.inOut" }, 0.18)
    .to(omni.leftShutter.position, { x: 0, duration: 0.34, ease: "back.out(2.1)" }, 0.4)
    .to(omni.rightShutter.position, { x: 0, duration: 0.34, ease: "back.out(2.1)" }, 0.4)
    .to(omni.core.position, { z: 0.38, duration: 0.3, ease: "back.out(2)" }, 0.4);
}

function returnToSelector() {
  if (omni.busy || !omni.active) return;
  omni.busy = true;
  setControlsDisabled(true);
  sounds.play("power-down");
  systemStatus.textContent = "DISENGAGING";
  omni.projectDisplay.visible = reducedMotion.matches;
  omni.diamondDial.rotation.z = reducedMotion.matches ? 0 : -Math.PI * 2;

  const finish = () => {
    omni.active = false;
    omni.busy = false;
    omni.setHourglassVisible(false);
    omni.projectDisplay.visible = true;
    omni.diamondDial.rotation.z = 0;
    app.classList.remove("is-active");
    setControlsDisabled(false);
    systemStatus.textContent = "SELECTOR READY";
  };

  if (reducedMotion.matches) {
    omni.setHourglassVisible(false);
    finish();
    return;
  }

  gsap
    .timeline({ onComplete: finish })
    .to(omni.leftShutter.position, { x: -0.38, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.rightShutter.position, { x: 0.38, duration: 0.22, ease: "expo.in" }, 0)
    .to(omni.core.position, { z: -0.18, duration: 0.28, ease: "expo.in" }, 0)
    .to(omni.root.scale, { x: compactDevice.matches ? 0.7 : 0.82, y: compactDevice.matches ? 0.7 : 0.82, z: compactDevice.matches ? 0.7 : 0.82, duration: 0.38, ease: "expo.out" }, 0.18)
    .to(omni.leftShutter.position, { x: 0, duration: 0.28, ease: "back.out(2)" }, 0.3)
    .to(omni.rightShutter.position, { x: 0, duration: 0.28, ease: "back.out(2)" }, 0.3)
    .to(omni.core.position, { z: 0, duration: 0.32, ease: "back.out(2)" }, 0.3)
    .call(() => {
      omni.setHourglassVisible(false);
      omni.projectDisplay.visible = true;
    }, [], 0.62)
    .to(omni.diamondDial.rotation, { z: 0, duration: 0.62, ease: "expo.inOut" }, 0.62);
}

function onPointerDown(event: PointerEvent) {
  if (omni.busy || omni.active || activePointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
  const hits = raycastDevice(event);
  if (!hits.length) return;

  activePointerId = event.pointerId;
  pointerMoved = 0;
  pressStartPosition.set(event.clientX, event.clientY);
  lastPointerPosition.copy(pressStartPosition);
  canvas.setPointerCapture(event.pointerId);

  if (hits[0].object === omni.dialHit) {
    interactionMode = "dial";
    omni.dialVelocity = 0;
    lastPointerAngle = screenAngle(event);
    canvas.classList.add("is-dragging");
    return;
  }

  interactionMode = "pending";
  canvas.classList.add("is-pressing");
  longPressTimer = window.setTimeout(() => {
    if (interactionMode !== "pending" || activePointerId !== event.pointerId) return;
    interactionMode = "orbit";
    canvas.classList.remove("is-pressing");
    canvas.classList.add("is-dragging");
  }, longPressDelay);
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId || omni.busy) return;

  const currentPosition = new THREE.Vector2(event.clientX, event.clientY);
  pointerMoved = Math.max(pointerMoved, currentPosition.distanceTo(pressStartPosition));

  if (interactionMode === "pending") {
    lastPointerPosition.copy(currentPosition);
    if (pointerMoved > tapMovementLimit) {
      clearLongPress();
      interactionMode = "cancelled";
      canvas.classList.remove("is-pressing");
    }
    return;
  }

  if (interactionMode === "orbit") {
    const movement = currentPosition.sub(lastPointerPosition);
    deviceRotationTarget.y += movement.x * 0.006;
    deviceRotationTarget.x = THREE.MathUtils.clamp(deviceRotationTarget.x + movement.y * 0.006, -0.65, 0.65);
    lastPointerPosition.set(event.clientX, event.clientY);
    return;
  }

  if (interactionMode !== "dial") return;
  const angle = screenAngle(event);
  let delta = angle - lastPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  omni.dialTarget += delta;
  omni.dialVelocity = delta;
  lastPointerAngle = angle;
  revealPortfolio();
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return;
  const completedMode = interactionMode;
  const wasCancelled = event.type === "pointercancel";
  clearLongPress();
  activePointerId = null;
  interactionMode = "idle";
  canvas.classList.remove("is-dragging", "is-pressing");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

  if (!wasCancelled && completedMode === "pending" && pointerMoved <= tapMovementLimit) {
    const hit = raycastDevice(event)[0];
    if (hit?.object === omni.centreHit) {
      engageProject();
    }
    return;
  }

  if (completedMode !== "dial") return;
  omni.dialTarget += omni.dialVelocity * 2.4;
  selectFromRotation(true, omni.dialVelocity <= 0 ? 1 : -1);
}

function clearLongPress() {
  if (longPressTimer === null) return;
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
}

function onWheel(event: WheelEvent) {
  if (Math.abs(event.deltaY) < 8 || wheelLocked || omni.busy) return;
  event.preventDefault();
  wheelLocked = true;
  moveProject(event.deltaY > 0 ? 1 : -1);
  window.setTimeout(() => {
    wheelLocked = false;
  }, 360);
}

async function startExperience() {
  bootButton.disabled = true;
  systemStatus.textContent = "CHARGING CORE";
  await sounds.unlock();
  sounds.play("core-ready");
  app.classList.add("is-ready");
  boot.classList.add("is-hidden");
  revealPortfolio();
  omni.active = true;
  omni.projectDisplay.visible = false;
  omni.setHourglassVisible(true);
  omni.core.position.z = 0.38;
  omni.dial.position.z = 0.08;
  omni.root.scale.setScalar(compactDevice.matches ? 0.76 : 0.9);
  app.classList.add("is-active");
  systemStatus.textContent = "PROJECT LINKED";
  bootButton.disabled = false;
  canvas.focus?.();
}

bootButton.addEventListener("click", () => void startExperience());
audioToggle.addEventListener("click", () => {
  const muted = sounds.toggle();
  audioToggle.classList.toggle("is-muted", muted);
  audioToggle.setAttribute("aria-pressed", String(muted));
  audioToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
});
previousButton.addEventListener("click", () => moveProject(-1));
nextButton.addEventListener("click", () => moveProject(1));
engageButton.addEventListener("click", engageProject);
returnButton.addEventListener("click", returnToSelector);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
sceneWrap.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (boot && !boot.classList.contains("is-hidden")) return;
  if (event.key === "ArrowLeft") moveProject(-1);
  if (event.key === "ArrowRight") moveProject(1);
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    engageProject();
  }
  if (event.key === "Escape") returnToSelector();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(animationFrame);
  else {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(render);
  }
});
reducedMotion.addEventListener("change", () => {
  if (bloom) bloom.enabled = !reducedMotion.matches;
});

updateProjectInterface(0);
initialiseScene();
