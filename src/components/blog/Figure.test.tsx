import { describe, expect, test } from "bun:test";
import type { StaticImageData } from "next/image";
import { renderToStaticMarkup } from "react-dom/server";
import Figure from "./Figure";

const testImage: StaticImageData = {
  src: "/test-image.webp",
  height: 560,
  width: 1000,
};

describe("Figure", () => {
  test("keeps the shared Blog frame by default", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} alt="Test image" />);

    expect(markup).toContain('class="blog-figure"');
    expect(markup).not.toContain("blog-figure--intrinsic");
  });

  test("opts into the image's intrinsic transparent corners", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} alt="Test image" frame="intrinsic" />);

    expect(markup).toContain('class="blog-figure blog-figure--intrinsic"');
  });
});
