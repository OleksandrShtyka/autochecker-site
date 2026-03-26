"use client";

import { useEffect, useRef, useState } from "react";
import type { NavItem } from "../types";

export function useActiveSection(items: NavItem[], defaultSection = "top") {
  const [activeSection, setActiveSection] = useState(defaultSection);
  const clickedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const getActive = () => {
      const midpoint = window.innerHeight * 0.4;

      // Find the section whose top edge is closest to (but not past) the midpoint
      let best = items[0].id;
      let bestDist = Infinity;

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // distance from the 40% viewport line
        const dist = Math.abs(top - midpoint);
        // prefer sections whose top is above the midpoint
        if (top <= midpoint + 80 && dist < bestDist) {
          bestDist = dist;
          best = item.id;
        }
      }

      return best;
    };

    const onScroll = () => {
      if (clickedRef.current) return;
      setActiveSection(getActive());
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);

    // Lock scroll-based detection until the smooth scroll finishes (~900 ms)
    clickedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      clickedRef.current = false;
    }, 900);

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return { activeSection, setActiveSection, scrollToSection };
}
