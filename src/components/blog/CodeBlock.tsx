"use client";

import { Check, Copy } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef, useState } from "react";

export default function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(
    () => () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  async function copyCode() {
    const value = preRef.current?.innerText;

    if (!value || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }

    setCopied(true);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="blog-code-block">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        className="blog-code-copy"
        lang="en"
        data-copied={copied ? "true" : "false"}
        aria-label={copied ? "Code copied" : "Copy code"}
        onClick={copyCode}
      >
        {copied ? <Check aria-hidden="true" size={14} strokeWidth={2.5} /> : <Copy aria-hidden="true" size={14} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <span className="sr-only" role="status">
        {copied ? "Code copied" : ""}
      </span>
    </div>
  );
}
