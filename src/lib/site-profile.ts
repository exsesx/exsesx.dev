export const SITE_PROFILE = {
  name: "Oleh Vanin",
  domain: "exsesx.dev",
  url: "https://exsesx.dev",
  role: "Senior Full Stack Engineer / AI Engineer",
  tagline: "Senior Full-Stack Engineer · AI-native",
  nationality: "Ukraine",
  location: "Poland",
  description:
    "Oleh Vanin is a Ukrainian Senior Full Stack Engineer / AI Engineer based in Poland. He owns architecture, delivery, and production operations, ships AI features that automate enterprise IT workflows, and builds and verifies software with coding agents.",
  introduction:
    "I'm Oleh, a senior full-stack engineer in Poland with 9+ years of building products. I own architecture, delivery, and production operations, ship AI features that automate enterprise IT workflows, and build and verify software with coding agents.",
  links: {
    github: "https://github.com/exsesx",
    linkedin: "https://www.linkedin.com/in/exsesx/",
    booking: "https://cal.com/exsesx/meet",
  },
  resume: {
    path: "/api/resume/pdf",
    filename: "Oleh Vanin CV.pdf",
  },
} as const;

export const PROFILE_SNAPSHOT_STATS = [
  { value: "9+", label: "years building products", socialLabel: "years building products" },
  { value: "17+", label: "projects guided as lead engineer", socialLabel: "projects guided as lead engineer" },
  { value: "10", label: "engineers managed and mentored", socialLabel: "engineers managed and mentored" },
  {
    value: "AI",
    label: "MCP, agents, human-in-the-loop workflows",
    socialLabel: "MCP, agents, HITL workflows",
  },
] as const;
