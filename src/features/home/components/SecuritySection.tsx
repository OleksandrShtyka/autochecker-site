import styles from "../styles";
import type { SecurityItem } from "../types";
import { cx } from "../utils";

type SecuritySectionProps = {
  securityItems: SecurityItem[];
};

export function SecuritySection({ securityItems }: SecuritySectionProps) {
  return (
    <section className={styles.security} id="security">
      <div className={styles.securityInner}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Security</span>
          <h2 className={styles.sectionTitle}>
            Smooth on the surface,
            <span className={styles.sectionMuted}> careful under the hood.</span>
          </h2>
        </div>

        <div className={styles.securityGrid}>
          {securityItems.map(([title, desc], index) => (
            <article
              key={title}
              className={cx(
                styles.securityCard,
                styles.fadeInUp,
                (styles as Record<string, string>)[`d${(index % 6) + 1}`]
              )}
            >
              <div className={styles.securityCardHeader}>
                <span className={styles.checkmark}>✓</span>
                <span className={styles.securityCardTitle}>{title}</span>
              </div>
              <p className={styles.securityCardDesc}>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
