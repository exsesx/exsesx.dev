import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

type FigureProps = {
  alt: string;
  caption?: ReactNode;
  credit?: ReactNode;
  darkSrc: StaticImageData;
  src: StaticImageData;
};

export default function Figure({ alt, caption, credit, darkSrc, src }: FigureProps) {
  return (
    <figure className="blog-figure">
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 48rem, calc(100vw - 2rem)"
        loading="eager"
        placeholder={src.blurDataURL ? "blur" : undefined}
        className="blog-figure-image--light h-auto w-full"
      />
      <Image
        src={darkSrc}
        alt={alt}
        sizes="(min-width: 1024px) 48rem, calc(100vw - 2rem)"
        loading="eager"
        placeholder={darkSrc.blurDataURL ? "blur" : undefined}
        className="blog-figure-image--dark h-auto w-full"
      />
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
