import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import BlogTable, { getTableOverflowState } from "./BlogTable";

describe("BlogTable", () => {
  test("exposes edge affordances only while hidden columns remain", () => {
    expect(getTableOverflowState({ clientWidth: 600, scrollLeft: 0, scrollWidth: 600 })).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
      hasOverflow: false,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 0, scrollWidth: 600 })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 140, scrollWidth: 600 })).toEqual({
      canScrollLeft: true,
      canScrollRight: true,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 280, scrollWidth: 600 })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: -12, scrollWidth: 600 })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 300, scrollWidth: 600 })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 0, scrollWidth: 320.75 })).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
      hasOverflow: false,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 0.75, scrollWidth: 600 })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
      hasOverflow: true,
    });
    expect(getTableOverflowState({ clientWidth: 320, scrollLeft: 279.25, scrollWidth: 600 })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
      hasOverflow: true,
    });
  });

  test("keeps semantic table markup inside a stable, initially cue-free frame", () => {
    const markup = renderToStaticMarkup(
      <BlogTable>
        <tbody>
          <tr>
            <td>Value</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    expect(markup).toContain('class="blog-table-frame"');
    expect(markup).toContain('data-scroll-left="false"');
    expect(markup).toContain('data-scroll-right="false"');
    expect(markup).toContain('class="blog-table-scroll"');
    expect(markup).toContain("<table>");
    expect(markup).toContain("<td>Value</td>");
    expect(markup.match(/<table(?:\s|>)/g)).toHaveLength(1);
  });
});
