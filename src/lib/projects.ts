import type { Route } from "next";
import type { StaticImageData } from "next/image";

export interface Project {
  id: string;
  slug: string;
  name: string;
  role: string;
  href: string;
  period: string;
  description: string;
  impact: string;
  tags: string[];
  detail: {
    headline: string;
    context: string;
    contribution: string[];
    outcome: string;
    scope: string[];
  };
  accent: "cyan" | "amber" | "rose" | "mint" | "steel" | "neutral" | "violet";
  media:
    | {
        type: "image";
        src: string | StaticImageData;
        alt: string;
        backgroundColor?: string;
      }
    | {
        type: "video";
        src: string;
        poster: string;
        label: string;
      };
}

export const projects: Project[] = [
  {
    id: "project-huddle",
    slug: "huddle",
    name: "Huddle",
    role: "Product engineering",
    href: "https://www.huddle.uk.com/",
    period: "Utilities / tenancy",
    description:
      "Household utility management work where I adapted from Angular.js to React and worked closely with PostgreSQL stored procedures and PostGraphQL.",
    impact: "Helped move a real everyday product through a practical frontend and data-layer transition.",
    tags: ["react", "postgresql", "postgraphql"],
    detail: {
      headline: "A practical product transition for household utility management.",
      context:
        "Huddle sat in the messy, useful part of software: everyday household services, tenancy needs, data flows, and operational expectations.",
      contribution: [
        "Adapted quickly from Angular.js to React while keeping product delivery moving.",
        "Worked close to the data layer through PostgreSQL stored procedures and PostGraphQL.",
        "Helped translate utility-management requirements into maintainable frontend surfaces.",
      ],
      outcome: "Supported a product transition without losing sight of the everyday users depending on the service.",
      scope: ["Frontend migration", "Data-backed product UI", "Utility operations"],
    },
    accent: "violet",
    media: {
      type: "image",
      src: "/images/huddle_preview_balanced.png",
      alt: "Huddle product preview",
      backgroundColor: "#09090B",
    },
  },
  {
    id: "project-this-is-language",
    slug: "this-is-language",
    name: "This is Language",
    role: "Platform work",
    href: "https://www.thisislanguage.com/",
    period: "Learning platform",
    description:
      "A language-learning platform where I built scalable backend features around video transcoding, learning puzzles, and a multiplayer game.",
    impact:
      "Built product features around learning, media, and play: the kind of software where the user impact is visible.",
    tags: ["video", "backend", "multiplayer"],
    detail: {
      headline: "Learning-platform engineering across media, puzzles, and multiplayer play.",
      context:
        "This is Language combined language learning with video-heavy content and interactive practice, where reliability and user momentum both mattered.",
      contribution: [
        "Built backend features around video transcoding and learning workflows.",
        "Worked on product mechanics for learning puzzles and a multiplayer game.",
        "Shaped features where performance and feedback loops directly affected student engagement.",
      ],
      outcome:
        "Helped turn learning content into product experiences that felt active, responsive, and visible to users.",
      scope: ["Video workflows", "Learning mechanics", "Backend product features"],
    },
    accent: "amber",
    media: {
      type: "video",
      src: "/videos/thisislanguage_preview.mp4",
      poster: "/images/thisislanguage_poster.jpg",
      label: "This is Language motion preview",
    },
  },
  {
    id: "project-tso-chinese-delivery",
    slug: "tso-chinese-delivery",
    name: "TSO Chinese Delivery",
    role: "Commerce systems",
    href: "https://tsodelivery.com",
    period: "Restaurant delivery",
    description:
      "Dark-kitchen automation software where I helped architect TSO 3.0, moving toward microservices and rewriting REST APIs to GraphQL.",
    impact:
      "Led a cross-functional team of up to 10 people on a product that supported live operations, jobs, delivery, and payment migration work.",
    tags: ["microservices", "graphql", "team lead"],
    detail: {
      headline: "Commerce and operations software for a dark-kitchen delivery business.",
      context:
        "TSO 3.0 needed product architecture that could support live restaurant operations, delivery coordination, jobs, and payment migration work.",
      contribution: [
        "Helped architect the move toward microservices for the next product generation.",
        "Reworked REST API surfaces toward GraphQL where that better fit product needs.",
        "Led a cross-functional team of up to 10 people through delivery and operational constraints.",
      ],
      outcome:
        "Supported a live commerce system where product decisions had immediate operational weight for kitchens, delivery, and payments.",
      scope: ["Team leadership", "GraphQL architecture", "Delivery operations"],
    },
    accent: "rose",
    media: {
      type: "image",
      src: "/images/tso_preview.jpg",
      alt: "TSO delivery preview",
    },
  },
  {
    id: "project-clear-street-bank",
    slug: "clear-street-bank",
    name: "Clear Street Bank",
    role: "Fintech engineering",
    href: "https://www.clearstreetbank.com/",
    period: "Banking",
    description:
      "A banking product surface shaped by the same priorities I bring to finance software: reliability, restraint, and service detail.",
    impact:
      "Kept in the portfolio as fintech-facing product work while the public details stay intentionally lightweight.",
    tags: ["fintech", "banking", "systems"],
    detail: {
      headline: "A restrained banking surface where reliability mattered more than spectacle.",
      context:
        "The public portfolio details are intentionally lightweight, but the work belongs in the same category of careful product engineering I bring to finance software.",
      contribution: [
        "Worked around fintech-facing product priorities with attention to reliability and restraint.",
        "Kept the implementation posture practical: clear surfaces, service detail, and low-noise UX.",
        "Balanced public presentation with confidentiality around deeper product specifics.",
      ],
      outcome: "Represents banking-oriented product work without overstating details that should stay private.",
      scope: ["Fintech product UI", "Confidential delivery", "Service reliability"],
    },
    accent: "steel",
    media: {
      type: "image",
      src: "/images/clear_street_preview.jpg",
      alt: "Clear Street Bank preview",
    },
  },
  {
    id: "project-coinmena",
    slug: "coinmena",
    name: "CoinMENA",
    role: "Crypto product",
    href: "https://www.coinmena.com",
    period: "Digital assets",
    description:
      "A UAE-based cryptocurrency application where I implemented asynchronous frontend architecture for real-time verifications and updates.",
    impact:
      "Helped meet a critical regulatory certification deadline, enabling business operations across the MENA region.",
    tags: ["crypto", "real-time", "regulated"],
    detail: {
      headline: "Real-time regulated crypto product work under a certification deadline.",
      context:
        "CoinMENA required frontend architecture that could support asynchronous verification flows and regulated digital-asset operations.",
      contribution: [
        "Implemented asynchronous frontend architecture for real-time verifications and updates.",
        "Worked in a regulated product context where correctness and timing were both business-critical.",
        "Helped the team move toward a key certification milestone.",
      ],
      outcome:
        "Contributed to meeting a critical regulatory certification deadline, enabling operations across the MENA region.",
      scope: ["Async frontend architecture", "Real-time verification", "Regulated crypto"],
    },
    accent: "mint",
    media: {
      type: "image",
      src: "/images/coinmena_preview.jpeg",
      alt: "CoinMENA preview",
    },
  },
];

const projectBySlug = new Map(projects.map(project => [project.slug, project]));

export function getProjectPath(project: Pick<Project, "slug">) {
  return `/project/${project.slug}` as Route;
}

export function getProjectTransitionType(project: Pick<Project, "id">) {
  return `project-transition-${project.id}`;
}

export function getProjectBySlug(slug: string) {
  return projectBySlug.get(slug);
}

export function getAdjacentProjects(project: Project) {
  const currentIndex = projects.findIndex(item => item.id === project.id);
  const previousProject = projects.at(currentIndex - 1) ?? projects.at(-1);
  const nextProject = projects.at((currentIndex + 1) % projects.length);

  return {
    previousProject,
    nextProject,
  };
}

export const specialties = [
  "Node.js / Nest.js",
  "React / Next.js",
  "Go services",
  "MCP integrations",
  "LLM workflows",
  "Developer tooling",
  "AWS / GCP",
];
