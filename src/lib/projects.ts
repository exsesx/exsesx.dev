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
      "I worked on the Atlas team's AI assistant for enterprise IT operations at a $100M+ ARR company. I owned its MCP architecture and built a shared transport and authentication core for other teams' tools.",
    impact:
      "IT admins approve create, edit, and delete actions before they run, and can review several changes in one turn.",
    tags: ["AI assistant", "MCP", "Human-in-the-loop"],
    detail: {
      headline: "An AI assistant that automates enterprise IT workflows, with a human in the loop.",
      context:
        "The Atlas team builds ControlUp's AI assistant for enterprise IT operations. Some of its actions change devices, sessions, users, and roles, so an IT admin has to approve each one.",
      contribution: [
        "Built an approval layer that shows every pending approval in a turn at once, so an IT admin approves or rejects them together and the stream carries on. Mastra's flow at the time blocked the turn on one approval after another.",
        "Built mcp-server-core, the shared base other teams used to ship MCP servers: import it, add tools and schemas, and the HTTP and stdio transports come with it. Version one was a straight extraction of the existing server, so about ten teams could adopt it without migration surprises.",
        "Moved the core's transport to Hono with the MCP SDK's web-standard streamable HTTP, and migrated the MCP servers from the assistant's local runtime to cloud deployments.",
        "Made the assistant read each organization's entitlements: its instructions adjust per organization and unlicensed tools are left out entirely, which removed a class of failed actions and confusing answers. Also validated Mastra Observational Memory as a pre-release replacement for context rotation.",
        "Owned the frontend of the assistant redesign, including a new full-screen mode. The assistant is a module-federation microfrontend, so full screen falls back to the sidebar on navigation and neither the conversation nor the page is lost. Shipped through a staged customer rollout.",
      ],
      outcome:
        "Assistant actions IT admins can trust: approved together, scoped to their organization's license, and checked in production with Langfuse traces.",
      scope: ["Human-in-the-loop approvals", "MCP architecture", "Assistant frontend", "Agent-assisted delivery"],
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
    period: "Pricing platform",
    description:
      "A pricing platform where I owned dashboards, localization, authentication, and bulk overrides from scoping to feature-flagged rollout.",
    impact:
      "Built the Go backend and Next.js frontend for an Operations Dashboard, and removed Nx to simplify development and CI.",
    tags: ["Next.js", "Go", "Pricing"],
    detail: {
      headline: "Full-stack features for a retail pricing platform, from scoping to rollout.",
      context:
        "Quicklizard is a pricing platform for retailers. I worked across its Go gateway and Next.js UI through Adaptiq, from March 2025 to January 2026.",
      contribution: [
        "Took each feature from scoping with stakeholders to a feature-flagged rollout, then followed it through monitoring and production feedback.",
        "Built the Go backend and Next.js frontend for an Operations Dashboard with charts and operational metrics.",
        "Developed the pricing activity and total exposure endpoints, and added Redis token caching and sessions across the Go gateway and the Next.js UI.",
        "Upgraded to Next.js 16 and Tailwind 4 and removed Nx, which simplified development and CI, and kept dependencies secure with recurring upgrades.",
      ],
      outcome:
        "Pricing features that shipped behind feature flags and improved on production feedback, on a simpler stack and CI.",
      scope: ["Pricing dashboards", "Go backend endpoints", "Stack modernization"],
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
    period: "Dark-kitchen automation",
    description:
      "I developed and supported Tso 2.0 as the business grew from two to five restaurants, then designed Tso 3.0's architecture. It went live in September 2026.",
    impact:
      "Led Tso 3.0's technical direction and cross-functional team, then wrote the phased database migration plan the team adopted.",
    tags: ["Microservices", "GraphQL", "Team lead"],
    detail: {
      headline: "Ordering, dispatch, and kitchen software for a dark-kitchen delivery business.",
      context:
        "Tso Chinese is a US restaurant brand that runs dark kitchens: an ordering site, an admin panel, a dispatch screen for delivery drivers, and kitchen tablets. Tso 3.0 is the redesign for 2.0's downtime releases and single-Postgres bottleneck.",
      contribution: [
        "Developed and supported the Tso 2.0 ordering and kitchen platform, owning client communication, releases, monitoring, and incident response. Migrated payment processing from Stripe to Cybersource to cut processing costs.",
        "Reduced the database load from kitchen tablets that re-fetched on every change signal and hit Postgres in waves, first with query analysis and Redis, then by sending only what changed so only the affected tablet refreshed.",
        "Designed Tso 3.0 as solution architect around the CTO's two requirements: test changes in small, isolated pieces before they reach the kitchens, and grow the team without people stepping on each other. That meant Kubernetes, a database per service, RabbitMQ, and GraphQL gateways, so each service scales on its own, releases need no downtime, and one engineer can own payments without touching ordering.",
        "Built preview environments: label a pull request and it deploys to its own namespace with a database, test data, RabbitMQ, and Jaeger tracing, so the CTO, QA, and PM could try any branch before merge. GitHub Actions and Go handled deploy and cleanup, and the AWS calculator showed previews costing less than full environments.",
        "Led a cross-functional team of about 7 to 9 while staying hands-on, setting priorities with the CTO and coordinating delivery with the PM. Later, as a consultant, documented the migration in phases across off-hours windows, with cutover failure scenarios and mitigations, and presented it to the team.",
      ],
      outcome:
        "A live commerce system where a bad architecture call would have hit real kitchens, drivers, and payments.",
      scope: ["Solution architecture", "Team leadership", "Preview environments", "Delivery operations"],
    },
    accent: "rose",
    media: {
      type: "image",
      src: "/images/tso_preview.jpg",
      alt: "A bowl of glazed chicken with broccoli and dried chilies",
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
    tags: ["Fintech", "Banking", "Systems"],
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
      "A UAE-based cryptocurrency app where I built the asynchronous frontend architecture for real-time verification. I also delivered the functionality its regulatory certification required, by the deadline.",
    impact:
      "Hit a critical regulatory certification deadline that opened up business operations across the MENA region.",
    tags: ["Crypto", "Real-time", "Regulated"],
    detail: {
      headline: "Real-time regulated crypto product work under a certification deadline.",
      context:
        "CoinMENA needed a frontend that could handle asynchronous verification flows and regulated digital-asset operations, with a hard certification deadline attached.",
      contribution: [
        "Built the asynchronous frontend architecture for real-time verification, so verification status and updates reached users as they happened.",
        "Delivered the functionality required for regulatory certification by the deadline.",
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
    role: "Backend engineering",
    href: "https://www.thisisschool.com/",
    period: "Learning platform",
    description:
      "A language-learning platform where I owned the Node.js backend, including an AWS video-transcoding pipeline and a learning game with four-player rooms.",
    impact: "Backend features for learning, media, and play that students used directly.",
    tags: ["Node.js", "Video", "Multiplayer"],
    detail: {
      headline: "Learning-platform engineering across media, puzzles, and multiplayer play.",
      context:
        "This is Language pairs language learning with video-heavy content and interactive practice, so the backend has to stay fast while students are mid-lesson.",
      contribution: [
        "Built an AWS video-transcoding pipeline for the platform's video-heavy content.",
        "Built the backend for a learning game with four-player rooms, alongside the learning puzzles.",
        "Tuned the performance and feedback loops that students felt while practicing.",
      ],
      outcome: "The work led to a UK team invitation with potential visa sponsorship.",
      scope: ["Node.js backend", "AWS video transcoding", "Multiplayer game rooms"],
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
    role: "Web developer",
    href: "https://www.huddle.uk.com/",
    period: "Utilities / tenancy",
    description:
      "A household utility management product where I contributed to the AngularJS-to-React migration and exposed PostgreSQL stored procedures as GraphQL APIs with PostGraphQL.",
    impact:
      "Helped move an everyday utility product from AngularJS to React, with GraphQL APIs over its PostgreSQL stored procedures.",
    tags: ["React", "PostgreSQL", "PostGraphQL"],
    detail: {
      headline: "A practical product transition for household utility management.",
      context:
        "Huddle handled the everyday plumbing of household services: tenancy, utility accounts, and the operational edge cases that come with them.",
      contribution: [
        "Contributed to the AngularJS-to-React migration mid-project without stalling delivery.",
        "Exposed PostgreSQL stored procedures as GraphQL APIs with PostGraphQL, so the React frontend could query them directly.",
        "Turned utility-management requirements into maintainable frontend screens.",
      ],
      outcome: "A frontend and data-layer move that kept the live product working for everyday users.",
      scope: ["AngularJS to React", "PostGraphQL APIs", "Utility operations"],
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
