export const SITE_PROFILE = {
  name: "Oleh Vanin",
  domain: "exsesx.dev",
  url: "https://exsesx.dev",
  role: "Senior Full-Stack Engineer, Applied AI",
  nationality: "Ukraine",
  location: "Poland",
  description:
    "Oleh Vanin is a senior full-stack engineer in Poland with 9+ years building products, most recently AI features that automate enterprise IT workflows.",
  summary: "Senior full-stack engineer in Poland who ships AI features to production.",
  introduction:
    "I've owned architecture, delivery, and production operations. Most recently, I shipped AI features that automate enterprise IT workflows.",
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
  { value: "10", label: "engineers managed and mentored at peak", socialLabel: "engineers managed at peak" },
  {
    value: "AI",
    label: "MCP architecture and approval-gated actions in production",
    socialLabel: "MCP, approval-gated actions",
  },
] as const;
