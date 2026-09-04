import * as THREE from "three";
import type { Project } from "../../data/projects";
import type { DeviceMaterials } from "../materials";

function createDiamond(halfWidth: number, halfHeight: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, halfHeight);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(0, -halfHeight);
  shape.lineTo(-halfWidth, 0);
  shape.closePath();
  return shape;
}

/** Loads each project's symbol into its own texture material, for `projectSymbol` to swap between. */
function buildSymbolMaterials(projects: Project[]) {
  const textureLoader = new THREE.TextureLoader();
  return projects.map((project) => {
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
}

/**
 * The diamond-shaped "project display" plate mounted on the core, showing the
 * selected project's symbol. Adds itself to `target` (the `core` group) and returns
 * the refs `OmniDevice` needs for `setProject()`.
 */
export function buildProjectDisplay(
  target: THREE.Group,
  materials: DeviceMaterials,
  projects: Project[],
) {
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
    materials.displayEnergy,
  );
  face.position.z = 0.018;

  const symbolMaterials = buildSymbolMaterials(projects);
  const projectSymbol = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86), symbolMaterials[0]);
  projectSymbol.position.z = 0.035;
  projectSymbol.renderOrder = 2;

  const diamondDial = new THREE.Group();
  diamondDial.add(frame, face, projectSymbol);

  const projectDisplay = new THREE.Group();
  projectDisplay.add(selectorPlate, diamondDial);
  projectDisplay.position.z = 1.38;

  target.add(projectDisplay);

  return { diamondDial, projectDisplay, projectSymbol, symbolMaterials };
}
