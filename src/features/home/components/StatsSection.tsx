"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles";
import type { Stat } from "../types";
import { cx } from "../utils";

type StatsSectionProps = {
  stats: Stat[];
};

function parseNumeric(value: string): number | null {
  const match = value.match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function formatDisplayValue(original: string, animated: number): string {
  const match = original.match(/^([\d.]+)(.*)/);
  if (!match) return original;
  const [, , suffix] = match;
  const isFloat = original.includes(".");
  return `${isFloat ? animated.toFixed(1) : Math.round(animated)}${suffix}`;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const [values, setValues] = useState<number[]>(stats.map(() => 0));
  const [started, setStarted] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const targets = stats.map((s) => parseNumeric(s.value) ?? 0);
    const duration = 1400;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValues(targets.map((t) => eased * t));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [started, stats]);

  return (
    <section className={styles.stats} ref={sectionRef}>
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => {
          const target = parseNumeric(stat.value);
          const display =
            target !== null
              ? formatDisplayValue(stat.value, values[index])
              : stat.value;

          return (
            <div
              key={stat.label}
              className={cx(
                styles.statItem,
                styles.scaleIn,
                (styles as Record<string, string>)[`d${index + 1}`]
              )}
            >
              <span className={styles.statValue}>{display}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
