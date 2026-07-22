import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

type FigureProps = {
  alt: string;
  caption?: ReactNode;
  credit?: ReactNode;
  priority?: boolean;
  src: StaticImageData;
};

export default function Figure({ alt, caption, credit, priority = false, src }: FigureProps) {
  return (
    <figure className="blog-figure">
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 48rem, calc(100vw - 2rem)"
        preload={priority}
        className="h-auto w-full"
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
