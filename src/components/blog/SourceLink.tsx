import { ExternalLink, Globe2 } from "lucide-react";
import type { ReactNode } from "react";
import { GithubIcon } from "@/components/icons/lucide-github";

type SourceLinkProps = {
  children: ReactNode;
  href: string;
};

export default function SourceLink({ children, href }: SourceLinkProps) {
  const hostname = getHostname(href);
  const HostIcon = hostname === "github.com" ? GithubIcon : Globe2;

  return (
    <a className="source-link" href={href} rel="noopener noreferrer" target="_blank">
      <span className="source-link-label">{children}</span>
      <span aria-hidden="true" className="source-link-host">
        <HostIcon className="source-link-icon" size={13} strokeWidth={2.35} />
        <span>{hostname}</span>
        <ExternalLink className="size-3" strokeWidth={2.35} />
      </span>
      <span className="sr-only" lang="en">
        {" "}
        (opens in a new tab)
      </span>
    </a>
  );
}

function getHostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}
