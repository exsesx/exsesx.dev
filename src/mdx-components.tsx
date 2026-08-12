import type { MDXComponents } from "mdx/types";
import { type ComponentPropsWithoutRef, isValidElement, type ReactNode } from "react";
import BlogTable from "@/components/blog/BlogTable";
import Callout from "@/components/blog/Callout";
import CodeBlock from "@/components/blog/CodeBlock";
import Figure from "@/components/blog/Figure";
import MermaidDiagram from "@/components/blog/MermaidDiagram";
import SourceLink from "@/components/blog/SourceLink";

type MdxFigcaptionProps = ComponentPropsWithoutRef<"figcaption"> & {
  "data-language"?: string;
};

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

function MdxFigcaption({ children, ...props }: MdxFigcaptionProps) {
  const language = props["data-language"];

  if (typeof language !== "string") {
    return <figcaption {...props}>{children}</figcaption>;
  }

  return (
    <figcaption {...props}>
      <span className="blog-code-title">{children}</span>
      <span className="blog-code-language">{language}</span>
    </figcaption>
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
    figcaption: MdxFigcaption,
    pre: MdxPre,
    table: BlogTable,
    ...components,
  };
}
