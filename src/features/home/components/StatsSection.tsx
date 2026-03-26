import styles from "../styles";
import type { Stat } from "../types";
import { cx } from "../utils";

type StatsSectionProps = {
  stats: Stat[];
};

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className={styles.stats}>
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cx(
              styles.statItem,
              styles.scaleIn,
              (styles as Record<string, string>)[`d${index + 1}`]
            )}
          >
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
