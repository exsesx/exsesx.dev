"use client";

import {
  Children,
  type ComponentPropsWithoutRef,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";
import { BLOG_UI } from "@/lib/blog";
import { getTextContent } from "@/lib/blog-text";
import { useBlogLocale } from "./BlogLocaleContext";

type TableScrollMetrics = {
  clientWidth: number;
  scrollLeft: number;
  scrollWidth: number;
};

type ChildrenProps = { children?: ReactNode };

const TABLE_SCROLL_EPSILON = 1;
// A figure with an optional sign and a short unit: 234 ns, 3,754 ns, 25, +12%, 1.4×.
const NUMERIC_CELL = /^[~≈<>±+\-−]?\d[\d.,]*(?:\s?(?:%|×|[a-zµ]{1,3}))?$/i;
const BLANK_CELL = /^(?:|-|–|—)$/;

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

function elementsOf(node: ReactNode) {
  return Children.toArray(node).filter((child): child is ReactElement<ChildrenProps> =>
    isValidElement<ChildrenProps>(child),
  );
}

function mapCells(
  row: ReactElement<ChildrenProps>,
  map: (cell: ReactElement<ChildrenProps>, column: number) => ReactNode,
) {
  let column = 0;

  return Children.map(row.props.children, cell => (isValidElement<ChildrenProps>(cell) ? map(cell, column++) : cell));
}

/**
 * Marks the cells of every column whose body holds only figures with `data-numeric`, so a narrow screen can keep a
 * figure on one line. Done while rendering, so the server markup already carries it and nothing reflows on hydration.
 */
export function markNumericColumns(children: ReactNode): ReactNode {
  const sections = elementsOf(children);
  const bodyRows = sections
    .filter(section => section.type === "tbody")
    .flatMap(section => elementsOf(section.props.children));
  const verdicts: boolean[] = [];
  const hasFigure: boolean[] = [];

  for (const row of bodyRows) {
    mapCells(row, (cell, column) => {
      const text = getTextContent(cell.props.children).trim();
      const isFigure = NUMERIC_CELL.test(text);

      verdicts[column] = (verdicts[column] ?? true) && (isFigure || BLANK_CELL.test(text));
      hasFigure[column] = hasFigure[column] || isFigure;

      return cell;
    });
  }

  const isNumeric = (column: number) => verdicts[column] === true && hasFigure[column] === true;

  if (!verdicts.some((_, column) => isNumeric(column))) {
    return children;
  }

  return Children.map(children, section => {
    if (!isValidElement<ChildrenProps>(section)) {
      return section;
    }

    const rows = Children.map(section.props.children, row => {
      if (!isValidElement<ChildrenProps>(row)) {
        return row;
      }

      const cells = mapCells(row, (cell, column) =>
        isNumeric(column) ? cloneElement(cell, { "data-numeric": "" } as ChildrenProps) : cell,
      );

      return cloneElement(row, undefined, cells);
    });

    return cloneElement(section, undefined, rows);
  });
}

export default function BlogTable({ children, ...props }: ComponentPropsWithoutRef<"table">) {
  const locale = useBlogLocale();
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const scrollContainer = scrollRef.current;
    const table = tableRef.current;

    if (!frame || !scrollContainer || !table) {
      return;
    }

    const frameElement: HTMLDivElement = frame;
    const scrollElement: HTMLElement = scrollContainer;
    const tableElement: HTMLTableElement = table;

    function updateOverflowState() {
      const { canScrollLeft, canScrollRight, hasOverflow } = getTableOverflowState(scrollElement);
      const nextOverflow = hasOverflow ? "true" : "false";
      const nextScrollLeft = canScrollLeft ? "true" : "false";
      const nextScrollRight = canScrollRight ? "true" : "false";

      if (frameElement.dataset.overflow !== nextOverflow) {
        frameElement.dataset.overflow = nextOverflow;
      }
      scrollElement.tabIndex = hasOverflow ? 0 : -1;
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
      <section
        aria-label={BLOG_UI[locale].scrollableTable}
        className="blog-table-scroll"
        ref={scrollRef}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need focus here to scroll hidden columns.
        tabIndex={0}
      >
        <table {...props} ref={tableRef}>
          {markNumericColumns(children)}
        </table>
      </section>
    </div>
  );
}
