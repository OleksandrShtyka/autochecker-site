import styles from "../styles";
import type { Feature } from "../types";
import { cx } from "../utils";

type FeaturesSectionProps = {
  features: Feature[];
  onOpenFeature: (feature: Feature) => void;
};

export function FeaturesSection({
  features,
  onOpenFeature,
}: FeaturesSectionProps) {
  return (
    <section className={styles.features} id="features">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTag}>Feature matrix</span>
        <h2 className={styles.sectionTitle}>
          Tap a glass card,
          <span className={styles.sectionMuted}> open the deeper story.</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Кожна картка тепер клікабельна: натискаєш на функцію і бачиш красиве
          меню з поясненням, для чого вона потрібна і що саме дає у реальній роботі.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((feature, index) => (
          <button
            key={feature.title}
            type="button"
            className={cx(
              styles.card,
              styles.scaleIn,
              (styles as Record<string, string>)[`d${(index % 6) + 1}`]
            )}
            onClick={() => onOpenFeature(feature)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>{feature.icon}</div>
              {feature.count !== null ? (
                <span className={styles.cardBadge}>{feature.count} cmds</span>
              ) : (
                <span className={styles.cardBadge}>dashboard</span>
              )}
            </div>
            <h3 className={styles.cardTitle}>{feature.title}</h3>
            <p className={styles.cardDesc}>{feature.desc}</p>
            <span className={styles.cardHint}>Open detailed view</span>
            <span className={styles.cardGlow} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
