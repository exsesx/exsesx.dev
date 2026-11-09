import type { MDXComponents } from "mdx/types";
import { type ComponentPropsWithoutRef, Fragment } from "react";
import BlogTable from "@/components/blog/BlogTable";
import Callout from "@/components/blog/Callout";
import CodeBlock from "@/components/blog/CodeBlock";
import Figure from "@/components/blog/Figure";
import MermaidDiagram from "@/components/blog/MermaidDiagram";
import SourceLink from "@/components/blog/SourceLink";
import { getTextContent } from "@/lib/blog-text";

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

// Inline code wraps whole, but a token wider than the line has to break somewhere: offer the
// break after its separators (max_concurrent_threads_per_ | session) instead of mid-word. <wbr>
// adds no characters, so copying the token still yields it exactly. Highlighted block code
// carries data-language and stays untouched.
const LONG_INLINE_CODE_LENGTH = 24;
const INLINE_CODE_BREAK_AFTER = /(?<=[_./-])/;

function MdxCode({ children, ...props }: ComponentPropsWithoutRef<"code">) {
  const isLongInlineToken =
    typeof children === "string" && children.length > LONG_INLINE_CODE_LENGTH && !("data-language" in props);

  if (!isLongInlineToken) {
    return <code {...props}>{children}</code>;
  }

  let offset = 0;
  const segments = children.split(INLINE_CODE_BREAK_AFTER).map(text => {
    const segment = { start: offset, text };

    offset += text.length;

    return segment;
  });

  return (
    <code {...props}>
      {segments.map(segment => (
        <Fragment key={segment.start}>
          {segment.start > 0 ? <wbr /> : null}
          {segment.text}
        </Fragment>
      ))}
    </code>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    Figure,
    SourceLink,
    code: MdxCode,
    figcaption: MdxFigcaption,
    pre: MdxPre,
    table: BlogTable,
    ...components,
  };
}
