export const SITE_PROFILE = {
  name: "Oleh Vanin",
  domain: "exsesx.dev",
  url: "https://exsesx.dev",
  role: "Senior Full Stack Engineer / AI Engineer",
  nationality: "Ukraine",
  location: "Poland",
  description:
    "Oleh Vanin is a Ukrainian Senior Full Stack Engineer / AI Engineer based in Poland, building practical AI systems, full-stack products, MCP servers, LLM workflows, and developer tools.",
  introduction:
    "I am Oleh, a Ukrainian engineer based in Poland. I build practical AI systems, full-stack products, MCP servers, LLM workflows, and developer tools with TypeScript, React, Node.js, Go, and cloud infrastructure.",
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
  { value: "9+", label: "years building web products", socialLabel: "years building web products" },
  { value: "17+", label: "projects supported as lead engineer", socialLabel: "projects supported as lead engineer" },
  {
    value: "AI",
    label: "assistant systems, MCP, LLM workflows",
    socialLabel: "assistant systems, MCP, LLM",
  },
  {
    value: "Full-stack",
    label: "React, Next.js, Node.js, Go, cloud",
    socialLabel: "React, Next, Node, Go, cloud",
  },
] as const;
