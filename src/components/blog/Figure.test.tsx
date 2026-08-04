import { describe, expect, test } from "bun:test";
import type { StaticImageData } from "next/image";
import { renderToStaticMarkup } from "react-dom/server";
import Figure from "./Figure";

const testImage: StaticImageData = {
  src: "/test-image.webp",
  blurDataURL: "data:image/webp;base64,light",
  height: 560,
  width: 1000,
};

const darkTestImage: StaticImageData = {
  src: "/test-image-dark.webp",
  blurDataURL: "data:image/webp;base64,dark",
  height: 560,
  width: 1000,
};

describe("Figure", () => {
  test("renders appearance-specific image sources when a dark image is provided", () => {
    const markup = renderToStaticMarkup(<Figure src={testImage} darkSrc={darkTestImage} alt="Test image" />);

    expect(markup).toContain('class="blog-figure"');
    expect(markup).toContain("test-image.webp");
    expect(markup).toContain("test-image-dark.webp");
    expect(markup).toContain("blog-figure-image--light");
    expect(markup).toContain("blog-figure-image--dark");
    expect(markup.match(/rel="preload"/g)).toHaveLength(2);
    expect(markup.match(/loading="eager"/g)).toHaveLength(2);
    expect(markup).toContain("data:image/webp;base64,light");
    expect(markup).toContain("data:image/webp;base64,dark");
  });
});
