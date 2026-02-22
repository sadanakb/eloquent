import styles from './GoldBar.module.css';

export function GoldBar({ value, max, delay = 0 }) {
  const pct = max > 0 ? Math.min(value / max, 1) * 100 : 0;
  const colorClass = pct >= 70 ? styles.high : pct >= 40 ? styles.mid : styles.low;

  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${colorClass}`}
        style={{
          width: `${pct}%`,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}
