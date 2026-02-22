import styles from './Logo.module.css';

export function Logo() {
  return (
    <div className={styles.logoFull}>
      <div className={styles.topRule} />
      <div className={styles.title}>ELOQUENT</div>
      <div className={styles.subtitle}>Das Wortduell seit MMXXV</div>
      <div className={styles.bottomRule} />
    </div>
  );
}

export function LogoCompact({ onClick }) {
  return (
    <div className={styles.logoCompact} onClick={onClick}>
      <span className={styles.titleCompact}>ELOQUENT</span>
      <span className={styles.subtitleCompact}>Wortduell</span>
    </div>
  );
}
