/**
 * Static project catalogue rendered by the portfolio scene, plus the asset-URL
 * helper other modules (e.g. SoundSystem) also use to resolve files under Vite's
 * configured base path.
 *
 * NOTE: the project entries below (name/description/link) are placeholder,
 * illustrative content — per PRODUCT.md, no real case studies were supplied and
 * these must be replaced with real projects before public launch.
 */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export type Project = {
  name: string;
  category: string;
  description: string;
  tags: string[];
  link: string;
  symbol: string;
};

export const projects: Project[] = [
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
