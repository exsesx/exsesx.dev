"use client";

import { type ComponentPropsWithoutRef, useLayoutEffect, useRef } from "react";

type TableScrollMetrics = {
  clientWidth: number;
  scrollLeft: number;
  scrollWidth: number;
};

const TABLE_SCROLL_EPSILON = 1;

export function getTableOverflowState({ clientWidth, scrollLeft, scrollWidth }: TableScrollMetrics) {
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const clampedScrollLeft = Math.min(maxScrollLeft, Math.max(0, scrollLeft));
  const hasOverflow = maxScrollLeft > TABLE_SCROLL_EPSILON;

  return {
    canScrollLeft: hasOverflow && clampedScrollLeft > TABLE_SCROLL_EPSILON,
    canScrollRight: hasOverflow && maxScrollLeft - clampedScrollLeft > TABLE_SCROLL_EPSILON,
    hasOverflow,
  };
}

export default function BlogTable({ children, ...props }: ComponentPropsWithoutRef<"table">) {
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const scrollContainer = scrollRef.current;
    const table = tableRef.current;

    if (!frame || !scrollContainer || !table) {
      return;
    }

    const frameElement: HTMLDivElement = frame;
    const scrollElement: HTMLDivElement = scrollContainer;
    const tableElement: HTMLTableElement = table;

    function updateOverflowState() {
      const { canScrollLeft, canScrollRight, hasOverflow } = getTableOverflowState(scrollElement);
      const nextOverflow = hasOverflow ? "true" : "false";
      const nextScrollLeft = canScrollLeft ? "true" : "false";
      const nextScrollRight = canScrollRight ? "true" : "false";

      if (frameElement.dataset.overflow !== nextOverflow) {
        frameElement.dataset.overflow = nextOverflow;
      }
      if (frameElement.dataset.scrollLeft !== nextScrollLeft) {
        frameElement.dataset.scrollLeft = nextScrollLeft;
      }
      if (frameElement.dataset.scrollRight !== nextScrollRight) {
        frameElement.dataset.scrollRight = nextScrollRight;
      }
    }

    updateOverflowState();
    scrollElement.addEventListener("scroll", updateOverflowState, { passive: true });

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(scrollElement);
    resizeObserver.observe(tableElement);

    return () => {
      scrollElement.removeEventListener("scroll", updateOverflowState);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className="blog-table-frame"
      data-overflow="false"
      data-scroll-left="false"
      data-scroll-right="false"
      ref={frameRef}
    >
      <div className="blog-table-scroll" ref={scrollRef}>
        <table {...props} ref={tableRef}>
          {children}
        </table>
      </div>
    </div>
  );
}
