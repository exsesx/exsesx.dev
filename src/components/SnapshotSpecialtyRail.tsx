"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";

type SnapshotSpecialtyRailProps = {
  specialties: string[];
};

function SpecialtyBadges({ specialties, clone = false }: SnapshotSpecialtyRailProps & { clone?: boolean }) {
  return specialties.map(specialty => (
    <Badge
      key={`${clone ? "clone-" : ""}${specialty}`}
      variant="outline"
      className="h-7 max-w-full shrink-0 bg-background/50 px-3 text-xs font-bold sm:text-sm"
    >
      {specialty}
    </Badge>
  ));
}

export default function SnapshotSpecialtyRail({ specialties }: SnapshotSpecialtyRailProps) {
  const railRef = useRef<HTMLElement>(null);
  // The marquee only animates on mobile; pause it whenever the rail is off-screen
  // so an infinite loop never runs where it can't be seen.
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const node = railRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={railRef}
      data-visible={isVisible}
      className="snapshot-specialty-rail -mx-2 mt-5 min-w-0 overflow-hidden px-2 pb-1 sm:mx-0 sm:mt-7 sm:flex sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0"
      aria-label="Specialties"
    >
      <div className="snapshot-specialty-track flex w-max gap-0 sm:contents">
        <div className="flex shrink-0 gap-1.5 pr-1.5 sm:contents">
          <SpecialtyBadges specialties={specialties} />
        </div>
        <div className="flex shrink-0 gap-1.5 pr-1.5 sm:hidden" aria-hidden="true">
          <SpecialtyBadges specialties={specialties} clone />
        </div>
      </div>
    </section>
  );
}
