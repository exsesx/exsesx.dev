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
  accent: "amber" | "controlup" | "mint" | "quicklizard" | "rose" | "steel" | "violet";
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
    role: "Senior Full-Stack / AI Engineer",
    href: "https://www.controlup.com/",
    period: "AI assistant for IT ops",
    description:
      "Atlas, the AI assistant for enterprise IT operations at a $100M+ ARR company. I owned the MCP architecture and shipped approval-gated actions IT admins review in one turn.",
    impact:
      "An entitlement-aware assistant that acts on customer infrastructure only after a human approves, built and verified with coding agents.",
    tags: ["ai assistant", "mcp", "human-in-the-loop"],
    detail: {
      headline: "An AI assistant that automates enterprise IT workflows, with a human in the loop.",
      context:
        "ControlUp helps IT teams monitor, troubleshoot, and optimize enterprise endpoints, virtual desktops, applications, and employee experience signals.",
      contribution: [
        "Replaced sequential Mastra approvals with a parallel workflow so IT admins could review multiple changes in one turn, and shipped approval-gated create, edit, and delete actions to selected customer organizations.",
        "Owned the MCP architecture: built a shared transport and authentication core so other teams could add tools and schemas, and migrated servers from the assistant's local runtime to cloud deployments.",
        "Excluded unlicensed tools and adjusted assistant instructions to match each organization's entitlements, and validated Mastra Observational Memory as a pre-release replacement for context rotation.",
        "Delivered full-stack changes with Claude Code and Codex, then verified them manually and with browser automation, network traces, and Langfuse.",
      ],
      outcome:
        "Assistant actions that IT admins can trust: reviewed together, scoped to their license, and checked before release.",
      scope: ["MCP architecture", "Human-in-the-loop actions", "Agent-assisted delivery"],
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
    role: "Senior Full-Stack Developer",
    href: "https://quicklizard.com/en/",
    period: "AI dynamic pricing",
    description:
      "An AI-powered dynamic pricing platform where I owned full-stack delivery: Next.js workflows, Go services, and rollouts behind feature flags.",
    impact:
      "Shipped pricing dashboards, localization, authentication, bulk overrides, and an Operations Dashboard, then simplified the stack and CI.",
    tags: ["next.js", "go", "pricing"],
    detail: {
      headline: "Full-stack delivery for AI-powered retail pricing automation.",
      context:
        "Quicklizard is a B2B SaaS platform that helps retailers and brands automate pricing across channels by reading market data, competitor prices, and demand patterns in real time.",
      contribution: [
        "Owned features end to end: scoping with stakeholders, implementation, reviews, rollout behind feature flags, and iteration on production feedback.",
        "Built the Go backend and Next.js frontend for an Operations Dashboard with charts and operational metrics.",
        "Developed pricing activity and total exposure endpoints, and implemented Redis token caching and sessions across the Go gateway and Next.js UI.",
        "Upgraded to Next.js 16 and Tailwind CSS 4 and removed Nx to simplify development and CI, keeping dependencies secure through recurring upgrades.",
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
    id: "project-tso-chinese",
    slug: "tso-chinese",
    name: "Tso Chinese",
    role: "Lead engineer, solution architecture",
    href: "https://tsochinese.com",
    period: "Restaurant delivery",
    description:
      "Dark-kitchen delivery software where I supported Tso 2.0 through a five-location expansion, then designed Tso 3.0's microservices architecture, which went live in September 2026.",
    impact:
      "Led a cross-functional team of up to 7 on a product running live restaurant operations, delivery, and payments.",
    tags: ["microservices", "graphql", "team lead"],
    detail: {
      headline: "Commerce and operations software for a dark-kitchen delivery business.",
      context:
        "Tso 2.0 ran live restaurant operations while the business grew from two locations to five. Tso 3.0 is the ground-up redesign built to address the architectural limits 2.0 had run into.",
      contribution: [
        "Developed and supported the Tso 2.0 ordering and kitchen platform as the business grew from two to five restaurants, owning releases, monitoring, and incident response, and migrated payments from Stripe to Cybersource to cut processing costs.",
        "Designed Tso 3.0 on Kubernetes: microservices with separate databases, messaging, and GraphQL gateways for independent scaling, service ownership, and zero-downtime deployments.",
        "Built isolated branch previews with test data so the CTO, QA, and PM could validate changes before merge, with deployment and cleanup automated in GitHub Actions and Go.",
        "Led the technical direction and a cross-functional team of up to 7, set priorities with the CTO, and later planned the phased database migration the team used for cutover.",
      ],
      outcome:
        "A live commerce system where a bad architecture call would have hit real kitchens, drivers, and payments.",
      scope: ["Team leadership", "GraphQL architecture", "Delivery operations"],
    },
    accent: "rose",
    media: {
      type: "image",
      src: "/images/tso_preview.jpg",
      alt: "Tso delivery preview",
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
