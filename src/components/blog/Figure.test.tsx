import { describe, expect, test } from "bun:test";
import type { StaticImageData } from "next/image";
import { renderToStaticMarkup } from "react-dom/server";
import Figure from "./Figure";

const testImage: StaticImageData = {
  src: "/test-image.webp",
  height: 560,
  width: 1000,
};

const darkTestImage: StaticImageData = {
  src: "/test-image-dark.webp",
  height: 560,
  width: 1000,
};

describe("Figure", () => {
  test("keeps the shared Blog frame by default", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} alt="Test image" />);

    expect(markup).toContain('class="blog-figure"');
    expect(markup).not.toContain("blog-figure--intrinsic");
    expect(markup).not.toContain("blog-figure-image--light");
    expect(markup).not.toContain("blog-figure-image--dark");
  });

  test("opts into the image's intrinsic transparent corners", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} alt="Test image" frame="intrinsic" />);

    expect(markup).toContain('class="blog-figure blog-figure--intrinsic"');
  });

  test("preserves preloading for a priority figure with one source", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} alt="Test image" priority />);

    expect(markup).toContain('rel="preload"');
  });

  test("renders appearance-specific image sources when a dark image is provided", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} darkSrc={darkTestImage} alt="Test image" priority />);

    expect(markup).toContain("test-image.webp");
    expect(markup).toContain("test-image-dark.webp");
    expect(markup).toContain("blog-figure-image--light");
    expect(markup).toContain("blog-figure-image--dark");
    expect(markup).not.toContain('rel="preload"');
  });
});
