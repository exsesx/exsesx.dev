"use client";

import { type ReactNode, useEffect, useRef } from "react";

const NODE_SELECTOR = ".blog-index-node";

/*
 * The blog index's checked-out commit: one accent dot that rests on HEAD and
 * slides along the rail to the post under the pointer. Keyboard focus moves it
 * instantly (keyboard actions never animate), touch leaves it on HEAD and lets
 * the pressed row light in CSS, and reduced motion drops the slide. Without
 * script the rows light their own nodes in CSS, so nothing depends on this
 * component.
 */
export default function BlogIndexTimeline({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const list = listRef.current;
    const dot = dotRef.current;
    const head = list?.querySelector<HTMLElement>(NODE_SELECTOR);

    if (!root || !list || !dot || !head) {
      return;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target: HTMLElement = head;
    let hovered: HTMLElement | null = null;

    const place = (node: HTMLElement, animate: boolean) => {
      if (animate && node === target) {
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const x = nodeRect.left + nodeRect.width / 2 - rootRect.left;
      const y = nodeRect.top + nodeRect.height / 2 - rootRect.top;
      const instant = !animate || reducedMotion.matches;

      target = node;
      dot.toggleAttribute("data-instant", instant);
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;

      if (instant) {
        // Commit the jump before transitions come back for the next move.
        dot.getBoundingClientRect();
        dot.removeAttribute("data-instant");
      }
    };

    const nodeFor = (element: EventTarget | null) =>
      element instanceof Element ? element.closest("li")?.querySelector<HTMLElement>(NODE_SELECTOR) : null;

    const onPointerOver = (event: PointerEvent) => {
      const node = nodeFor(event.target);

      if (event.pointerType === "touch" || !finePointer.matches || !node || node === hovered) {
        return;
      }

      hovered = node;
      place(node, true);
    };

    const onPointerLeave = () => {
      hovered = null;
      place(head, true);
    };

    const onFocusIn = (event: FocusEvent) => {
      const node = nodeFor(event.target);

      if (node && event.target instanceof Element && event.target.matches(":focus-visible")) {
        place(node, false);
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (!list.contains(event.relatedTarget as Node | null) && !hovered) {
        place(head, false);
      }
    };

    // Rows reflow with fonts, width and theme; keep the dot on its node without sliding.
    const resizeObserver = new ResizeObserver(() => place(target, false));

    place(head, false);
    root.setAttribute("data-timeline-ready", "");
    resizeObserver.observe(list);
    list.addEventListener("pointerover", onPointerOver);
    list.addEventListener("pointerleave", onPointerLeave);
    list.addEventListener("focusin", onFocusIn);
    list.addEventListener("focusout", onFocusOut);

    return () => {
      resizeObserver.disconnect();
      list.removeEventListener("pointerover", onPointerOver);
      list.removeEventListener("pointerleave", onPointerLeave);
      list.removeEventListener("focusin", onFocusIn);
      list.removeEventListener("focusout", onFocusOut);
      root.removeAttribute("data-timeline-ready");
    };
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
