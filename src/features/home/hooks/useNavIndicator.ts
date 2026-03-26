"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type IndicatorState = {
  left: number;
  width: number;
  opacity: number;
};

export function useNavIndicator(activeSection: string, dependency?: string) {
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const navTrackRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<IndicatorState>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = () => {
    const track = navTrackRef.current;
    const activeNode = navRefs.current[activeSection];

    if (!track || !activeNode) {
      setIndicator((current) =>
        current.opacity === 0
          ? current
          : {
              left: 0,
              width: 0,
              opacity: 0,
            }
      );
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const itemRect = activeNode.getBoundingClientRect();

    setIndicator((current) => {
      const next = {
        left: itemRect.left - trackRect.left,
        width: itemRect.width,
        opacity: 1,
      };

      if (
        current.left === next.left &&
        current.width === next.width &&
        current.opacity === next.opacity
      ) {
        return current;
      }

      return next;
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeSection, dependency]);

  useEffect(() => {
    const track = navTrackRef.current;
    if (!track) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateIndicator();
    });

    resizeObserver.observe(track);
    Object.values(navRefs.current).forEach((node) => {
      if (node) {
        resizeObserver.observe(node);
      }
    });

    window.addEventListener("resize", updateIndicator);
    window.addEventListener("orientationchange", updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateIndicator);
      window.removeEventListener("orientationchange", updateIndicator);
    };
  }, [activeSection, dependency]);

  return { navRefs, navTrackRef, indicator };
}
