// Brand system for the exsesx.dev motion presentation.
// Colors mirror src/styles/globals.css (dark theme) and the per-project accents
// defined in src/components/Card.tsx, so the video reads as the same product.

export const FPS = 30;

// Dark theme is the cinematic default — matches globals.css `.dark`.
export const palette = {
  background: "#101111",
  backgroundDeep: "#0a0b0b",
  foreground: "#fff7e8",
  muted: "#a1a1aa",
  card: "#18181b",
  // Accent: amber in dark mode (--accent / --ring), cyan is the light-mode accent.
  amber: "#fde68a",
  amberDeep: "#f5c451",
  cyan: "#0e7490",
  cyanBright: "#22d3ee",
} as const;

// The "V" (Vanin) lambda logo mark, lifted verbatim from src/components/LogoMark.tsx.
export const LOGO_PATH = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";

// Pride-stripe colors from the real LogoMark, used for a one-beat easter-egg flourish.
export const prideBands = [
  "#FF4FA3",
  "#F43F3F",
  "#FF8A00",
  "#FFE500",
  "#31C95E",
  "#16B8D8",
  "#3457FF",
  "#8E44FF",
] as const;

export type ProjectAccent = {
  glow: string; // primary accent (rgb glow / gradient start)
  edge: string; // secondary / deep tone
  tint: string; // light wash for text chips
};

// Distilled from the accent maps in src/components/Card.tsx so each project
// scene is lit in its real brand color.
export const projectAccents = {
  controlup: { glow: "rgba(56,135,232,1)", edge: "rgba(251,176,59,1)", tint: "#8fc0ff" },
  quicklizard: { glow: "rgba(64,168,196,1)", edge: "rgba(255,140,40,1)", tint: "#7fdcec" },
  amber: { glow: "rgba(132,92,246,1)", edge: "rgba(190,110,210,1)", tint: "#c6b1ff" }, // This is Language (violet/amber accent key)
  rose: { glow: "rgba(232,80,104,1)", edge: "rgba(235,120,70,1)", tint: "#ff9bab" }, // TSO
  mint: { glow: "rgba(58,128,224,1)", edge: "rgba(12,46,96,1)", tint: "#8fb8ff" }, // CoinMENA
  steel: { glow: "rgba(96,150,196,1)", edge: "rgba(52,80,116,1)", tint: "#a9c8e6" }, // Clear Street
  violet: { glow: "rgba(150,96,214,1)", edge: "rgba(190,110,210,1)", tint: "#cdaaf0" }, // Huddle
} satisfies Record<string, ProjectAccent>;

export type ProjectAccentKey = keyof typeof projectAccents;

export type Project = {
  name: string;
  role: string;
  domain: string;
  punch: string; // one-line impact, distilled for motion
  tags: string[];
  accent: ProjectAccentKey;
  media: { type: "image"; src: string } | { type: "video"; src: string };
};

// Order = the order they appear on exsesx.dev/projects (newest role first).
export const projects: Project[] = [
  {
    name: "ControlUp",
    role: "Senior Full Stack / AI Engineer",
    domain: "DEX · Autonomous IT",
    punch: "Building the AI Assistant from scratch — MCP servers, multi-agent tooling, LLM pipelines.",
    tags: ["ai assistant", "mcp", "multi-agent"],
    accent: "controlup",
    media: { type: "image", src: "images/controlup_preview.webp" },
  },
  {
    name: "Quicklizard",
    role: "Senior Full Stack Developer",
    domain: "AI Dynamic Pricing",
    punch: "Owned full-stack delivery — Next.js workflows, Go services, rollouts behind feature flags.",
    tags: ["next.js", "go", "pricing"],
    accent: "quicklizard",
    media: { type: "image", src: "images/quicklizard_preview.webp" },
  },
  {
    name: "Tso Chinese",
    role: "Commerce systems · Team lead",
    domain: "Restaurant Delivery",
    punch: "Designed TSO 3.0 — microservices, REST→GraphQL, leading a team of up to 10.",
    tags: ["microservices", "graphql", "team lead"],
    accent: "rose",
    media: { type: "image", src: "images/tso_preview.jpg" },
  },
  {
    name: "Clear Street Bank",
    role: "Fintech engineering",
    domain: "Banking",
    punch: "Reliability over flash. The specifics stay private.",
    tags: ["fintech", "banking", "systems"],
    accent: "steel",
    media: { type: "image", src: "images/clear_street_preview.jpg" },
  },
  {
    name: "CoinMENA",
    role: "Crypto product",
    domain: "Digital Assets",
    punch: "Async frontend for real-time verifications — hit a critical regulatory deadline.",
    tags: ["crypto", "real-time", "regulated"],
    accent: "mint",
    media: { type: "image", src: "images/coinmena_preview.jpeg" },
  },
  {
    name: "This is Language",
    role: "Platform work",
    domain: "Learning Platform",
    punch: "Scalable backend — video transcoding, learning puzzles, and a multiplayer game.",
    tags: ["video", "backend", "multiplayer"],
    accent: "amber",
    media: { type: "video", src: "videos/thisislanguage_preview.mp4" },
  },
  {
    name: "Huddle",
    role: "Product engineering",
    domain: "Utilities · Tenancy",
    punch: "Angular.js → React mid-flight, close to PostgreSQL stored procedures and PostGraphQL.",
    tags: ["react", "postgresql", "postgraphql"],
    accent: "violet",
    media: { type: "image", src: "images/huddle_preview_balanced.png" },
  },
];

export const snapshotStats: Array<[string, string]> = [
  ["9+", "years building web products"],
  ["17+", "projects led as engineer"],
  ["AI", "assistants · MCP · LLM workflows"],
  ["Full-stack", "React · Next · Node · Go · cloud"],
];

export const specialties = [
  "Node.js / Nest.js",
  "React / Next.js",
  "Go services",
  "MCP integrations",
  "LLM workflows",
  "Developer tooling",
  "AWS / GCP",
];
