"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { attachBlogIndexDot } from "@/lib/blog-index-dot";

/*
 * The blog index's rail. HEAD keeps its own lit node in CSS; with script, one
 * accent dot (attachBlogIndexDot) marks the post under the pointer and moves on
 * the rail like a bead. Without script the rows light their own nodes, so
 * nothing depends on this component.
 */
export default function BlogIndexTimeline({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const list = listRef.current;
    const dot = dotRef.current;

    if (!root || !list || !dot) {
      return;
    }

    return attachBlogIndexDot(root, list, dot);
  }, []);

  return (
    <div ref={rootRef} className="blog-index-timeline">
      <ol ref={listRef} className={className}>
        {children}
      </ol>
      <span ref={dotRef} className="blog-index-dot" aria-hidden="true" />
    </div>
  );
}
