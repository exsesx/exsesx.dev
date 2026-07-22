import type { MDXComponents } from "mdx/types";
import { type ComponentPropsWithoutRef, isValidElement, type ReactNode } from "react";
import BlogTable from "@/components/blog/BlogTable";
import Callout from "@/components/blog/Callout";
import CodeBlock from "@/components/blog/CodeBlock";
import Figure from "@/components/blog/Figure";
import MermaidDiagram from "@/components/blog/MermaidDiagram";
import SourceLink from "@/components/blog/SourceLink";

function MdxPre({ children, className, ...props }: ComponentPropsWithoutRef<"pre">) {
  if (className?.split(" ").includes("mermaid")) {
    return <MermaidDiagram source={getTextContent(children)} />;
  }

  return (
    <CodeBlock className={className} {...props}>
      {children}
    </CodeBlock>
  );
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Figure,
    SourceLink,
    pre: MdxPre,
    table: BlogTable,
    ...components,
  };
}
