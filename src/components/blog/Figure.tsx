import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

type FigureProps = {
  alt: string;
  caption?: ReactNode;
  credit?: ReactNode;
  darkSrc?: StaticImageData;
  frame?: "default" | "intrinsic";
  priority?: boolean;
  src: StaticImageData;
};

export default function Figure({
  alt,
  caption,
  credit,
  darkSrc,
  frame = "default",
  priority = false,
  src,
}: FigureProps) {
  return (
    <figure className={`blog-figure${frame === "intrinsic" ? " blog-figure--intrinsic" : ""}`}>
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 48rem, calc(100vw - 2rem)"
        preload={priority && !darkSrc}
        className={`h-auto w-full${darkSrc ? " blog-figure-image--light" : ""}`}
      />
      {darkSrc ? (
        <Image
          src={darkSrc}
          alt={alt}
          sizes="(min-width: 1024px) 48rem, calc(100vw - 2rem)"
          className="blog-figure-image--dark h-auto w-full"
        />
      ) : null}
      {caption || credit ? (
        <figcaption>
          {caption}
          {caption && credit ? " · " : null}
          {credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
