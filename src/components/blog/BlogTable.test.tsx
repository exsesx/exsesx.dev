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

  test("flags only all-figure columns as numeric, header included", () => {
    const markup = renderToStaticMarkup(
      <BlogTable>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Old wrapper</th>
            <th>
              <code>cn</code>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Node 24.20.0</td>
            <td>3,754 ns</td>
            <td>
              <code>11</code>
            </td>
          </tr>
          <tr>
            <td>Bun 1.4.1</td>
            <td>145 ns</td>
            <td>fast</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    expect(markup).toContain('<th data-numeric="">Old wrapper</th>');
    expect(markup).toContain('<td data-numeric="">3,754 ns</td>');
    expect(markup).toContain('<td data-numeric="">145 ns</td>');
    expect(markup).toContain("<td>Node 24.20.0</td>");
    expect(markup).toContain("<td>fast</td>");
    expect(markup.match(/data-numeric/g)).toHaveLength(3);
  });
});
