import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.root}>
      {/* Background layers */}
      <div className={styles.bg} />
      <div className={styles.noise} />
      <div className={styles.lights}>
        <div className={`${styles.light} ${styles.lightOne}`} />
        <div className={`${styles.light} ${styles.lightTwo}`} />
        <div className={`${styles.light} ${styles.lightThree}`} />
      </div>

      {/* Center card */}
      <div className={styles.card}>
        {/* Animated logo mark */}
        <div className={styles.logoWrap}>
          <div className={styles.logoRingPulse} />
          <div className={styles.logoRing} />
          <div className={styles.logoInner}>AC</div>
        </div>

        {/* Wordmark */}
        <div className={styles.wordmark}>
          <p className={styles.wordmarkTitle}>AutoChecker</p>
          <p className={styles.wordmarkSub}>Loading your workspace</p>
        </div>

        {/* Dot loader */}
        <div className={styles.dots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
