import { useEffect, useState } from "react";

export default function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const changeEventHandler = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addListener(changeEventHandler);

    return () => {
      mediaQueryList.removeListener(changeEventHandler);
    };
  }, [query]);

  return matches;
}
