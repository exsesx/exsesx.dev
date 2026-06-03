import { StaticImageData } from "next/image";

export interface Project {
  title: string;
  role: string;
  href: string;
  period: string;
  description: string;
  impact: string;
  tags: string[];
  accent: "cyan" | "amber" | "rose" | "mint" | "steel";
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
    title: "Huddle",
    role: "Product engineering",
    href: "https://www.huddle.uk.com/",
    period: "Utilities / tenancy",
    description:
      "Household utility management work where I adapted from Angular.js to React and worked closely with PostgreSQL stored procedures and PostGraphQL.",
    impact: "Helped move a real everyday product through a practical frontend and data-layer transition.",
    tags: ["react", "postgresql", "postgraphql"],
    accent: "cyan",
    media: {
      type: "image",
      src: "/images/huddle_preview.png",
      alt: "Huddle product preview",
      backgroundColor: "#7241C3",
    },
  },
  {
    title: "This is Language",
    role: "Platform work",
    href: "https://www.thisislanguage.com/",
    period: "Learning platform",
    description:
      "A language-learning platform where I built scalable backend features around video transcoding, learning puzzles, and a multiplayer game.",
    impact:
      "Built product features around learning, media, and play: the kind of software where the user impact is visible.",
    tags: ["video", "backend", "multiplayer"],
    accent: "amber",
    media: {
      type: "video",
      src: "/videos/thisislanguage_preview.mp4",
      poster: "/images/thisislanguage_poster.jpg",
      label: "This is Language motion preview",
    },
  },
  {
    title: "TSO Chinese Delivery",
    role: "Commerce systems",
    href: "https://tsodelivery.com",
    period: "Restaurant delivery",
    description:
      "Dark-kitchen automation software where I helped architect TSO 3.0, moving toward microservices and rewriting REST APIs to GraphQL.",
    impact:
      "Led a cross-functional team of up to 10 people on a product that supported live operations, jobs, delivery, and payment migration work.",
    tags: ["microservices", "graphql", "team lead"],
    accent: "rose",
    media: {
      type: "image",
      src: "/images/tso_preview.jpg",
      alt: "TSO delivery preview",
    },
  },
  {
    title: "Clear Street Bank",
    role: "Fintech engineering",
    href: "https://www.clearstreetbank.com/",
    period: "Banking",
    description:
      "A banking product surface shaped by the same priorities I bring to finance software: reliability, restraint, and service detail.",
    impact:
      "Kept in the portfolio as fintech-facing product work while the public details stay intentionally lightweight.",
    tags: ["fintech", "banking", "systems"],
    accent: "steel",
    media: {
      type: "image",
      src: "/images/clear_street_preview.jpg",
      alt: "Clear Street Bank preview",
    },
  },
  {
    title: "CoinMENA",
    role: "Crypto product",
    href: "https://www.coinmena.com",
    period: "Digital assets",
    description:
      "A UAE-based cryptocurrency application where I implemented asynchronous frontend architecture for real-time verifications and updates.",
    impact:
      "Helped meet a critical regulatory certification deadline, enabling business operations across the MENA region.",
    tags: ["crypto", "real-time", "regulated"],
    accent: "mint",
    media: {
      type: "image",
      src: "/images/coinmena_preview.jpeg",
      alt: "CoinMENA preview",
    },
  },
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
