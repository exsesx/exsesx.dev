import type { Route } from "next";
import type { StaticImageData } from "next/image";

export interface Project {
  id: string;
  slug: string;
  name: string;
  role: string;
  /** External product URL, or `null` to render no outbound link. */
  href: string | null;
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
  accent: "amber" | "controlup" | "cyan" | "mint" | "neutral" | "quicklizard" | "rose" | "steel" | "violet";
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
    id: "project-controlup",
    slug: "controlup",
    name: "ControlUp",
    role: "Senior Full Stack / AI Engineer",
    href: "https://www.controlup.com/",
    period: "DEX / autonomous IT",
    description:
      "A Digital Employee Experience platform where I'm building the AI Assistant from scratch: MCP servers, multi-agent tooling, and LLM pipelines on Foundry.",
    impact: "A license-aware AI platform that acts directly on enterprise monitoring and automation infrastructure.",
    tags: ["ai assistant", "mcp", "multi-agent"],
    detail: {
      headline: "AI assistant platform work for enterprise digital employee experience.",
      context:
        "ControlUp helps IT teams monitor, troubleshoot, and optimize enterprise endpoints, virtual desktops, applications, and employee experience signals.",
      contribution: [
        "Building the dex-ai-assistant platform from the ground up: MCP servers, tool orchestration, and skill-based workflows powered by LLM pipelines on Foundry.",
        "Designing license-aware features so assistant capabilities adapt to each customer's subscription tier.",
        "Building multi-agent tooling and MCP integrations that let the assistant act on ControlUp's monitoring and automation infrastructure, full-stack in TypeScript, Node.js, and React.",
      ],
      outcome: "AI tooling that turns slow manual investigation into guided, automated fixes.",
      scope: ["AI assistant platform", "Multi-agent + MCP", "Enterprise IT operations"],
    },
    accent: "controlup",
    media: {
      type: "image",
      src: "/images/controlup_preview.webp",
      alt: "ControlUp brand preview",
      backgroundColor: "#09090B",
    },
  },
  {
    id: "project-quicklizard",
    slug: "quicklizard",
    name: "Quicklizard",
    role: "Senior Full Stack Developer",
    href: "https://quicklizard.com/en/",
    period: "AI dynamic pricing",
    description:
      "An AI-powered dynamic pricing platform where I owned full-stack delivery: Next.js workflows, Go services, and rollouts behind feature flags.",
    impact:
      "Modernized the frontend stack, cut repository overhead, and shipped the pricing dashboard, i18n, auth, and bulk-override workflows.",
    tags: ["next.js", "go", "pricing"],
    detail: {
      headline: "Full-stack delivery for AI-powered retail pricing automation.",
      context:
        "Quicklizard is a B2B SaaS platform that helps retailers and brands automate pricing across channels by reading market data, competitor prices, and demand patterns in real time.",
      contribution: [
        "Owned features end to end: scoping with stakeholders, implementation, reviews, rollout behind feature flags, and iteration on production feedback.",
        "Drove core Next.js workflows for pricing dashboards, localization, authentication, and bulk pricing overrides, plus Go API work across a microservices backend.",
        "Modernized the stack to Next.js 16 and Tailwind CSS 4, dropped Nx where a single-app setup didn't justify it, and tracked Next.js / RSC security advisories to coordinate upgrades.",
      ],
      outcome:
        "A more maintainable codebase, faster local development, and reliable releases for pricing analytics and automation.",
      scope: ["Pricing dashboards", "Stack modernization", "Go microservices"],
    },
    accent: "quicklizard",
    media: {
      type: "image",
      src: "/images/quicklizard_preview.webp",
      alt: "Quicklizard dynamic pricing dashboard preview",
      backgroundColor: "#070B08",
    },
  },
  {
    id: "project-huddle",
    slug: "huddle",
    name: "Huddle",
    role: "Product engineering",
    href: "https://www.huddle.uk.com/",
    period: "Utilities / tenancy",
    description:
      "Household utility management work where I adapted from Angular.js to React and worked closely with PostgreSQL stored procedures and PostGraphQL.",
    impact: "Moved an everyday utility product through a frontend rebuild and a shift in its data layer.",
    tags: ["react", "postgresql", "postgraphql"],
    detail: {
      headline: "A practical product transition for household utility management.",
      context:
        "Huddle handled the everyday plumbing of household services: tenancy, utility accounts, and the operational edge cases that come with them.",
      contribution: [
        "Switched from Angular.js to React mid-project without stalling delivery.",
        "Worked close to the data layer through PostgreSQL stored procedures and PostGraphQL.",
        "Turned utility-management requirements into maintainable frontend surfaces.",
      ],
      outcome: "A frontend and data-layer move that kept the live product working for everyday users.",
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
    href: "https://www.thisisschool.com/",
    period: "Learning platform",
    description:
      "A language-learning platform where I built scalable backend features around video transcoding, learning puzzles, and a multiplayer game.",
    impact: "Backend features for learning, media, and play that students used directly.",
    tags: ["video", "backend", "multiplayer"],
    detail: {
      headline: "Learning-platform engineering across media, puzzles, and multiplayer play.",
      context:
        "This is Language pairs language learning with video-heavy content and interactive practice, so the backend has to stay fast while students are mid-lesson.",
      contribution: [
        "Built a scalable backend around video transcoding and learning workflows.",
        "Built the product mechanics for learning puzzles and a multiplayer game.",
        "Tuned the performance and feedback loops that students felt while practicing.",
      ],
      outcome: "The work led to a UK team invitation with potential visa sponsorship.",
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
    href: "https://tsochinese.com",
    period: "Restaurant delivery",
    description:
      "Dark-kitchen automation software where I designed the TSO 3.0 architecture, moving to microservices and rewriting the REST APIs as GraphQL.",
    impact:
      "Led a cross-functional team of up to 10 on a product running live operations, jobs, delivery, and a payment-processor migration.",
    tags: ["microservices", "graphql", "team lead"],
    detail: {
      headline: "Commerce and operations software for a dark-kitchen delivery business.",
      context:
        "TSO 3.0 ran live restaurant operations: delivery coordination, jobs, and a move to a new payment processor, all while the old system stayed up.",
      contribution: [
        "Designed the TSO 3.0 architecture from the ground up and moved the system to microservices.",
        "Rewrote the REST APIs as GraphQL, which unblocked the other teams building on top.",
        "Led a cross-functional team of up to 10 while staying hands-on in the codebase.",
      ],
      outcome:
        "A live commerce system where a bad architecture call would have hit real kitchens, drivers, and payments.",
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
    id: "project-coinmena",
    slug: "coinmena",
    name: "CoinMENA",
    role: "Crypto product",
    href: "https://www.coinmena.com",
    period: "Digital assets",
    description:
      "A UAE-based cryptocurrency application where I implemented asynchronous frontend architecture for real-time verifications and updates.",
    impact:
      "Hit a critical regulatory certification deadline that opened up business operations across the MENA region.",
    tags: ["crypto", "real-time", "regulated"],
    detail: {
      headline: "Real-time regulated crypto product work under a certification deadline.",
      context:
        "CoinMENA needed a frontend that could handle asynchronous verification flows and regulated digital-asset operations, with a hard certification deadline attached.",
      contribution: [
        "Built an asynchronous frontend architecture for real-time verifications and updates.",
        "Worked in a regulated setting where correctness and timing were both business-critical.",
        "Adapted fast as requirements shifted on the way to a key certification milestone.",
      ],
      outcome:
        "Met a critical regulatory certification deadline, clearing the way for operations across the MENA region.",
      scope: ["Async frontend architecture", "Real-time verification", "Regulated crypto"],
    },
    accent: "mint",
    media: {
      type: "image",
      src: "/images/coinmena_preview.jpeg",
      alt: "CoinMENA preview",
    },
  },
  {
    id: "project-clear-street-bank",
    slug: "clear-street-bank",
    name: "Clear Street Bank",
    role: "Fintech engineering",
    // No stable public URL for the product I worked on.
    href: null,
    period: "Banking",
    description:
      "Banking product work where reliability and restraint mattered more than flash. The specifics stay private.",
    impact: "Fintech-facing product engineering; the details are confidential.",
    tags: ["fintech", "banking", "systems"],
    detail: {
      headline: "A banking surface where reliability came first.",
      context:
        "I can't say much about the specifics, but it was the same careful product engineering any banking surface needs.",
      contribution: [
        "Built fintech-facing product surfaces with reliability and restraint as the defaults.",
        "Kept the implementation practical: clear surfaces, real service detail, low-noise UX.",
        "Stayed inside what I can share publicly without touching confidential specifics.",
      ],
      outcome: "Solid banking product work that I keep deliberately light on public detail.",
      scope: ["Fintech product UI", "Confidential delivery", "Service reliability"],
    },
    accent: "steel",
    media: {
      type: "image",
      src: "/images/clear_street_preview.jpg",
      alt: "Clear Street Bank preview",
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
